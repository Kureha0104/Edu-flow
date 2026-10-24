# Deploying Edu Flow

The local demo runs on one machine (`localhost`). To use it from other
computers or phones you need public URLs plus shared MongoDB and Redis. This
guide covers that path.

## What must be shared

| Service | Local demo | Multi-device / production |
| --- | --- | --- |
| MongoDB | `eduflow-mongo` container | MongoDB Atlas (M0 is enough to start) |
| Redis | local `redis-server` | Redis Cloud / Upstash, or Redis on the server |
| erxes host | three `erxes/erxes-next-*:3.3.2` containers | same images on a VPS |
| Edu Flow API | `npm run dev:api` | Docker image from this repo |
| Edu Flow UI | `npm run dev:ui` | static files on a CDN/nginx |

**Yes, for multiple devices you need online MongoDB.** A database inside this
laptop is only reachable on this laptop.

## 1. MongoDB Atlas

1. Create an M0 cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Database Access → add a user.
3. Network Access → add your server IP (use `0.0.0.0/0` only for a short demo).
4. Connect → Drivers → copy the URI:
   ```ini
   MONGO_URL=mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/erxes?retryWrites=true&w=majority
   ```
5. Use that **same** URI for `erxes-core-api`, `erxes-gateway` and the Edu Flow
   API. They must share one database.

Atlas is already a replica set, so do not append `replicaSet=rs0` or
`directConnection=true` to an Atlas URI.

## 2. Redis

Use a managed Redis (Redis Cloud, Upstash) or a Redis container on the VPS.
Every service must use the same instance and database.

```ini
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=...
```

## 3. erxes host

Run Core UI, Core API and Gateway from the published `3.3.2` images. The
minimum environment shared by the API services:

```ini
NODE_ENV=production
VERSION=os
DOMAIN=https://eduflow.example.com
GATEWAY_URL=https://eduflow.example.com/gateway
MONGO_URL=...
REDIS_HOST=...
REDIS_PORT=6379
REDIS_PASSWORD=...
JWT_TOKEN_SECRET=...          # same value for core-api and gateway
ENABLED_PLUGINS=eduflow
```

Proxy `/` to Core UI (`:80` in the container, commonly `:3000` on the host) and
`/gateway/` to the gateway (`:4000`), exactly as described in
[erxes self-hosting](https://erxes.io/docs/self-hosting). Use HTTPS; the
plugin’s browser URLs and cookies should be on one domain.

## 4. Edu Flow API

Build the API image from this repository:

```sh
docker build --build-arg UI_ENTRY_URL=https://cdn.example.com/eduflow/remoteEntry.js \
  -t eduflow-api .
```

Run it on the same Docker network as the gateway:

```ini
PORT=3399
LOAD_BALANCER_ADDRESS=http://eduflow-api:3399
MONGO_URL=...
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=...
UI_ENTRY_URL=https://cdn.example.com/eduflow/remoteEntry.js
JWT_TOKEN_SECRET=...          # optional unless the API calls core
GEMINI_API_KEY=...            # optional, enables Gemma 4
GEMMA_MODEL=gemma-4-26b-a4b-it
SMS_PROVIDER=twilio           # optional
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM=...
```

The API writes its own address and `UI_ENTRY_URL` into Redis; the gateway
composes it once it registers. Keep the API port private (gateway-only).

## 5. Edu Flow UI

```sh
npm install
npm run build -w eduflow_ui
# upload ui/dist to Cloudflare Pages, S3+CloudFront, nginx, etc.
```

- Serve **all** of `ui/dist`, not just `remoteEntry.js`.
- Set CORS on the CDN for `https://eduflow.example.com`.
- `UI_ENTRY_URL` must point to the public `remoteEntry.js`.
- Upload hashed chunks first, `remoteEntry.js` last with `no-store`.
- Use the same erxes release (3.3.2 host contract / 3.3.4 shared libraries).

## 6. Other laptops and phones

Once the domain and CDN URL are public:

- Open `https://eduflow.example.com/eduflow`.
- Add the domain to `DOMAIN`; never use `localhost` in production URLs.
- `UI_ENTRY_URL` must be reachable from the **browser**, not only the server.
- The gateway must be reachable from the browser at `/gateway`.
- Phones use the same URL; no separate build is needed.

For a quick LAN test instead of a domain, replace every `localhost` with the
server’s LAN IP and set `DOMAIN=http://192.168.x.x:3001`,
`UI_ENTRY_URL=http://192.168.x.x:3099/remoteEntry.js`. A phone on the same
Wi-Fi can then open it, but production should use HTTPS.

## 7. Costs to budget

- **Atlas M0**: free (shared, small).
- **Redis Cloud / Upstash**: free tier or a few USD/month.
- **VPS** for erxes + plugin API: roughly $6–20/month.
- **Domain + TLS**: ~$10–20/year; TLS via Caddy/Let’s Encrypt is free.
- **Twilio SMS to Mongolia**: ~$0.3541 per message plus fees → about
  **1,200–1,300 MNT per SMS** at ~3,500 MNT/USD. 600 messages/month is roughly
  720,000–780,000 MNT. Telegram is free if that cost is too high.
- **Gemma 4 / AI Studio**: check current AI Studio quota/pricing for the model
  and image volume.

## Deployment checklist

- [ ] Atlas URI tested from the server (`mongosh`).
- [ ] Redis reachable from core-api, gateway and plugin API.
- [ ] `ENABLED_PLUGINS=eduflow` on core-api and gateway.
- [ ] `UI_ENTRY_URL` is browser-reachable and CORS-enabled.
- [ ] `DOMAIN` and `GATEWAY_URL` use the public HTTPS domain.
- [ ] `JWT_TOKEN_SECRET` identical for core-api and gateway.
- [ ] API port not published to the internet.
- [ ] Demo reset disabled or owner-only before sharing with real users.
- [ ] Real SSO/role mapping implemented before using real student data.
