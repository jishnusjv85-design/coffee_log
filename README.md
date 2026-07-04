# Coffee Bun — Employee Attendance & Payroll Management System

Production-ready, secure, role-based attendance and payroll platform for Coffee Bun.

Timezone: Asia/Kolkata
Currency: INR

## Tech Stack

**Frontend:** React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui + React Router 6 + TanStack Query + Recharts + PWA
**Backend:** Node.js + Express + TypeScript + PostgreSQL + Prisma + JWT + Argon2 + Node-Cron
**Design:** Coffee brown / cream café theme, dark mode, mobile-first

## Features

- 3 Roles: Super Admin / Admin / Employee — strict RBAC
- Secure Auth: Email / Employee-ID login, JWT access + rotating refresh (HttpOnly), Argon2, lockout, password strength
- Punch In/Out with: Network IP allowlist, GPS geofencing, selfie verification, device fingerprint
- Auto-close attendance at 1:00 AM IST (idempotent)
- Payroll: hourly/monthly/hybrid, overtime, bonuses, deductions, advances — immutable after approval
- Leave management, Shifts, Holidays
- Dashboards for all roles with Recharts
- Location tracking + Google Maps ready
- Reports: PDF/Excel/CSV export
- Audit logs for every sensitive action (read-only)
- File uploads: local / S3 pluggable
- Face verification: face-api.js local + AWS Rekognition ready

### Security Note
Browser Wi-Fi SSID detection is NOT used. Verification is via: public IP allowlist + CIDR, GPS geofence, device session, selfie/face match, branch rules.

## Quick Start

### Prerequisites
- Node 20+
- PostgreSQL 14+
- pnpm / npm

### 1. Backend
```bash
cd coffee-bun/backend
cp .env.example .env
# edit DATABASE_URL, JWT_SECRETs
npm install
npx prisma migrate dev --name init
npm run seed
npm run dev
```
Seed Super Admin: email from `SUPERADMIN_EMAIL` in .env, password from `SUPERADMIN_PASSWORD`

Default seed:
- superadmin@coffeebun.local / ChangeMe123!
- admin@coffeebun.local / Admin123!
- emp001@coffeebun.local / Employee123!

### 2. Frontend
```bash
cd ../frontend
cp .env.example .env
npm install
npm run dev
```
http://localhost:5173

### Docker
```bash
cd coffee-bun
docker-compose up -d
# runs postgres, backend :4000, frontend :5173
```

## Environment Variables

See `backend/.env.example` and `frontend/.env.example`

## API Overview

- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- POST /api/attendance/punch-in
- POST /api/attendance/punch-out
- GET /api/attendance/me
- GET /api/payroll/me
- ... full OpenAPI at /api/docs

## Project Structure

```
coffee-bun/
  backend/
    src/modules/auth, employees, attendance, payroll ...
    src/middleware/rbac.ts
    prisma/schema.prisma
  frontend/
    src/pages/employee/PunchPage.tsx
    src/components/ui/ ...
```

## Production Notes

- HTTPS only, Helmet, rate-limit, CSRF
- Argon2id password hashing
- Refresh tokens rotated + stored hashed
- Audit logs immutable
- Face embeddings never exposed to client
- All secrets via env

MIT — Built for Coffee Bun
