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

    import random
    
    today = date.today()
    origins = ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург", "Новосибирск"]
    destinations = [
        {"country": "Турция", "resorts": ["Анталья", "Аланья", "Кемер", "Мармарис", "Бодрум"]},
        {"country": "Египет", "resorts": ["Шарм-эль-Шейх", "Хургада"]},
        {"country": "ОАЭ", "resorts": ["Дубай", "Абу-Даби", "Шарджа"]},
        {"country": "Мальдивы", "resorts": ["Мале", "Ари Атолл"]},
        {"country": "Таиланд", "resorts": ["Пхукет", "Паттайя", "Самуи"]}
    ]
    
    hotel_names_prefixes = ["Grand", "Royal", "Sunset", "Crystal", "Mirage", "Ocean", "Palm", "Neon"]
    hotel_names_suffixes = ["Resort & Spa", "Palace", "Beach Hotel", "Premium", "Village", "Plaza"]
    
    board_types = ["RO", "BB", "HB", "FB", "AI", "UAI"]
    
    images = [
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1542259009477-d625272157b7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1551882547-ff40c0d509af?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1574643156929-51fa098b0394?auto=format&fit=crop&w=800&q=80"
    ]

    tours = []
    
    for i in range(1, 101):
        dest = random.choice(destinations)
        resort = random.choice(dest["resorts"])
        origin = random.choice(origins)
        
        hotel_name = f"{random.choice(hotel_names_prefixes)} {random.choice(hotel_names_suffixes)}"
        hotel_stars = random.choice([3, 4, 5, 5])
        board = random.choice(board_types)
        
        nights = random.choice([3, 5, 7, 10, 14])
        start_offset = random.randint(1, 60)
        start_date = today + timedelta(days=start_offset)
        end_date = start_date + timedelta(days=nights)
        
        # Цена зависит от звездности и ночей
        base_price = random.randint(500, 1500)
        price = base_price + (hotel_stars * 100) + (nights * 80)
        
        tour = models.Tour(
            title=f"{hotel_name} {hotel_stars}*",
            country=dest["country"],
            resort=resort,
            origin_city=origin,
            hotel_name=hotel_name,
            hotel_stars=hotel_stars,
            board_type=board,
            nights=nights,
            description=f"Отличный тур из г. {origin} в {dest['country']} ({resort}). Проживание в {hotel_name} {hotel_stars}*. Питание: {board}.",
            price=price,
            start_date=start_date,
            end_date=end_date,
            capacity=random.randint(2, 20),
            image_url=random.choice(images)
        )
        tours.append(tour)

    for tour in tours:
        db.add(tour)
    
    properties = []
    prop_types = ["Вилла", "Апартаменты", "Коттедж", "Пентхаус", "Бунгало", "Резиденция"]
    prop_locations = ["Малибу, Калифорния", "Токио, Япония", "Оаху, Гавайи", "Бали, Индонезия", "Пхукет, Таиланд", "Дубай, ОАЭ", "Анталья, Турция", "Мале, Мальдивы", "Лимассол, Кипр"]
    prop_adjs = ["Luxury", "Ocean View", "Sunset", "Tropical", "Neon", "Cyber", "Royal", "Premium", "Cyberpunk", "Vaporwave"]

    for i in range(1, 31):
        ptype = random.choice(prop_types)
        ploc = random.choice(prop_locations)
        padj = random.choice(prop_adjs)
        
        prop = models.Property(
            title=f"{padj} {ptype} in {ploc.split(',')[0]}",
            location=ploc,
            description=f"Роскошный объект недвижимости ({ptype}) для аренды. Отличный вид, современный дизайн и максимальный комфорт.",
            price_per_night=random.randint(100, 1000),
            capacity=random.randint(2, 12),
            image_url=random.choice(images)
        )
        properties.append(prop)
    for prop in properties:
        db.add(prop)
        
    db.commit()
    print("В БД успешно добавлены тестовые туры и объекты недвижимости!")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_tours(db)
    finally:
        db.close()
