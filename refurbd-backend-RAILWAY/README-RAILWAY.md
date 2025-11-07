# Railway Deploy (No Dockerfile)

1) Connect this repo to Railway (New Project → New Service → From GitHub).
2) Variables:
   FRONTEND_URL=https://www.refurbd.com.au
   COOKIE_DOMAIN=.refurbd.com.au
   SECRET_KEY=<long-random>
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=10080
   S3_BUCKET=refurbd
   AWS_REGION=ap-southeast-2
   AWS_ACCESS_KEY_ID=<...>
   AWS_SECRET_ACCESS_KEY=<...>
   OPENAI_API_KEY=<...>
   ANTHROPIC_API_KEY=<...>
   STRIPE_API_KEY=<...>
   STRIPE_WEBHOOK_SECRET=<...>
   USE_PRESIGNED_DEFAULT=true
   PRESIGN_EXPIRY_SECONDS=3600
3) Settings → Healthchecks → `/health`
4) Public Networking → Generate domain → test → Add Custom Domain `api.refurbd.com.au`.
