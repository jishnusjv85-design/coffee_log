import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
import { generatePayroll } from './service.js';
const router = Router();
router.get('/me', requireAuth, async (req, res) => {
    const emp = await prisma.employee.findUnique({ where: { userId: req.auth.userId } });
    if (!emp)
        return res.json([]);
    const rows = await prisma.payroll.findMany({ where: { employeeId: emp.id }, orderBy: { periodStart: 'desc' } });
    res.json(rows);
});
router.get('/', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (_req, res) => {
    const rows = await prisma.payroll.findMany({ include: { employee: true }, orderBy: { periodStart: 'desc' }, take: 200 });
    res.json(rows);
});
router.post('/generate', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    const { employeeId, periodStart, periodEnd } = req.body;
    const p = await generatePayroll(employeeId, new Date(periodStart), new Date(periodEnd));
    res.json(p);
});
export default router;
