"""Role-based access control and permission management."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User, Permission, RolePermission
from app.schemas.auth import PermissionOut, RoleAssignRequest, RolePermissionRequest
from app.schemas.common import Msg
from app.models.enums import UserRole
from app.utils.exceptions import not_found, conflict
from app.utils.audit import log_action

router = APIRouter(prefix="/rbac", tags=["RBAC"])


@router.get("/roles", response_model=list[str])
def list_roles(current_user: User = Depends(require_admin)):
    return [r.value for r in UserRole]


@router.get("/permissions", response_model=list[PermissionOut])
def list_permissions(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Permission).order_by(Permission.code).all()


@router.post("/permissions", response_model=PermissionOut, status_code=201)
def create_permission(code: str, description: str = "", db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    if db.query(Permission).filter(Permission.code == code).first():
        raise conflict("Permission code already exists")
    perm = Permission(code=code, description=description)
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


@router.post("/role-permissions", response_model=Msg)
def assign_permission_to_role(payload: RolePermissionRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    permission = db.query(Permission).filter(Permission.code == payload.permission_code).first()
    if not permission:
        raise not_found("Permission")
    exists = db.query(RolePermission).filter(
        RolePermission.role == payload.role, RolePermission.permission_id == permission.id
    ).first()
    if exists:
        raise conflict("This role already has this permission")
    db.add(RolePermission(role=payload.role, permission_id=permission.id))
    db.commit()
    log_action(db, current_user.id, "ROLE_PERMISSION_ASSIGNED", "RolePermission", permission.id,
               {"role": payload.role.value, "permission": payload.permission_code})
    return Msg(message="Permission assigned to role")


@router.get("/role-permissions/{role}", response_model=list[PermissionOut])
def get_role_permissions(role: UserRole, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    links = db.query(RolePermission).filter(RolePermission.role == role).all()
    return [link.permission for link in links]


@router.put("/users/{user_id}/role", response_model=Msg)
def assign_user_role(user_id: int, payload: RoleAssignRequest, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    user = db.get(User, user_id)
    if not user:
        raise not_found("User")
    old_role = user.role.value
    user.role = payload.role
    db.commit()
    log_action(db, current_user.id, "USER_ROLE_CHANGED", "User", user_id, {"from": old_role, "to": payload.role.value})
    return Msg(message=f"User role updated to {payload.role.value}")
