import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
const router = Router();
router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (_req, res) => { res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 200 })); });
export default router;
