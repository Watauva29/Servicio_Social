from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models.settings import GlobalSettings

router = APIRouter()

class SettingUpdate(BaseModel):
    value: str
    description: str = None

class SettingResponse(BaseModel):
    key: str
    value: str
    description: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[SettingResponse])
def get_all_settings(db: Session = Depends(get_db)):
    return db.query(GlobalSettings).all()

@router.put("/{key}", response_model=SettingResponse)
def update_setting(key: str, setting: SettingUpdate, db: Session = Depends(get_db)):
    db_setting = db.query(GlobalSettings).filter(GlobalSettings.key == key).first()
    if not db_setting:
        # Create it if it doesn't exist
        db_setting = GlobalSettings(key=key, value=setting.value, description=setting.description)
        db.add(db_setting)
    else:
        db_setting.value = setting.value
        if setting.description:
            db_setting.description = setting.description
            
    db.commit()
    db.refresh(db_setting)
    return db_setting
