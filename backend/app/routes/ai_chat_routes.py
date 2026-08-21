"""Travel assistant chat and support conversations."""
from fastapi import APIRouter, Depends
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.ai import AIConversation, AIMessage
from app.models.enums import AIRole
from app.schemas.ai import AIChatRequest, AIChatResponse, AIConversationOut
from app.schemas.common import Msg
from app.services.ai_service import get_chat_reply, AIServiceError
from app.config import settings
from app.utils.exceptions import not_found, forbidden, bad_request
from fastapi import Request

router = APIRouter(prefix="/ai/chat", tags=["AI Travel Chatbot"])
limiter = Limiter(key_func=get_remote_address)


@router.get("/conversations", response_model=list[AIConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(AIConversation)
        .options(joinedload(AIConversation.messages))
        .filter(AIConversation.user_id == current_user.id)
        .order_by(AIConversation.created_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}", response_model=AIConversationOut)
def get_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.query(AIConversation).options(joinedload(AIConversation.messages)).filter(AIConversation.id == conversation_id).first()
    if not convo:
        raise not_found("Conversation")
    if convo.user_id != current_user.id:
        raise forbidden()
    return convo


@router.post("/message", response_model=AIChatResponse)
@limiter.limit(settings.RATE_LIMIT_AI)
async def send_message(request: Request, payload: AIChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.conversation_id:
        conversation = db.get(AIConversation, payload.conversation_id)
        if not conversation or conversation.user_id != current_user.id:
            raise not_found("Conversation")
    else:
        title = payload.message[:60] + ("..." if len(payload.message) > 60 else "")
        conversation = AIConversation(user_id=current_user.id, title=title or "New conversation")
        db.add(conversation)
        db.flush()

    history = db.query(AIMessage).filter(AIMessage.conversation_id == conversation.id).order_by(AIMessage.created_at).all()
    history_dicts = [{"role": m.role.value, "content": m.content} for m in history]

    user_msg = AIMessage(conversation_id=conversation.id, role=AIRole.USER, content=payload.message)
    db.add(user_msg)
    db.commit()

    try:
        reply = await get_chat_reply(history_dicts, payload.message)
    except AIServiceError as exc:
        raise bad_request(str(exc))

    assistant_msg = AIMessage(conversation_id=conversation.id, role=AIRole.ASSISTANT, content=reply)
    db.add(assistant_msg)
    db.commit()

    return AIChatResponse(conversation_id=conversation.id, reply=reply)


@router.delete("/conversations/{conversation_id}", response_model=Msg)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.get(AIConversation, conversation_id)
    if not convo:
        raise not_found("Conversation")
    if convo.user_id != current_user.id:
        raise forbidden()
    db.delete(convo)
    db.commit()
    return Msg(message="Conversation deleted")
