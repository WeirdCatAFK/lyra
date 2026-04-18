# Lyra — Deployment Guide

Self-hosted deployment using Docker Compose.

## Prerequisites

- Docker Engine 24+ with the Compose plugin
- A reverse proxy (nginx, Caddy, Traefik) terminating TLS in front of the stack — strongly recommended for production
- A domain pointing at the host (used for `CORS_ORIGINS` and `VITE_ALLOWED_HOSTS`)

## First-time setup

```bash
git clone https://github.com/WeirdCatAFK/lyra.git
cd lyra

# 1. Copy env template and fill in secrets
cp .env.example .env
$EDITOR .env

# Required values:
#   JWT_SECRET        — openssl rand -hex 32
#   CORS_ORIGINS      — your public frontend URL (https://piano.example.com)
#   VITE_API_URL      — typically /api when frontend & backend share a domain
#   VITE_ALLOWED_HOSTS — your public hostname

# 2. Build and start
docker compose up -d --build

# 3. Verify
curl http://localhost:3000/health   # backend
curl http://localhost:8001/health   # AI
curl http://localhost:8080/         # frontend (nginx)
```

The backend seeds the exercise catalog automatically on first boot if the
`Exercises` table is empty.

## Reverse proxy (nginx example)

```nginx
server {
    listen 443 ssl http2;
    server_name piano.weirdcat.uk;

    # … TLS config …

    # Frontend
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

The Python AI service does not need to be public — only the backend talks to
it (`http://ai:8001` inside the compose network).

## Recommendation cycles (CNN-only vs CNN+LLM)

Lyra ships with two interchangeable recommendation cycles. The active one is
chosen at startup from the AI service's environment:

| Mode | When it runs | What it does |
|---|---|---|
| **CNN-only** | `GEMINI_API_KEY` empty, **or** `LYRA_USE_LLM=false` | Deterministic engine + per-user CNN, ε-greedy blended. No external calls. `strategy_hint` is always `null`. Response includes `llm_active: false`. |
| **CNN + LLM** | `GEMINI_API_KEY` set and `LYRA_USE_LLM` unset/`true` | Same CNN pipeline, then Gemini reviews the pick and may attach a short `strategy_hint`. Response includes `llm_active: true`. |

The default deployment runs **CNN-only** — no Gemini key needed. Switching is
a config change, no code change: set `GEMINI_API_KEY` in `.env` and `docker
compose up -d` will restart the AI service in CNN+LLM mode.

The startup log line `LLM layer enabled (CNN-only cycle off)` or
`LLM layer disabled (CNN-only cycle on)` confirms which mode is live.

## Updating

```bash
git pull
docker compose up -d --build
```

The SQLite file lives in the named volume `lyra-data`, so it survives rebuilds.

## Backups

```bash
# One-shot DB snapshot
docker compose exec backend sqlite3 /data/database.sqlite ".backup '/data/backup-$(date +%F).db'"

# Pull the volume contents to host
docker run --rm -v lyra_lyra-data:/data -v $PWD:/backup alpine \
  tar czf /backup/lyra-data-$(date +%F).tgz /data
```

## Resetting state

```bash
docker compose down -v   # also removes lyra-data volume — destroys all users + history
docker compose up -d --build
```

## Environment reference

See `.env.example` for the authoritative list. Quick summary:

| Var | Where | Notes |
|---|---|---|
| `JWT_SECRET` | backend | REQUIRED. Server refuses to start in prod without it. |
| `CORS_ORIGINS` | backend | Comma-separated. Must include your frontend URL. |
| `GEMINI_API_KEY` | ai | Optional. Empty = CNN-only cycle (no LLM). |
| `LYRA_USE_LLM` | ai | Optional. Set to `false` to force CNN-only even with a key. |
| `VITE_API_URL` | frontend (build-time) | `/api` when reverse-proxied on same domain. |
| `VITE_ALLOWED_HOSTS` | frontend | Required for Vite preview/HMR. |
