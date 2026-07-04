export default function SuperAdminDashboard(){
  return <div className="space-y-4">
    <h2 className="font-display text-2xl">Super Admin</h2>
    <div className="grid md:grid-cols-3 gap-4">
      <div className="card">Audit logs: read-only, immutable — endpoint /api/audit (Super Admin only)</div>
      <div className="card">Network / Geofence / Face verification settings configurable per branch.</div>
      <div className="card">Payroll approval: LOCKED after approval, Super Admin can unlock.</div>
    </div>
    <div className="card text-sm text-coffee-700 dark:text-coffee-200">
      All modules (Leave, Shifts, Holidays, Reports export PDF/Excel/CSV, Notifications, Location map) are wired in the backend schema and service interfaces. UI scaffolds are ready to extend — see backend/src/modules/* and frontend/src/pages/*.
    </div>
  </div>
}
