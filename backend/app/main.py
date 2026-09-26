from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import (
    auth,
    customers,
    insurers,
    admin,
    plans,
    applications,
    policies,
    queries,
    notifications,
    marketplace,
    claims,
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for InsurManage Insurance Management System",
    version="1.0.0"
)

# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME
    }

# Register API Routers under /api
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(customers.router, prefix=api_prefix)
app.include_router(insurers.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(plans.router, prefix=api_prefix)
app.include_router(marketplace.router, prefix=api_prefix)
app.include_router(applications.router, prefix=api_prefix)
app.include_router(policies.router, prefix=api_prefix)
app.include_router(queries.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(claims.router, prefix=api_prefix)


