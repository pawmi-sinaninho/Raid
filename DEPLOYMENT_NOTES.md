# RAIDWEAVE Deployment Notes

Stand: 10.07.2026

## Public App

URL: https://raiddofus.onrender.com

## Hosting

Host: Render Web Service
Branch: main
Root Directory: platform
Runtime: Node
NODE_VERSION: 22.16.0

Build Command:
npm ci && npm run build

Start Command:
npm start

Health Check:
https://raiddofus.onrender.com/api/health

## Database

Provider: Neon PostgreSQL Free
DATABASE_URL: stored only in Render Environment Variables
Do not commit the real DATABASE_URL.

## Required Render Environment Variables

RAIDWEAVE_DB_MODE=postgres
DATABASE_URL=<secret Neon connection string>
RAIDWEAVE_TOKEN_PEPPER=<secret random token>
RAIDWEAVE_APP_ORIGIN=https://raiddofus.onrender.com
NEXT_PUBLIC_ENABLE_SOLO_TEST=false

## Known Notes

- Render Free Web Service may sleep after inactivity.
- Neon Free limits apply.
- package-lock.json was fixed to use public npm registry instead of internal Codex/OpenAI registry.
