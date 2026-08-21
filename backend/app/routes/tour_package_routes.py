"""Tour package setup and publishing."""

import json

from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.tour import TourOperator, TourPackage
from app.models.enums import UserRole
from app.schemas.tour import (
    TourPackageCreate,
    TourPackageUpdate,
    TourPackageOut,
)
from app.schemas.common import Msg
from app.services.file_service import save_image
from app.utils.exceptions import not_found, forbidden
from app.utils.pagination import paginate, Page


router = APIRouter(
    prefix="/tour-packages",
    tags=["Tour Package Management"],
)


# ============================================================
# HELPERS
# ============================================================

def _get_my_operator(
    db: Session,
    user: User,
) -> TourOperator:

    operator = (
        db.query(TourOperator)
        .filter(TourOperator.user_id == user.id)
        .first()
    )

    if not operator:
        raise not_found(
            "Operator profile — register as a tour operator first"
        )

    return operator


def _json_dump_list(value):
    """
    Convert a Python list into JSON text for MySQL TEXT columns.
    """
    if value is None:
        return None

    if isinstance(value, str):
        return value

    return json.dumps(value)


# ============================================================
# LIST PACKAGES
# ============================================================

@router.get(
    "",
    response_model=Page[TourPackageOut],
)
def list_packages(
    published_only: bool = True,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = db.query(TourPackage)

    if published_only:
        query = query.filter(
            TourPackage.is_published == True
        )

    query = query.order_by(
        TourPackage.created_at.desc()
    )

    items, total, page, page_size, total_pages = paginate(
        query,
        page,
        page_size,
    )

    return Page(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


# ============================================================
# MY PACKAGES
# ============================================================

@router.get(
    "/mine",
    response_model=list[TourPackageOut],
)
def list_my_packages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operator = _get_my_operator(
        db,
        current_user,
    )

    return (
        db.query(TourPackage)
        .filter(
            TourPackage.operator_id == operator.id
        )
        .order_by(
            TourPackage.created_at.desc()
        )
        .all()
    )


# ============================================================
# GET SINGLE PACKAGE
# ============================================================

@router.get(
    "/{package_id}",
    response_model=TourPackageOut,
)
def get_package(
    package_id: int,
    db: Session = Depends(get_db),
):
    package = db.get(
        TourPackage,
        package_id,
    )

    if not package:
        raise not_found("Tour package")

    return package


# ============================================================
# CREATE PACKAGE
# ============================================================

@router.post(
    "",
    response_model=TourPackageOut,
    status_code=201,
)
def create_package(
    payload: TourPackageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    operator = _get_my_operator(
        db,
        current_user,
    )

    data = payload.model_dump()

    # Extract JSON fields
    included = data.pop(
        "included_services",
        None,
    )

    excluded = data.pop(
        "excluded_services",
        None,
    )

    images = data.pop(
        "images",
        None,
    )

    # Convert Python lists -> JSON strings
    package = TourPackage(
        operator_id=operator.id,

        included_services=_json_dump_list(
            included
        ),

        excluded_services=_json_dump_list(
            excluded
        ),

        images=_json_dump_list(
            images
        ),

        **data,
    )

    db.add(package)

    db.commit()

    db.refresh(package)

    return package


# ============================================================
# UPDATE PACKAGE
# ============================================================

@router.put(
    "/{package_id}",
    response_model=TourPackageOut,
)
def update_package(
    package_id: int,
    payload: TourPackageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    package = db.get(
        TourPackage,
        package_id,
    )

    if not package:
        raise not_found("Tour package")

    # --------------------------------------------------------
    # Ownership check
    # --------------------------------------------------------

    operator = (
        _get_my_operator(
            db,
            current_user,
        )
        if current_user.role != UserRole.ADMIN
        else None
    )

    if operator and package.operator_id != operator.id:
        raise forbidden()

    # --------------------------------------------------------
    # Get only fields supplied by frontend
    # --------------------------------------------------------

    data = payload.model_dump(
        exclude_unset=True
    )

    # --------------------------------------------------------
    # JSON fields
    # --------------------------------------------------------

    if "included_services" in data:
        package.included_services = _json_dump_list(
            data.pop("included_services")
        )

    if "excluded_services" in data:
        package.excluded_services = _json_dump_list(
            data.pop("excluded_services")
        )

    if "images" in data:
        package.images = _json_dump_list(
            data.pop("images")
        )

    # --------------------------------------------------------
    # Normal fields
    # --------------------------------------------------------

    for field, value in data.items():
        setattr(
            package,
            field,
            value,
        )

    db.commit()

    db.refresh(package)

    return package


# ============================================================
# PUBLISH / UNPUBLISH
# ============================================================

@router.put(
    "/{package_id}/publish",
    response_model=TourPackageOut,
)
def publish_package(
    package_id: int,
    publish: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    package = db.get(
        TourPackage,
        package_id,
    )

    if not package:
        raise not_found("Tour package")

    operator = (
        _get_my_operator(
            db,
            current_user,
        )
        if current_user.role != UserRole.ADMIN
        else None
    )

    if operator and package.operator_id != operator.id:
        raise forbidden()

    package.is_published = publish

    db.commit()

    db.refresh(package)

    return package


# ============================================================
# UPLOAD IMAGE
#
# This endpoint is kept for backward compatibility.
# The new frontend will use image URLs directly.
# ============================================================

@router.post(
    "/{package_id}/images",
    response_model=TourPackageOut,
)
def upload_package_image(
    package_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    package = db.get(
        TourPackage,
        package_id,
    )

    if not package:
        raise not_found("Tour package")

    operator = (
        _get_my_operator(
            db,
            current_user,
        )
        if current_user.role != UserRole.ADMIN
        else None
    )

    if operator and package.operator_id != operator.id:
        raise forbidden()

    url = save_image(
        file,
        "tour-packages",
    )

    # First uploaded image becomes cover image
    if not package.cover_image_url:
        package.cover_image_url = url

    images = (
        json.loads(package.images)
        if package.images
        else []
    )

    images.append(url)

    package.images = json.dumps(
        images
    )

    db.commit()

    db.refresh(package)

    return package


# ============================================================
# DELETE / UNPUBLISH PACKAGE
# ============================================================

@router.delete(
    "/{package_id}",
    response_model=Msg,
)
def delete_package(
    package_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    package = db.get(
        TourPackage,
        package_id,
    )

    if not package:
        raise not_found("Tour package")

    operator = (
        _get_my_operator(
            db,
            current_user,
        )
        if current_user.role != UserRole.ADMIN
        else None
    )

    if operator and package.operator_id != operator.id:
        raise forbidden()

    # Existing behavior: unpublish rather than physically delete
    package.is_published = False

    db.commit()

    return Msg(
        message="Package unpublished"
    )
