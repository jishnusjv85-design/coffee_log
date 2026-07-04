import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
import { z } from 'zod';
import { hashPassword } from '../../utils/crypto.js';
import { audit } from '../../services/audit.js';
const router = Router();
router.get('/', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req, res) => {
    const list = await prisma.employee.findMany({ where: { deletedAt: null }, include: { user: true, department: true, branch: true }, orderBy: { fullName: 'asc' } });
    res.json(list);
});
const createSchema = z.object({
    email: z.string().email(),
    employeeCode: z.string(),
    fullName: z.string(),
    password: z.string().min(8),
    departmentId: z.string().optional(),
    branchId: z.string().optional(),
    shiftId: z.string().optional(),
    salaryType: z.enum(['HOURLY', 'MONTHLY', 'HYBRID']).optional(),
    hourlyRate: z.number().optional(),
    monthlySalary: z.number().optional(),
    overtimeRate: z.number().optional(),
});
router.post('/', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    const data = createSchema.parse(req.body);
    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({ data: { email: data.email, employeeCode: data.employeeCode, passwordHash } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: (await prisma.role.findUnique({ where: { name: 'EMPLOYEE' } })).id } });
    const emp = await prisma.employee.create({ data: {
            userId: user.id,
            employeeCode: data.employeeCode,
            fullName: data.fullName,
            departmentId: data.departmentId,
            branchId: data.branchId,
            shiftId: data.shiftId,
            salaryType: data.salaryType || 'MONTHLY',
            hourlyRate: data.hourlyRate || 0,
            monthlySalary: data.monthlySalary || 0,
            overtimeRate: data.overtimeRate || 0,
            createdById: req.auth?.userId
        } });
    await audit({ actorId: req.auth.userId, action: 'employee.create', entity: 'Employee', entityId: emp.id });
    res.json(emp);
});
router.get('/:id', requireAuth, async (req, res) => {
    const emp = await prisma.employee.findUnique({ where: { id: req.params.id }, include: { user: true, branch: true, department: true } });
    res.json(emp);
});
export default router;
