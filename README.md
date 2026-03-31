# AI Anki

AI Anki is a Next.js + Prisma flashcard app with spaced repetition and optional AI-assisted card improvements.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Start Postgres (local):

```bash
docker compose up -d
```

3. Configure environment variables in `.env` (see `.env.example`):
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `OPENAI_API_KEY` (optional, but enables AI features)

4. Run migrations and start dev server:

```bash
npm run prisma:migrate
npm run dev
```

## Deploy to Vercel (with managed Postgres)

1. Create a managed Postgres database (Neon, Supabase, Vercel Postgres, etc.).
2. In Vercel project settings, configure env vars:
- `DATABASE_URL` (production connection string)
- `NEXTAUTH_URL` (your production URL, e.g. `https://your-app.vercel.app`)
- `NEXTAUTH_SECRET` (long random secret)
- `OPENAI_API_KEY` (optional but recommended)
3. Set Vercel Build Command to:

```bash
npm run build:vercel
```

This runs Prisma client generation, applies migrations with `prisma migrate deploy`, then builds Next.js.

## Useful scripts

- `npm run build` - Generate Prisma client and build Next.js.
- `npm run build:vercel` - Generate Prisma client, apply deploy migrations, and build.
- `npm run prisma:migrate:deploy` - Apply existing migrations to a deployed database.
