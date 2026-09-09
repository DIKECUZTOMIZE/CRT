# Production deployment checklist

## 1. Required production setup

- Replace all placeholder secrets in `backend-restored/app/.env.production.example`
- Copy to `backend-restored/app/.env.production`
- Copy frontend env examples to real production env files
- Generate real TLS certificates for your domains
- Put certificates in `nginx/certs/fullchain.pem` and `nginx/certs/privkey.pem`
- Update all `crt.example.com` values to your real production hostnames

## 2. Environment requirements

- MongoDB Atlas production database
- Redis production instance
- Email SMTP production credentials
- Cloudinary production credentials
- Real JWT secrets

## 3. Production launch

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

## 4. Verify

- `https://crt.example.com`
- `https://admin.crt.example.com`
- `https://organizer.crt.example.com`
- `https://api.crt.example.com/health` or equivalent app health endpoint

## 5. Production hardening

- Use real HTTPS certs
- Restrict CORS to exact origins
- Set secure cookie settings
- Review rate limiting and auth routes
- Enable logs and monitoring
- Configure DB backups
- Make rollback plan ready
