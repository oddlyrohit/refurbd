# app/main.py
import os
from typing import List

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

def _csv_env(name: str, default: str = "") -> List[str]:
    s = os.getenv(name, default)
    return [x.strip() for x in s.split(",") if x.strip()]

API_PREFIX = os.getenv("API_PREFIX", "/api").strip() or ""
CORS_ORIGINS = _csv_env(
    "CORS_ORIGINS",
    "http://localhost:3000,https://*.vercel.app,https://refurbd.com.au,https://www.refurbd.com.au",
)

app = FastAPI(title="Refurbd API", version="0.1.0")

# CORS & sessions/cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", os.getenv("JWT_SECRET", "change-me")),
    same_site="none",  # allow cross-site cookies
    https_only=True,
)

# ---- basic health + env introspection ----
@app.get("/health")
@app.get(f"{API_PREFIX}/health")
def health():
    return {"ok": True}

@app.get(f"{API_PREFIX}/auth/env")
def env_probe():
    # helpful when debugging on Vercel: shows where the FE is pointing
    backend_host = (
        os.getenv("BACKEND_URL")
        or os.getenv("RAILWAY_PUBLIC_DOMAIN")
        or os.getenv("ORIGIN")
        or ""
    )
    return {
        "ok": True,
        "backendUrlDefined": bool(backend_host),
        "backendUrlPreview": backend_host,
        "authPrefix": API_PREFIX + "/auth" if API_PREFIX else "/auth",
    }

# ---- mount the same auth router on both /auth and /api/auth ----
def _try_import_auth_router():
    try:
        # common patterns
        from app.api.auth import router as auth_router
        return auth_router
    except Exception:
        pass
    try:
        from app.routes.auth import router as auth_router
        return auth_router
    except Exception:
        pass
    try:
        from app.auth import router as auth_router
        return auth_router
    except Exception:
        pass
    return None

_auth = _try_import_auth_router()
if _auth:
    # Unprefixed (/auth/*)
    app.include_router(_auth, prefix="/auth", tags=["auth"])
    # Prefixed (/api/auth/*) to match your FE fallback chain
    if API_PREFIX:
        app.include_router(_auth, prefix=f"{API_PREFIX}/auth", tags=["auth"])
else:
    # If we can't import, expose a clear hint
    @app.get(f"{API_PREFIX}/auth/login")
    def _missing_login_hint():
        return {"ok": False, "error": "auth_router_missing"}

# (Optional) mount any other routers the same way if you add them later.
