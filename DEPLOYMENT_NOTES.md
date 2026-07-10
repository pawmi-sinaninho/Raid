# Deployment Notes

Stand: 10.07.2026

## Public App

https://raiddofus.onrender.com

## Hosting

Provider: Render Web Service
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
DATABASE_URL is stored only in Render Environment Variables.

## Required Render Environment Variables

RAIDWEAVE_DB_MODE=postgres
DATABASE_URL=<secret Neon connection string>
RAIDWEAVE_TOKEN_PEPPER=<secret random token>
RAIDWEAVE_APP_ORIGIN=https://raiddofus.onrender.com
NEXT_PUBLIC_ENABLE_SOLO_TEST=false

## Deployment Fixes Applied

- package-lock.json registry URLs changed from internal Codex/OpenAI registry to public npm registry.
- package-lock.json BOM removed.
- Node pinned to 22.16.0.
- Render PostgreSQL not used because free DB expires.
