import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { prisma } from '../../config/db.js';
import { punchIn, punchOut } from './service.js';
import { audit } from '../../services/audit.js';
import { z } from 'zod';
const router = Router();
router.post('/punch-in', requireAuth, async (req, res) => {
    try {
        const schema = z.object({
            lat: z.number(),
            lng: z.number(),
            accuracy: z.number().optional(),
            selfieVerified: z.boolean(),
            selfieConfidence: z.number().optional(),
            selfieFileId: z.string().optional(),
            device: z.any().optional()
        });
        const body = schema.parse(req.body);
        const employee = await prisma.employee.findUnique({ where: { userId: req.auth.userId } });
        if (!employee)
            return res.status(404).json({ error: 'Employee profile not found' });
        const att = await punchIn({
            employeeId: employee.id,
            lat: body.lat, lng: body.lng, accuracy: body.accuracy,
            ip: req.ip || req.headers['x-forwarded-for'] || '',
            device: body.device || { userAgent: req.headers['user-agent'] },
            selfieVerified: body.selfieVerified,
            selfieConfidence: body.selfieConfidence,
            selfieFileId: body.selfieFileId
        });
        await audit({ actorId: req.auth.userId, action: 'attendance.punch_in', entity: 'Attendance', entityId: att.id, ip: req.ip, userAgent: req.headers['user-agent'] });
        res.json(att);
    }
    catch (e) {
        res.status(400).json({ error: e.message || 'Punch in failed' });
    }
});
router.post('/punch-out', requireAuth, async (req, res) => {
    try {
        const schema = z.object({
            lat: z.number(), lng: z.number(), device: z.any().optional()
        });
        const body = schema.parse(req.body);
        const employee = await prisma.employee.findUnique({ where: { userId: req.auth.userId } });
        if (!employee)
            return res.status(404).json({ error: 'Employee profile not found' });
        const att = await punchOut({
            employeeId: employee.id,
            lat: body.lat, lng: body.lng,
            ip: req.ip || '',
            device: body.device || { userAgent: req.headers['user-agent'] }
        });
        await audit({ actorId: req.auth.userId, action: 'attendance.punch_out', entity: 'Attendance', entityId: att.id, ip: req.ip, userAgent: req.headers['user-agent'] });
        res.json(att);
    }
    catch (e) {
        res.status(400).json({ error: e.message || 'Punch out failed' });
    }
});
router.get('/me', requireAuth, async (req, res) => {
    const employee = await prisma.employee.findUnique({ where: { userId: req.auth.userId } });
    if (!employee)
        return res.json([]);
    const list = await prisma.attendance.findMany({
        where: { employeeId: employee.id, deletedAt: null },
        orderBy: { date: 'desc' }, take: 60
    });
    res.json(list);
});
router.get('/', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    const { employeeId, dateFrom, dateTo, branchId } = req.query;
    const where = { deletedAt: null };
    if (employeeId)
        where.employeeId = employeeId;
    if (branchId)
        where.branchId = branchId;
    if (dateFrom || dateTo)
        where.date = {};
    if (dateFrom)
        where.date.gte = new Date(dateFrom);
    if (dateTo)
        where.date.lte = new Date(dateTo);
    const rows = await prisma.attendance.findMany({ where, include: { employee: true }, orderBy: { date: 'desc' }, take: 200 });
    res.json(rows);
});
// Admin edit attendance
router.put('/:id', requireAuth, requireRole('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
    const { punchInAt, punchOutAt, reason } = req.body;
    const existing = await prisma.attendance.findUnique({ where: { id: req.params.id } });
    if (!existing)
        return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.attendance.update({
        where: { id: req.params.id },
        data: {
            punchInAt: punchInAt ? new Date(punchInAt) : existing.punchInAt,
            punchOutAt: punchOutAt ? new Date(punchOutAt) : existing.punchOutAt
        }
    });
    await audit({
        actorId: req.auth.userId,
        action: 'attendance.edit',
        entity: 'Attendance',
        entityId: updated.id,
        before: existing,
        after: updated,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });
    res.json(updated);
});
export default router;
