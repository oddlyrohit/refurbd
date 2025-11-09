
# Refurbd Backend (FastAPI) - Railway

Start command:

```
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Required env vars (Railway → Variables):
- DATABASE_URL (postgresql://USER:PASSWORD@HOST:5432/postgres)
- JWT_SECRET (any long random string)
- CORS_ORIGINS (comma separated; e.g. https://refurbd.com.au,https://*.vercel.app,http://localhost:3000)
- API_PREFIX (default: /api)
- ENVIRONMENT (production or development)

Health check: `GET /api/health`
Auth:
- `POST /api/auth/register` {email,password}
- `POST /api/auth/login` {email,password}
- `GET /api/auth/me?token=<jwt>`
