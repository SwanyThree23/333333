# Quickstart — Local Docker Compose

1) Copy environment template and generate an encryption key

```bash
cp .env.example .env
# generate a 32-byte base64 ENCRYPTION_KEY
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# paste the key into .env as ENCRYPTION_KEY=<value>
```

1) Build and bring up services

```bash
docker compose up -d --build

# Run database migrations / Prisma generate (inside backend container)
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx prisma generate
```

1) Create a test user and start a stream

- Use the API or admin script to register a user, add payment handles, and add encrypted RTMP keys.
- Start a stream via `/api/streams/:id/start` which will spawn ffmpeg/relay worker to fan out to configured platforms.

Notes

- For local RTMP testing use a local Nginx RTMP container or public test keys. Do not commit real stream keys to source.
- Use KMS/Vault in production for key management.
