from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.routers.auth import router as auth_router
from backend.app.routers.orders import router as orders_router
from backend.app.routers.catalog import router as catalog_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(orders_router, prefix="/api/orders", tags=["orders"])
app.include_router(catalog_router, prefix="/api/catalog", tags=["catalog"])
