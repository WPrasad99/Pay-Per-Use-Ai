from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from app.database import create_user, get_user

router = APIRouter(tags=["Users"])

class UserCreate(BaseModel):
    wallet_address: str
    name: str
    dob: str
    email: EmailStr

    @validator('dob')
    def validate_dob(cls, v):
        try:
            dob_date = datetime.strptime(v, '%Y-%m-%d')
            today = datetime.today()
            age = today.year - dob_date.year - ((today.month, today.day) < (dob_date.month, dob_date.day))
            if age < 18:
                raise ValueError('User must be at least 18 years old')
        except ValueError as e:
            if "User must be at least 18" in str(e):
                raise e
            raise ValueError("Invalid DOB format. Use YYYY-MM-DD")
        return v

    @validator('name')
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        return v

@router.post("/users", response_model=dict)
async def register_user(user: UserCreate):
    existing_user = await get_user(user.wallet_address)
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    await create_user(
        wallet_address=user.wallet_address,
        name=user.name,
        dob=user.dob,
        email=user.email
    )
    return {"message": "User registered successfully"}

@router.get("/users/{wallet_address}")
async def get_user_profile(wallet_address: str):
    user = await get_user(wallet_address)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "wallet_address": user["wallet_address"],
        "name": user["name"],
        "dob": user["dob"],
        "email": user["email"],
        "created_at": str(user["created_at"])
    }

@router.get("/{wallet_address}/analytics")
async def get_analytics(wallet_address: str):
    from app.database import get_user_analytics
    return await get_user_analytics(wallet_address)
