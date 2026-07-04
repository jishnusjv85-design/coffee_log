import { prisma } from '../config/db.js';

export async function audit(params: {
  actorId?: string | null;
  action: string;
  entity: string;
  entityId?: string;
  before?: any;
  after?: any;
  ip?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({ data: params });
}
