from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Date, Numeric, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(String(20), default="client")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    orders = relationship("Order", back_populates="user")

class Tour(Base):
    __tablename__ = "tours"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    country = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    capacity = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)

    orders = relationship("Order", back_populates="tour")

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    tour_id = Column(Integer, ForeignKey("tours.id"))
    status = Column(String(50), default="pending")
    order_date = Column(DateTime(timezone=True), server_default=func.now())
    fixed_price = Column(Numeric(10, 2), nullable=True)

    user = relationship("User", back_populates="orders")
    tour = relationship("Tour", back_populates="orders")
