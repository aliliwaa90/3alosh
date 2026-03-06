# Tliker

Telegram WebApp with admin panel, API routes, and MongoDB persistence.

## Local Run

1. Install dependencies:
   `npm install`
2. Copy env file:
   `cp .env.example .env.local` (or create `.env.local` manually on Windows)
3. Set at least:
   `TELEGRAM_BOT_TOKEN` and `APP_URL`
4. Run:
   `npm run dev`

Local development uses `server.ts` and `database.json` fallback unless your environment provides MongoDB config.

## Deploy (Vercel + MongoDB)

1. Create a MongoDB Atlas cluster (or any MongoDB server).
2. In Vercel Project Settings -> Environment Variables, set all values from `.env.example`:
   `MONGODB_URI` and optional `MONGODB_DB`.
   The app also accepts URI aliases: `MONGO_URI`, `MONGODB_URL`, `MONGO_URL`, `DATABASE_URL`.
3. Set admin security variables:
   `ADMIN_PASSWORD` (required), optional `ADMIN_USER_IDS` (comma-separated Telegram IDs), and optional `ADMIN_SECRET`.
4. Set Telegram bot token:
   `TELEGRAM_BOT_TOKEN`.
5. Deploy:
   `vercel --prod --yes`

## API Routes (Deployment)

- `GET /api/user/:id`
- `POST /api/user`
- `GET /api/leaderboard`
- `POST /api/admin/login`
- `POST /api/admin/broadcast` (requires Bearer admin token)
- `GET /api/admin/stats` (requires Bearer admin token)
- `GET|POST /api/bot` (Telegram webhook endpoint)
