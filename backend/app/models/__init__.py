from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, EmailStr


class ShippingAddress(BaseModel):
    id: str
    title: str
    city: str
    address: str
    is_default: bool = False


class SignUpPayload(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: str


class SignInPayload(BaseModel):
    email: EmailStr
    password: str


class UpdateProfilePayload(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    addresses: Optional[List[ShippingAddress]] = None


class TokenBundle(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None


class AuthResult(BaseModel):
    message: str
    session: Optional[TokenBundle] = None
    user: Optional[Dict[str, Any]] = None


OrderStatusLiteral = Literal[
    "На рассмотрении",
    "Ждет оплаты",
    "Одобрен",
    "Отклонен",
]

PaymentStatusLiteral = Literal[
    "Не оплачен",
    "Оплачен",
    "Отменен",
    "Ошибка",
]

class OrderItemPayload(BaseModel):
    id: str
    name: str
    price: int
    quantity: int
    image: Optional[str] = None


class OrderShippingAddress(BaseModel):
    id: Optional[str] = None
    title: str
    city: Optional[str] = None
    address: str
    comment: Optional[str] = None


class CreateOrderPayload(BaseModel):
    items: List[OrderItemPayload]
    shipping_address: OrderShippingAddress
    currency: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None


class UpdateOrderPayload(BaseModel):
    status: Optional[OrderStatusLiteral] = None
    currency: Optional[str] = None
    total_cost: Optional[int] = None
    items: Optional[List[OrderItemPayload]] = None
    shipping_address: Optional[OrderShippingAddress] = None
    tracking_code: Optional[str] = None


class OrderUser(BaseModel):
    id: str
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    phone: Optional[str] = None


# class OrderResult(BaseModel):
#     id: int
#     user_id: str
#     user: OrderUser
#     status: OrderStatusLiteral
#     currency: str
#     total_cost: int
#     items: List[OrderItemPayload]
#     shipping_address: Optional[OrderShippingAddress] = None
#     created_at: datetime


class OrderResult(BaseModel):
    id: int
    user_id: str
    user: OrderUser
    status: OrderStatusLiteral
    currency: str
    total_cost: int
    items: List[OrderItemPayload]
    shipping_address: Optional[OrderShippingAddress] = None

    payment_status: PaymentStatusLiteral
    tracking_code: Optional[str] = None

    created_at: datetime
