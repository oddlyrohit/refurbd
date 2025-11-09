# app/main.py
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

from app.core.config import settings
from app.db.session import init_db
from app.api.routes import auth, projects, billing, renderings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup
    print("🚀 Starting Home Renovation AI SaaS...")

    # Ensure upload directory exists
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Initialize database (non-blocking safety)
    await init_db()
    print("✅ Database initialized")

    yield

    # Shutdown
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    # Show docs only in development
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# ---------------------------
# Health endpoints (no deps)
# ---------------------------
@app.get("/__health", include_in_schema=False)
def __health():
    # Plain text, zero dependencies; always 200
    return PlainTextResponse("ok")

@app.get("/health", include_in_schema=False)
def health_root():
    return {"ok": True, "version": settings.VERSION, "env": settings.ENVIRONMENT}

@app.get("/api/health", include_in_schema=False)
def health_api():
    return {"ok": True, "version": settings.VERSION, "env": settings.ENVIRONMENT}

# ---------------------------
# CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=(settings.BACKEND_CORS_ORIGINS or []) + [settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Global exception handler
# ---------------------------
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global exception: {exc}")
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ---------------------------
# API routers
# ---------------------------
app.include_router(auth.router,      prefix=settings.API_V1_STR)
app.include_router(projects.router,  prefix=settings.API_V1_STR)
app.include_router(billing.router,   prefix=settings.API_V1_STR)
app.include_router(renderings.router, prefix=settings.API_V1_STR)

# ---------------------------
# Root
# ---------------------------
@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Home Renovation AI API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.ENVIRONMENT == "development" else None,
    }
