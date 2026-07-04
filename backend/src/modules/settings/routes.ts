import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
const router = Router();
router.get('/', requireAuth, requireRole('SUPER_ADMIN'), async (_req,res)=>{ res.json(await prisma.setting.findMany()) });
router.put('/:key', requireAuth, requireRole('SUPER_ADMIN'), async (req,res)=>{ const s= await prisma.setting.upsert({ where:{key:req.params.key}, update:{value:req.body.value}, create:{ key:req.params.key, value:req.body.value }}); res.json(s)});
export default router;
