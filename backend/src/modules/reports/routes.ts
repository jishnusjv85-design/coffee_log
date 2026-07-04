import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
const router = Router();
router.get('/attendance', requireAuth, requireRole('ADMIN','SUPER_ADMIN'), async (req,res)=>{
  const rows = await prisma.attendance.findMany({ include:{employee:true}, take:500 });
  const accept = req.headers.accept || '';
  if(accept.includes('text/csv')){ res.setHeader('Content-Type','text/csv'); return res.send('date,employee,workedMinutes\n'+rows.map(r=>`${r.date.toISOString().slice(0,10)},${r.employee?.fullName},${r.workedMinutes}`).join('\n')) }
  res.json(rows);
});
export default router;
