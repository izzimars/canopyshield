# CanopyShield

Phase 0 scaffold for the child-centric climate-health monitoring platform.

## Included
- Node.js + Express bootstrap
- pg-promise database client and db-migrate SQL migrations
- PostgreSQL and Redis via Docker Compose
- Environment validation and structured logging
- GitHub Actions CI skeleton

## Local setup
1. Copy `.env.example` to `.env`
2. Start Postgres and Redis with Docker Compose
3. Run `npm install`
4. Run `npm run migrate:up`
5. Run `npm run dev`
