"""Customer profile management and account details."""
import json
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserOut, UserUpdateRequest
from app.services.file_service import save_image

router = APIRouter(prefix="/profile", tags=["Customer Profile"])


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_my_profile(payload: UserUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/picture", response_model=UserOut)
def upload_profile_picture(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    url = save_image(file, "profile-pictures")
    current_user.profile_picture_url = url
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me/preferences")
def get_travel_preferences(current_user: User = Depends(get_current_user)):
    try:
        return {"preferences": json.loads(current_user.travel_preferences) if current_user.travel_preferences else []}
    except json.JSONDecodeError:
        return {"preferences": []}


@router.put("/me/preferences")
def update_travel_preferences(preferences: list[str], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    current_user.travel_preferences = json.dumps(preferences)
    db.commit()
    return {"preferences": preferences}
