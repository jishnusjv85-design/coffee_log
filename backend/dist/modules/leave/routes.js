import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
const router = Router();
router.post('/', requireAuth, async (req, res) => { const e = await prisma.employee.findUnique({ where: { userId: req.auth.userId } }); if (!e)
    return res.status(404).json({ error: 'no emp' }); const lr = await prisma.leaveRequest.create({ data: { employeeId: e.id, leaveType: req.body.leaveType || 'CASUAL', startDate: new Date(req.body.startDate), endDate: new Date(req.body.endDate), reason: req.body.reason } }); res.json(lr); });
router.get('/', requireAuth, async (req, res) => { res.json(await prisma.leaveRequest.findMany({ take: 100, orderBy: { createdAt: 'desc' } })); });
export default router;
