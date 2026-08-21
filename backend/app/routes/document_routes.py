"""Travel document uploads and document management."""
from fastapi import APIRouter, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.models.document import TravelDocument
from app.models.enums import DocumentType
from app.schemas.document import TravelDocumentOut
from app.schemas.common import Msg
from app.services.file_service import save_document
from app.utils.exceptions import not_found, forbidden

router = APIRouter(prefix="/documents", tags=["Travel Documents"])


@router.get("", response_model=list[TravelDocumentOut])
def list_my_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(TravelDocument).filter(TravelDocument.user_id == current_user.id).order_by(TravelDocument.created_at.desc()).all()


@router.post("", response_model=TravelDocumentOut, status_code=201)
def upload_document(
    document_type: DocumentType = Form(...),
    document_number: str = Form(None),
    issuing_country: str = Form(None),
    expiry_date: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user),
):
    from datetime import datetime
    url = save_document(file, "travel-documents")
    document = TravelDocument(
        user_id=current_user.id, document_type=document_type, document_number=document_number,
        issuing_country=issuing_country, file_url=url,
        expiry_date=datetime.fromisoformat(expiry_date) if expiry_date else None,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.delete("/{document_id}", response_model=Msg)
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    document = db.get(TravelDocument, document_id)
    if not document:
        raise not_found("Document")
    if document.user_id != current_user.id:
        raise forbidden()
    db.delete(document)
    db.commit()
    return Msg(message="Document deleted")


@router.put("/{document_id}/verify", response_model=TravelDocumentOut)
def verify_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    document = db.get(TravelDocument, document_id)
    if not document:
        raise not_found("Document")
    document.is_verified = True
    document.verified_by_id = current_user.id
    db.commit()
    db.refresh(document)
    return document
