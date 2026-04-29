import os
from sqlalchemy.orm import Session
from datetime import date, timedelta
from backend.database import SessionLocal, engine
from backend import models

# Удаляем старую базу (для пересоздания с новыми колонками)
if os.path.exists("./aloha.db"):
    os.remove("./aloha.db")

models.Base.metadata.create_all(bind=engine)

def seed_tours(db: Session):
    # Создание администратора
    from backend import auth
    admin_user = models.User(
        email="admin@alohatours.com",
        hashed_password=auth.get_password_hash("admin"),
        full_name="Администратор",
        role="manager"
    )
    db.add(admin_user)

    today = date.today()
    tours = [
        models.Tour(
            title="Неоновые ночи Майами",
            country="США",
            description="Погрузитесь в ретро-атмосферу 80-х в самом сердце Майами. Проживание в отеле Ocean Drive, прокат классического кабриолета и вечеринки у бассейна.",
            price=1500.00,
            start_date=today + timedelta(days=10),
            end_date=today + timedelta(days=20),
            capacity=15,
            image_url="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80"
        ),
        models.Tour(
            title="Райские острова Гавайи",
            country="США",
            description="Отдых на пляже Вайкики. Включены уроки серфинга, традиционные гавайские луау и коктейли на закате. Идеально для любителей Vaporwave эстетики.",
            price=2200.00,
            start_date=today + timedelta(days=30),
            end_date=today + timedelta(days=40),
            capacity=10,
            image_url="https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=800&q=80"
        ),
        models.Tour(
            title="Киберпанк Токио",
            country="Япония",
            description="Огни Акихабары и ретро-аркады ждут вас. Отель в Синдзюку, экскурсия по электронным рынкам и погружение в культуру ретро-гейминга.",
            price=1800.00,
            start_date=today + timedelta(days=15),
            end_date=today + timedelta(days=25),
            capacity=20,
            image_url="https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80"
        ),
        models.Tour(
            title="Кипр: Возвращение в 2007",
            country="Кипр",
            description="Классический курортный отдых Айя-Напы. Теплое море, ностальгические вечеринки и беззаботность старых добрых времен.",
            price=950.00,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=12),
            capacity=30,
            image_url="https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=800&q=80"
        ),
    ]

    for tour in tours:
        db.add(tour)
    
    db.commit()
    print("В базу данных успешно добавлены реальные туры с фотографиями!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_tours(db)
    finally:
        db.close()
