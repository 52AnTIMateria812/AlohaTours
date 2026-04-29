from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from decimal import Decimal

# --- Пользователи ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    phone: Optional[str]
    role: str

    class Config:
        from_attributes = True

# --- Туры ---
class TourBase(BaseModel):
    title: str
    country: str
    description: Optional[str] = None
    price: Decimal
    start_date: date
    end_date: date
    capacity: int
    is_active: bool = True
    image_url: Optional[str] = None

class TourCreate(TourBase):
    pass

class TourUpdate(BaseModel):
    title: Optional[str] = None
    country: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    capacity: Optional[int] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None

class TourResponse(TourBase):
    id: int

    class Config:
        from_attributes = True

# --- Заявки (Бронирования) ---
class OrderCreate(BaseModel):
    tour_id: int
    people_count: int = 1

class OrderStatusUpdate(BaseModel):
    status: str

class OrderResponse(BaseModel):
    id: int
    user_id: int
    tour_id: int
    people_count: int
    status: str
    order_date: datetime
    fixed_price: Optional[Decimal]
    
    tour: Optional[TourResponse] = None

    class Config:
        from_attributes = True

# --- Админские схемы (Пользователи + их заявки) ---
class UserWithOrdersResponse(UserResponse):
    orders: List[OrderResponse] = []

    class Config:
        from_attributes = True

# --- Авторизация ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
