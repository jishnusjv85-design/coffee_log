import { prisma } from '../config/db.js';
import { hashPassword } from '../utils/crypto.js';
const SUPER_EMAIL = process.env.SUPERADMIN_EMAIL || 'superadmin@coffeebun.local';
const SUPER_PASS = process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!';
const SUPER_NAME = process.env.SUPERADMIN_NAME || 'Coffee Bun Owner';
async function main() {
    // roles
    const roles = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'];
    for (const r of roles) {
        await prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r, description: r } });
    }
    // permissions
    const permKeys = [
        'employees.create', 'employees.read', 'employees.update', 'employees.delete',
        'attendance.read_all', 'attendance.write',
        'payroll.read_all', 'payroll.approve',
        'settings.manage', 'audit.read'
    ];
    for (const k of permKeys) {
        await prisma.permission.upsert({ where: { key: k }, update: {}, create: { key: k } });
    }
    // branch / dept / shift
    const branch = await prisma.branch.upsert({
        where: { code: 'CB-KOCHI' },
        update: {},
        create: {
            name: 'Coffee Bun HQ - Kochi',
            code: 'CB-KOCHI',
            address: 'Kakkanad, Kochi, Kerala',
            latitude: parseFloat(process.env.BRANCH_DEFAULT_LAT || '9.9312'),
            longitude: parseFloat(process.env.BRANCH_DEFAULT_LNG || '76.2673'),
            geofenceRadiusM: parseInt(process.env.BRANCH_GEOFENCE_RADIUS_M || '200')
        }
    });
    const dept = await prisma.department.upsert({ where: { code: 'OPS' }, update: {}, create: { name: 'Operations', code: 'OPS' } });
    const shift = await prisma.shift.upsert({
        where: { id: '00000000-0000-0000-0000-000000000001' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000001',
            name: 'Morning Shift',
            startTime: '09:00', endTime: '18:00',
            graceMinutes: 15, breakMinutes: 60, overtimeAfterMin: 480,
            branchId: branch.id
        }
    });
    await prisma.networkConfiguration.upsert({
        where: { id: '00000000-0000-0000-0000-000000000010' },
        update: {},
        create: {
            id: '00000000-0000-0000-0000-000000000010',
            branchId: branch.id,
            name: 'Office Public IP',
            publicIp: '103.1.2.3',
            isActive: true
        }
    });
    async function ensureUser(email, employeeCode, fullName, roleName, password) {
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma.user.create({ data: { email, employeeCode, passwordHash: await hashPassword(password) } });
            const role = await prisma.role.findUnique({ where: { name: roleName } });
            await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
            await prisma.employee.create({
                data: {
                    userId: user.id,
                    employeeCode,
                    fullName,
                    departmentId: dept.id,
                    branchId: branch.id,
                    shiftId: shift.id,
                    salaryType: 'MONTHLY',
                    monthlySalary: 28000,
                    hourlyRate: 150,
                    overtimeRate: 225
                }
            });
            console.log(`Created ${roleName}: ${email} / ${password}`);
        }
        return user;
    }
    await ensureUser(SUPER_EMAIL, 'CB-ADMIN-001', SUPER_NAME, 'SUPER_ADMIN', SUPER_PASS);
    await ensureUser('admin@coffeebun.local', 'CB-ADM-002', 'Anita Nair', 'ADMIN', 'Admin123!');
    await ensureUser('emp001@coffeebun.local', 'CB-EMP-001', 'Rahul Menon', 'EMPLOYEE', 'Employee123!');
    console.log('Seed complete');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
