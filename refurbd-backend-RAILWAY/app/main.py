import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from starlette.middleware.trustedhost import TrustedHostMiddleware
except Exception:  # pragma: no cover
    TrustedHostMiddleware = None  # optional

# ---------------------------
# App
# ---------------------------
app = FastAPI(title="Refurbd API")

# ---------------------------
# Health endpoints
# ---------------------------
@app.get("/health", include_in_schema=False)
async def _health():
    return {"ok": True, "service": "refurbd-backend"}

@app.get("/healthz", include_in_schema=False)
async def _healthz():
    return PlainTextResponse("ok", status_code=200)

# ---------------------------
# CORS
# ---------------------------
default_allow = "http://localhost:3000,https://*.vercel.app,https://refurbd.com.au,https://www.refurbd.com.au"
allow_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", default_allow).split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Trusted hosts (for Railway)
# ---------------------------
default_hosts = "*.up.railway.app,localhost,127.0.0.1,healthcheck.railway.app,refurbd.com.au,*.refurbd.com.au"
if TrustedHostMiddleware:
    hosts = [h.strip() for h in os.getenv("TRUSTED_HOSTS", default_hosts).split(",") if h.strip()]
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=hosts)

# ---------------------------
# Routers (mounted under API_PREFIX, default '/api')
# ---------------------------
API_PREFIX = os.getenv("API_PREFIX", "/api")
try:
    # Prefer a single aggregator router if present
    from app.api import routes as api_routes  # type: ignore
    if hasattr(api_routes, "router"):
        app.include_router(api_routes.router, prefix=API_PREFIX)
    else:
        raise ImportError("app.api.routes has no 'router'")
except Exception:
    # Fallback: include known route modules one by one
    try:
        from app.api.routes.auth import router as auth_router  # type: ignore
        app.include_router(auth_router, prefix=API_PREFIX)
    except Exception:
        pass
    try:
        from app.api.routes.projects import router as projects_router  # type: ignore
        app.include_router(projects_router, prefix=API_PREFIX)
    except Exception:
        pass
    try:
        from app.api.routes.renderings import router as renderings_router  # type: ignore
        app.include_router(renderings_router, prefix=API_PREFIX)
    except Exception:
        pass
    try:
        from app.api.routes.billing import router as billing_router  # type: ignore
        app.include_router(billing_router, prefix=API_PREFIX)
    except Exception:
        pass
    try:
        from app.api.routes.admin import router as admin_router  # type: ignore
        app.include_router(admin_router, prefix=API_PREFIX)
    except Exception:
        pass
    try:
        from app.api.routes.websockets import router as ws_router  # type: ignore
        app.include_router(ws_router, prefix=API_PREFIX)
    except Exception:
        pass

# ---------------------------
# Error handler
# ---------------------------
@app.exception_handler(Exception)
async def _global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ---------------------------
# Root
# ---------------------------
@app.get("/", include_in_schema=False)
def root():
    return {"message": "Refurbd API", "ok": True}
