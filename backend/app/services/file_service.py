"""
File upload handling for profile pictures, hotel/room/tour images, license
documents, travel documents, and message attachments. Files are validated
for type/size and stored under UPLOAD_DIR, served back via /uploads/*.
"""
import os
import uuid

from fastapi import UploadFile

from app.config import settings
from app.utils.exceptions import bad_request

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_DOCUMENT_TYPES = ALLOWED_IMAGE_TYPES | {"application/pdf"}


def _save(file: UploadFile, subfolder: str, allowed_types: set[str]) -> str:
    if file.content_type not in allowed_types:
        raise bad_request(f"Unsupported file type: {file.content_type}")

    contents = file.file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(contents) > max_bytes:
        raise bad_request(f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB}MB upload limit")

    ext = os.path.splitext(file.filename or "")[1] or ".bin"
    filename = f"{uuid.uuid4().hex}{ext}"
    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)
    path = os.path.join(folder, filename)
    with open(path, "wb") as f:
        f.write(contents)

    return f"/uploads/{subfolder}/{filename}"


def save_image(file: UploadFile, subfolder: str) -> str:
    return _save(file, subfolder, ALLOWED_IMAGE_TYPES)


def save_document(file: UploadFile, subfolder: str) -> str:
    return _save(file, subfolder, ALLOWED_DOCUMENT_TYPES)
