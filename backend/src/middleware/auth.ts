import { Request, Response, NextFunction } from 'express';
import { verifyAccess } from '../utils/jwt.js';
import { prisma } from '../config/db.js';

export interface AuthUser {
  userId: string;
  roles: string[];
  employeeId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded: any = verifyAccess(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      include: { roles: { include: { role: true } }, employee: true }
    });
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' });
    req.auth = {
      userId: user.id,
      roles: user.roles.map(r => r.role.name),
      employeeId: user.employee?.id ?? null
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireRole(...allowed: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const roles = req.auth?.roles || [];
    const ok = roles.some(r => allowed.includes(r));
    if (!ok) return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}
