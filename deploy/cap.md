# Cap on the vault VPS

Self-hosted Cap Web for Field School.

- Public URL: https://cap.fieldschool.ai
- Host: VM 1638459, `2.24.64.248` (Ubuntu 22.04). Not the portal box.
- Path: `/opt/cap` (clone of https://github.com/CapSoftware/Cap.git)
- Compose project name: `cap`
- Reverse proxy: host Caddy on this VPS only. Site block proxies `cap.fieldschool.ai` to `127.0.0.1:3000`. Let's Encrypt on that name. No `s3.cap.fieldschool.ai` yet.

## Isolation

Cap has its own MySQL and MinIO from the official compose file. It does not use vault Postgres or Redis.

Do not edit `/opt/cnc-vault/docker-compose.yml`. Vault stays postgres + redis.

Vault already publishes `5432` and `6379` on `0.0.0.0`. Do not publish them wider. Do not add more host binds for them.

Cap publishes `127.0.0.1:3000` only. Official compose interpolates `CAP_PORT`, so the VPS `.env` sets `CAP_PORT=127.0.0.1:3000` instead of a bare `3000`. That keeps the host bind on loopback.

MinIO `9000` and `9001` are loopback-only until `s3.cap.fieldschool.ai` is added later. Do not publish them on `0.0.0.0`.

Do not change Field School `AUTH_URL` / `NEXTAUTH_URL` on the portal box. Do not 301 `university.benjohnson.ai`.

## Env on the VPS

`/opt/cap/.env` lives on the VPS only. Mode `600`. Never commit it. Never paste secret values.

Set:

- `CAP_URL=https://cap.fieldschool.ai`
- `NEXTAUTH_URL=https://cap.fieldschool.ai`
- `S3_PUBLIC_URL=https://s3.cap.fieldschool.ai`
- `MINIO_ROOT_USER=cap-admin`
- generated `openssl rand -hex 32` values for `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD`, `MINIO_ROOT_PASSWORD`, `NEXTAUTH_SECRET`, `DATABASE_ENCRYPTION_KEY`, `MEDIA_SERVER_WEBHOOK_SECRET`

Leave unset: `ASSEMBLY_API_KEY`, `OPENAI_API_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`, `AI_PROVIDER`. Transcription is Grok STT later.

## Desktop

Cap Desktop → Settings → Cap Server URL = `https://cap.fieldschool.ai`
