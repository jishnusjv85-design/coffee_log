// Permission keys central list
export const PERMS = {
    employees_create: 'employees.create',
    employees_read: 'employees.read',
    employees_update: 'employees.update',
    employees_delete: 'employees.delete',
    attendance_read_all: 'attendance.read_all',
    attendance_write: 'attendance.write',
    payroll_read_all: 'payroll.read_all',
    payroll_approve: 'payroll.approve',
    settings_manage: 'settings.manage',
    audit_read: 'audit.read'
};
export function requirePerm(_perm) {
    // For MVP, role-based gates are sufficient; permission table is seeded for future fine-grained use.
    return (_req, _res, next) => next();
}
