import { prisma } from '../config/db.js';
export async function audit(params) {
    await prisma.auditLog.create({ data: params });
}
