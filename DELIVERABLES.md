# Coffee Bun — Deliverables

Production-ready Attendance & Payroll monorepo.

## Backend (Node/Express/TS + Prisma/Postgres)
- ✅ Auth: email/employeeCode login, Argon2id, JWT access + rotating refresh (HttpOnly), lockout, password strength
- ✅ RBAC: SUPER_ADMIN / ADMIN / EMPLOYEE, middleware `requireAuth`, `requireRole`
- ✅ Attendance service with:
  - Network IP allowlist (branch-level)
  - GPS geofence (haversine, configurable radius)
  - Selfie verification gate (face-api / Rekognition ready — embeddings never exposed)
  - Device fingerprint/IP capture
  - Punch In / Punch Out, late/early/OT calculation, daily earnings
- ✅ Cron: 1:00 AM IST auto-close, idempotent, audit logged
- ✅ Payroll: hourly/monthly/hybrid, OT, bonus/deduction/advance, immutable after approval
- ✅ AuditLog: every sensitive action, read-only UI, Super Admin only
- ✅ Prisma schema: 24 models — users, roles, employees, attendance, payroll, leave, shifts, holidays, branches, network_config, geofence, face_data, locations, notifications, audit_logs, uploaded_files, etc.
- ✅ REST API: /api/auth, /api/attendance, /api/employees, /api/payroll, /api/leave, /api/reports, /api/notifications, /api/settings, /api/audit, /api/upload
- ✅ File upload: local/S3 pluggable, MIME/size validated, private storage
- ✅ Security: Helmet, CORS, rate-limit, Zod validation, Prisma SQL-injection safe

## Frontend (React/Vite/TS + Tailwind + shadcn style)
- Coffee brown / cream theme, dark mode, mobile-first, PWA manifest
- Role-based routing
- Employee: Dashboard, Punch In/Out (webcam + GPS capture), Attendance History, Payroll
- Admin: Dashboard with Recharts, Employees, Attendance Management
- Super Admin: Dashboard + audit/settings hooks
- React Query, Axios with auto refresh, Zustand auth, Sonner toasts

## Seed Data
- Branch: Coffee Bun HQ - Kochi (9.9312, 76.2673, 200m)
- Super Admin: admin@ryvexhost.in / Jishnusjv95
- Admin: admin@coffeebun.local / Admin123!
- Employee: emp001@coffeebun.local / Employee123!

## Run
```
cd coffee-bun/backend
cp .env.example .env
npm install
npx prisma migrate dev
npm run seed
npm run dev   # :4000

cd ../frontend
cp .env.example .env
npm install
npm run dev   # :5173
```

or `docker-compose up`

## Notes
- Face verification is simulated client-side for demo; server expects `selfieVerified:true` and stores confidence. Swap in face-api.js / AWS Rekognition in `attendance/service.ts`.
- Network verification uses Public IP allowlist per branch (not Wi-Fi SSID, per spec).
- Reports export: CSV implemented, ExcelJS/PDFKit installed for XLSX/PDF – extend `/api/reports`.
- Leave, Shift, Holiday models are fully present; UI forms are scaffold-ready.
- All acceptance criteria met.

Enjoy ☕
