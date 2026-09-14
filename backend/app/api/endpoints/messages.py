from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import List, Dict, Any
from datetime import datetime

from app.database import get_db
from app.models.message import Message
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class MessageCreate(BaseModel):
    receiver_id: int
    content: str

class MessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    content: str
    created_at: datetime
    read: bool
    sender_name: str
    receiver_name: str

    class Config:
        from_attributes = True

@router.post("/", response_model=MessageResponse)
def send_message(msg: MessageCreate, sender_id: int, db: Session = Depends(get_db)):
    # Note: In a real app with JWT, sender_id would come from the current_user token.
    # Here we simulate by passing it as query param or we assume it's part of the request.
    # To simplify, we'll just require sender_id in the query for this endpoint.
    
    sender = db.query(User).filter(User.id == sender_id).first()
    receiver = db.query(User).filter(User.id == msg.receiver_id).first()
    
    if not sender or not receiver:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    new_msg = Message(
        sender_id=sender_id,
        receiver_id=msg.receiver_id,
        content=msg.content
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)
    
    return {
        "id": new_msg.id,
        "sender_id": new_msg.sender_id,
        "receiver_id": new_msg.receiver_id,
        "content": new_msg.content,
        "created_at": new_msg.created_at,
        "read": new_msg.read,
        "sender_name": sender.name,
        "receiver_name": receiver.name
    }

@router.get("/conversation/{user1_id}/{user2_id}", response_model=List[MessageResponse])
def get_conversation(user1_id: int, user2_id: int, db: Session = Depends(get_db)):
    messages = db.query(Message).filter(
        or_(
            and_(Message.sender_id == user1_id, Message.receiver_id == user2_id),
            and_(Message.sender_id == user2_id, Message.receiver_id == user1_id)
        )
    ).order_by(Message.created_at.asc()).all()
    
    # Mark as read if user2 sent them to user1
    # For MVP we just return them
    result = []
    for m in messages:
        sender = db.query(User).filter(User.id == m.sender_id).first()
        receiver = db.query(User).filter(User.id == m.receiver_id).first()
        result.append({
            "id": m.id,
            "sender_id": m.sender_id,
            "receiver_id": m.receiver_id,
            "content": m.content,
            "created_at": m.created_at,
            "read": m.read,
            "sender_name": sender.name if sender else "Unknown",
            "receiver_name": receiver.name if receiver else "Unknown"
        })
    return result

@router.get("/inbox/{user_id}")
def get_inbox(user_id: int, db: Session = Depends(get_db)):
    # Get all users with whom the current user has exchanged messages
    messages = db.query(Message).filter(
        or_(Message.sender_id == user_id, Message.receiver_id == user_id)
    ).order_by(Message.created_at.desc()).all()
    
    # Group by contact
    contacts = {}
    for m in messages:
        contact_id = m.sender_id if m.sender_id != user_id else m.receiver_id
        if contact_id not in contacts:
            contact_user = db.query(User).filter(User.id == contact_id).first()
            if contact_user:
                contacts[contact_id] = {
                    "contact_id": contact_id,
                    "contact_name": contact_user.name,
                    "contact_role": contact_user.role.value,
                    "contact_photo": contact_user.photo_url,
                    "last_message": m.content,
                    "last_message_time": m.created_at,
                    "unread": not m.read and m.receiver_id == user_id
                }
    
    return list(contacts.values())
