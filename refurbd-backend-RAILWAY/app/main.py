# app/main.py
import os
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware

try:
    from starlette.middleware.trustedhost import TrustedHostMiddleware
except Exception:
    TrustedHostMiddleware = None  # middleware optional

app = FastAPI(title="Refurbd API")

# -------------------------------------------------
# Health: guaranteed 200 and bypass any middleware
# -------------------------------------------------
@app.middleware("http")
async def _health_bypass(request: Request, call_next):
    if request.url.path == "/__health":
        # Plain text, zero dependencies, always 200
        return PlainTextResponse("ok")
    return await call_next(request)

@app.get("/__health", include_in_schema=False)
def __health():
    return PlainTextResponse("ok")

@app.get("/health", include_in_schema=False)
def health_root():
    return {"ok": True}

@app.get("/api/health", include_in_schema=False)
def health_api():
    return {"ok": True}

# ---------------------------
# CORS (from environment)
# ---------------------------
frontend_url = os.getenv("FRONTEND_URL", "").strip()
cors_env = os.getenv("CORS_ORIGINS", "").strip()

cors_origins = [o.strip() for o in cors_env.split(",") if o.strip()]
if frontend_url and frontend_url not in cors_origins:
    cors_origins.append(frontend_url)

# If nothing provided, allow the site origin only; fall back to "*" during bring-up
allow_list = cors_origins if cors_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Trusted Host (so Railway healthcheck isn’t blocked)
# ---------------------------
default_hosts = "*.up.railway.app,healthcheck.railway.app,api.refurbd.com.au,localhost,127.0.0.1"
trusted_hosts = [h.strip() for h in os.getenv("TRUSTED_HOSTS", default_hosts).split(",") if h.strip()]

if TrustedHostMiddleware:
    app.add_middleware(TrustedHostMiddleware, allowed_hosts=trusted_hosts)

# ---------------------------
# Optional: include API routers if present
# (This won't crash if your project structure differs.)
# ---------------------------
api_prefix = os.getenv("API_PREFIX", "/api")
try:
    # If you have a single combined router at app/api/routes.py
    from app.api import routes as api_routes  # type: ignore
    if hasattr(api_routes, "router"):
        app.include_router(api_routes.router, prefix=api_prefix)
    else:
        raise ImportError("app.api.routes has no 'router'")
except Exception as e:
    # Try common per-module routers
    try:
        from app.api.routes import auth, projects, billing, renderings  # type: ignore
        app.include_router(auth.router, prefix=api_prefix)
        app.include_router(projects.router, prefix=api_prefix)
        app.include_router(billing.router, prefix=api_prefix)
        app.include_router(renderings.router, prefix=api_prefix)
    except Exception as e2:
        print("No routers included automatically:", e, e2)

# ---------------------------
# Global error handler (keeps errors from killing the app)
# ---------------------------
@app.exception_handler(Exception)
async def _global_exception_handler(request: Request, exc: Exception):
    print("Unhandled exception:", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})

# ---------------------------
# Root (nice to have)
# ---------------------------
@app.get("/", include_in_schema=False)
def root():
    return {"message": "Refurbd API", "ok": True}
