from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from backend import models, schemas, auth
from backend.database import engine, get_db

# Создание таблиц в БД
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="AlohaTours API", description="API для турагентства AlohaTours")

# Разрешаем CORS (для взаимодействия с фронтендом)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Настройка статики для фронтенда MVP ---
static_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/frontend", StaticFiles(directory=static_dir), name="frontend")

@app.get("/")
def serve_frontend():
    return FileResponse(os.path.join(static_dir, "index.html"))

# --- Маршруты авторизации ---
@app.post("/api/auth/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")
    
    hashed_password = auth.get_password_hash(user.password)
    # Первый зарегистрированный пользователь пусть будет менеджером для тестов
    is_first_user = db.query(models.User).count() == 0
    role = "manager" if is_first_user else "client"
    
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        phone=user.phone,
        role=role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный email или пароль",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Маршруты каталога туров ---
@app.get("/api/tours/", response_model=List[schemas.TourResponse])
def get_active_tours(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tours = db.query(models.Tour).filter(models.Tour.is_active == True).offset(skip).limit(limit).all()
    return tours

@app.get("/api/tours/{tour_id}", response_model=schemas.TourResponse)
def get_tour(tour_id: int, db: Session = Depends(get_db)):
    tour = db.query(models.Tour).filter(models.Tour.id == tour_id, models.Tour.is_active == True).first()
    if tour is None:
        raise HTTPException(status_code=404, detail="Тур не найден")
    return tour

@app.post("/api/tours/", response_model=schemas.TourResponse)
def create_tour(tour: schemas.TourCreate, db: Session = Depends(get_db), current_manager: models.User = Depends(auth.get_current_manager)):
    db_tour = models.Tour(**tour.dict())
    db.add(db_tour)
    db.commit()
    db.refresh(db_tour)
    return db_tour

@app.put("/api/tours/{tour_id}", response_model=schemas.TourResponse)
def update_tour(tour_id: int, tour_update: schemas.TourUpdate, db: Session = Depends(get_db), current_manager: models.User = Depends(auth.get_current_manager)):
    db_tour = db.query(models.Tour).filter(models.Tour.id == tour_id).first()
    if not db_tour:
        raise HTTPException(status_code=404, detail="Тур не найден")
    
    update_data = tour_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tour, key, value)
        
    db.commit()
    db.refresh(db_tour)
    return db_tour

# --- Маршруты бронирования ---
@app.post("/api/orders/", response_model=schemas.OrderResponse)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    tour = db.query(models.Tour).filter(models.Tour.id == order.tour_id).first()
    if not tour or not tour.is_active:
        raise HTTPException(status_code=404, detail="Тур не найден или неактивен")
    
    db_order = models.Order(
        user_id=current_user.id,
        tour_id=order.tour_id,
        fixed_price=tour.price
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

@app.get("/api/orders/my", response_model=List[schemas.OrderResponse])
def get_my_orders(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    orders = db.query(models.Order).filter(models.Order.user_id == current_user.id).all()
    return orders

@app.get("/api/orders/", response_model=List[schemas.OrderResponse])
def get_all_orders(db: Session = Depends(get_db), current_manager: models.User = Depends(auth.get_current_manager)):
    orders = db.query(models.Order).all()
    return orders

@app.patch("/api/orders/{order_id}/status", response_model=schemas.OrderResponse)
def update_order_status(order_id: int, status_update: schemas.OrderStatusUpdate, db: Session = Depends(get_db), current_manager: models.User = Depends(auth.get_current_manager)):
    db_order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Бронирование не найдено")
    
    db_order.status = status_update.status
    db.commit()
    db.refresh(db_order)
    return db_order
