# UHWF backend

Express 5 + Prisma 6 + PostgreSQL.

## First run

1. Create the database (once):  CREATE DATABASE uhwf_db;
2. Copy .env.example to .env and fill in DATABASE_URL and JWT_SECRET.
3. npm install
4. npx prisma migrate dev --name init
5. npm run db:seed
6. npm run dev

Check it works: http://localhost:4000/api/health  ->  {"status":"ok","database":"connected"}

## Demo accounts (development only)

admin@uhwf.or.tz, ict@uhwf.or.tz, lecturer@uhwf.or.tz, employee@uhwf.or.tz, student@uhwf.or.tz
Password: Uhwf@2026!  (or SEED_PASSWORD from .env). Change or delete these before going live.

## Scripts

npm run dev        start with auto-reload
npm run build      compile to dist/
npm start          run the compiled build
npm run typecheck  check types only
npm run db:migrate create/apply a migration
npm run db:seed    insert demo data (safe to run again)
npm run db:studio  open a browser view of the database
