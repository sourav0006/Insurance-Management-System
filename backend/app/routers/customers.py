from fastapi import APIRouter
from app.models.user import User

router = APIRouter(prefix="/customers", tags=["Customers"])
