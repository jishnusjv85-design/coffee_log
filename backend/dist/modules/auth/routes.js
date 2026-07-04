import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../../config/db.js';
import { verifyPassword, hashPassword, sha256, randomToken } from '../../utils/crypto.js';
import { signAccess, signRefresh, verifyRefresh } from '../../utils/jwt.js';
import { requireAuth } from '../../middleware/auth.js';
import { audit } from '../../services/audit.js';
const router = Router();
const loginSchema = z.object({
    identifier: z.string(), // email or employeeCode
    password: z.string().min(6)
});
router.post('/login', async (req, res) => {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success)
        return res.status(400).json({ error: 'Invalid input' });
    const { identifier, password } = parse.data;
    const user = await prisma.user.findFirst({
        where: { OR: [{ email: identifier }, { employeeCode: identifier }], isActive: true },
        include: { roles: { include: { role: true } }, employee: true }
    });
    if (!user)
        return res.status(401).json({ error: 'Invalid credentials' });
    if (user.lockedUntil && user.lockedUntil > new Date())
        return res.status(423).json({ error: 'Account locked' });
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) {
        const failed = user.failedLogins + 1;
        await prisma.user.update({ where: { id: user.id }, data: { failedLogins: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } });
        await audit({ actorId: user.id, action: 'auth.failed_login', entity: 'User', entityId: user.id, ip: req.ip, userAgent: req.headers['user-agent'] });
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    await prisma.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() } });
    const roles = user.roles.map(r => r.role.name);
    const accessToken = signAccess({ sub: user.id, roles });
    const refreshRaw = randomToken(48);
    const refreshHash = sha256(refreshRaw);
    await prisma.refreshToken.create({
        data: { userId: user.id, tokenHash: refreshHash, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), ip: req.ip, userAgent: req.headers['user-agent'] || '' }
    });
    res.cookie('refresh_token', signRefresh({ jti: refreshHash }), { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 30 * 24 * 3600 * 1000, path: '/api/auth' });
    await audit({ actorId: user.id, action: 'auth.login', entity: 'User', entityId: user.id, ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json({ accessToken, user: { id: user.id, email: user.email, roles, employeeId: user.employee?.id ?? null, name: user.employee?.fullName ?? null } });
});
router.post('/refresh', async (req, res) => {
    const token = req.cookies?.refresh_token;
    if (!token)
        return res.status(401).json({ error: 'No refresh' });
    try {
        const decoded = verifyRefresh(token);
        const jti = decoded.jti;
        const rt = await prisma.refreshToken.findFirst({ where: { tokenHash: jti, revokedAt: null }, include: { user: { include: { roles: { include: { role: true } } } } } });
        if (!rt || rt.expiresAt < new Date())
            return res.status(401).json({ error: 'Expired' });
        // rotate
        await prisma.refreshToken.update({ where: { id: rt.id }, data: { revokedAt: new Date() } });
        const roles = rt.user.roles.map(r => r.role.name);
        const accessToken = signAccess({ sub: rt.userId, roles });
        const refreshRaw = randomToken(48);
        const refreshHash = sha256(refreshRaw);
        await prisma.refreshToken.create({ data: { userId: rt.userId, tokenHash: refreshHash, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000), ip: req.ip, userAgent: req.headers['user-agent'] || '' } });
        res.cookie('refresh_token', signRefresh({ jti: refreshHash }), { httpOnly: true, sameSite: 'lax', secure: process.env.COOKIE_SECURE === 'true', maxAge: 30 * 24 * 3600 * 1000, path: '/api/auth' });
        res.json({ accessToken });
    }
    catch {
        res.status(401).json({ error: 'Invalid refresh' });
    }
});
router.post('/logout', requireAuth, async (req, res) => {
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.json({ ok: true });
});
router.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId }, include: { employee: { include: { branch: true, department: true, shift: true } }, roles: { include: { role: true } } } });
    res.json(user);
});
router.post('/change-password', requireAuth, async (req, res) => {
    const schema = z.object({ currentPassword: z.string(), newPassword: z.string().min(8) });
    const p = schema.safeParse(req.body);
    if (!p.success)
        return res.status(400).json({ error: 'Weak password' });
    const user = await prisma.user.findUnique({ where: { id: req.auth.userId } });
    if (!user)
        return res.status(404).json({ error: 'Not found' });
    const ok = await verifyPassword(user.passwordHash, p.data.currentPassword);
    if (!ok)
        return res.status(400).json({ error: 'Current password incorrect' });
    const hash = await hashPassword(p.data.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hash } });
    await audit({ actorId: user.id, action: 'auth.password_change', entity: 'User', entityId: user.id, ip: req.ip, userAgent: req.headers['user-agent'] });
    res.json({ ok: true });
});
export default router;
