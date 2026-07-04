import { prisma } from '../../config/db.js';
export async function generatePayroll(employeeId, periodStart, periodEnd) {
    const attendances = await prisma.attendance.findMany({
        where: { employeeId, date: { gte: periodStart, lte: periodEnd }, deletedAt: null, punchOutAt: { not: null } }
    });
    const totalWorkedMin = attendances.reduce((s, a) => s + a.workedMinutes, 0);
    const overtimeMin = attendances.reduce((s, a) => s + a.overtimeMinutes, 0);
    const gross = attendances.reduce((s, a) => s + Number(a.dailyEarnings), 0);
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee)
        throw new Error('no employee');
    const net = gross;
    const existing = await prisma.payroll.findFirst({ where: { employeeId, periodStart, periodEnd } });
    const data = {
        employeeId, periodStart, periodEnd,
        totalWorkedMin, overtimeMin,
        grossAmount: gross,
        netAmount: net,
        pendingAmount: net,
        status: 'DRAFT'
    };
    if (existing && !existing.locked) {
        return prisma.payroll.update({ where: { id: existing.id }, data });
    }
    if (existing?.locked)
        return existing;
    return prisma.payroll.create({ data });
}
