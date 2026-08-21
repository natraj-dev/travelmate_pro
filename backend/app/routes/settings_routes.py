"""Platform settings and configuration."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.platform_settings import PlatformSetting
from app.schemas.platform_settings import PlatformSettingUpdate, PlatformSettingOut
from app.schemas.common import Msg
from app.config import settings as env_settings
from app.utils.exceptions import not_found

router = APIRouter(prefix="/settings", tags=["Platform Settings"])


@router.get("", response_model=list[PlatformSettingOut])
def list_settings(category: str | None = None, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    query = db.query(PlatformSetting)
    if category:
        query = query.filter(PlatformSetting.category == category.upper())
    settings_list = query.order_by(PlatformSetting.category, PlatformSetting.key).all()
    for s in settings_list:
        if s.is_secret and s.value:
            s.value = "•" * 8
    return settings_list


@router.put("", response_model=PlatformSettingOut)
def upsert_setting(payload: PlatformSettingUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    setting = db.query(PlatformSetting).filter(
        PlatformSetting.category == payload.category.upper(), PlatformSetting.key == payload.key
    ).first()
    if setting:
        setting.value = payload.value
        setting.value_type = payload.value_type
        setting.description = payload.description
        setting.is_secret = payload.is_secret
    else:
        setting = PlatformSetting(category=payload.category.upper(), **payload.model_dump(exclude={"category"}))
        db.add(setting)
    db.commit()
    db.refresh(setting)
    return setting


@router.delete("/{setting_id}", response_model=Msg)
def delete_setting(setting_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    setting = db.get(PlatformSetting, setting_id)
    if not setting:
        raise not_found("Setting")
    db.delete(setting)
    db.commit()
    return Msg(message="Setting deleted")


@router.get("/platform-info")
def platform_info(current_user: User = Depends(require_admin)):
    """Read-only snapshot of the environment-level configuration currently in effect."""
    return {
        "app_name": env_settings.APP_NAME,
        "app_version": env_settings.APP_VERSION,
        "default_commission_percent": env_settings.DEFAULT_COMMISSION_PERCENT,
        "default_tax_percent": env_settings.DEFAULT_TAX_PERCENT,
        "stripe_configured": bool(env_settings.STRIPE_SECRET_KEY),
        "google_maps_configured": bool(env_settings.GOOGLE_MAPS_API_KEY),
        "smtp_configured": bool(env_settings.SMTP_HOST),
        "ai_engine": "Ollama (local)",
        "ai_model": env_settings.OLLAMA_MODEL,
        "ai_base_url": env_settings.OLLAMA_BASE_URL,
    }
