import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
const router = Router();
router.get('/', requireAuth, async (req,res)=>{ res.json(await prisma.notification.findMany({ where:{ userId: req.auth!.userId }, orderBy:{createdAt:'desc'}, take:50 }))});
router.post('/:id/read', requireAuth, async (req,res)=>{ await prisma.notification.update({ where:{ id:req.params.id }, data:{ read:true }}); res.json({ok:true})});
export default router;
