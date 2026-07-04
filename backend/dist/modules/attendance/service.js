import { prisma } from '../../config/db.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import tz from 'dayjs/plugin/timezone.js';
import { env } from '../../config/env.js';
dayjs.extend(utc);
dayjs.extend(tz);
const TZ = env.timezone;
function todayIST() {
    return dayjs().tz(TZ).format('YYYY-MM-DD');
}
function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371000;
    const toRad = (x) => x * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}
export async function verifyNetwork(ip, branchId) {
    if (!branchId)
        return { ok: true, reason: 'no_branch' };
    const configs = await prisma.networkConfiguration.findMany({ where: { branchId, isActive: true } });
    if (configs.length === 0)
        return { ok: true, reason: 'no_config_open' }; // for initial setup
    // Simple exact IP match / CIDR prefix match (MVP)
    const ok = configs.some(c => c.publicIp && c.publicIp === ip);
    return { ok, reason: ok ? 'matched' : 'ip_not_allowlisted' };
}
export async function verifyGeofence(lat, lng, branchId) {
    if (!branchId)
        return { ok: true, distance: 0 };
    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.latitude == null || branch.longitude == null)
        return { ok: true, distance: 0 };
    const dist = haversine(lat, lng, branch.latitude, branch.longitude);
    const ok = dist <= (branch.geofenceRadiusM || 150);
    return { ok: env.allowOutsideGeofence ? true : ok, distance: Math.round(dist), allowedRadius: branch.geofenceRadiusM };
}
export async function punchIn(opts) {
    const employee = await prisma.employee.findUnique({ where: { id: opts.employeeId }, include: { shift: true } });
    if (!employee)
        throw new Error('Employee not found');
    if (employee.employmentStatus === 'TERMINATED')
        throw new Error('Terminated');
    const dateStr = todayIST();
    const date = new Date(dateStr + 'T00:00:00.000Z');
    const existing = await prisma.attendance.findUnique({
        where: { employeeId_date: { employeeId: opts.employeeId, date } }
    });
    if (existing?.punchInAt)
        throw new Error('Already punched in today');
    const net = await verifyNetwork(opts.ip, employee.branchId);
    if (!net.ok)
        throw new Error('Punch In is only available from an authorized Coffee Bun office location.');
    const geo = await verifyGeofence(opts.lat, opts.lng, employee.branchId);
    if (!geo.ok)
        throw new Error(`Outside geofence: ${geo.distance}m > ${geo.allowedRadius}m`);
    if (!opts.selfieVerified)
        throw new Error('Selfie verification failed');
    const punchInAt = new Date();
    const att = await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: opts.employeeId, date } },
        update: {
            punchInAt, punchInLat: opts.lat, punchInLng: opts.lng, punchInIp: opts.ip,
            punchInDevice: opts.device,
            selfieVerified: true, selfieConfidence: opts.selfieConfidence ?? null, selfieFileId: opts.selfieFileId ?? null,
            networkVerified: true, geofenceVerified: true,
            branchId: employee.branchId
        },
        create: {
            employeeId: opts.employeeId, date,
            punchInAt, punchInLat: opts.lat, punchInLng: opts.lng, punchInIp: opts.ip,
            punchInDevice: opts.device,
            selfieVerified: true, selfieConfidence: opts.selfieConfidence ?? null, selfieFileId: opts.selfieFileId ?? null,
            networkVerified: true, geofenceVerified: true,
            branchId: employee.branchId,
            status: 'PRESENT'
        }
    });
    await prisma.employeeLocation.create({
        data: { employeeId: opts.employeeId, attendanceId: att.id, latitude: opts.lat, longitude: opts.lng, accuracy: opts.accuracy ?? null, source: 'punch_in' }
    });
    return att;
}
export function calcWorked(punchIn, punchOut, breakMinutes = 60) {
    const totalMin = Math.max(0, Math.floor((punchOut.getTime() - punchIn.getTime()) / 60000) - breakMinutes);
    return totalMin;
}
export async function punchOut(opts) {
    const dateStr = todayIST();
    const date = new Date(dateStr + 'T00:00:00.000Z');
    const att = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId: opts.employeeId, date } } });
    if (!att || !att.punchInAt)
        throw new Error('Not punched in');
    if (att.punchOutAt)
        throw new Error('Already punched out');
    const punchOutAt = new Date();
    const employee = await prisma.employee.findUnique({ where: { id: opts.employeeId }, include: { shift: true } });
    const breakMin = employee?.shift?.breakMinutes ?? 60;
    const workedMinutes = calcWorked(att.punchInAt, punchOutAt, breakMin);
    // Late / early based on shift
    let lateMinutes = 0, earlyLeaveMinutes = 0, overtimeMinutes = 0;
    if (employee?.shift) {
        const shiftStart = dayjs.tz(dateStr + ' ' + employee.shift.startTime, TZ);
        const shiftEnd = dayjs.tz(dateStr + ' ' + employee.shift.endTime, TZ);
        const inT = dayjs(att.punchInAt).tz(TZ);
        const outT = dayjs(punchOutAt).tz(TZ);
        lateMinutes = Math.max(0, inT.diff(shiftStart, 'minute') - (employee.shift.graceMinutes || 0));
        earlyLeaveMinutes = Math.max(0, shiftEnd.diff(outT, 'minute'));
        const overtimeThreshold = employee.shift.overtimeAfterMin ?? 480;
        overtimeMinutes = Math.max(0, workedMinutes - overtimeThreshold);
    }
    // daily earnings
    let dailyEarnings = 0;
    if (employee?.salaryType === 'HOURLY' || employee?.salaryType === 'HYBRID') {
        const rate = Number(employee.hourlyRate || 0);
        dailyEarnings = (workedMinutes / 60) * rate + (overtimeMinutes / 60) * Number(employee.overtimeRate || rate * 1.5);
    }
    else {
        // monthly prorated ~ 26 working days
        const monthly = Number(employee?.monthlySalary || 0);
        dailyEarnings = monthly / 26;
    }
    const updated = await prisma.attendance.update({
        where: { id: att.id },
        data: {
            punchOutAt,
            punchOutLat: opts.lat, punchOutLng: opts.lng, punchOutIp: opts.ip,
            punchOutDevice: opts.device,
            workedMinutes, overtimeMinutes, lateMinutes, earlyLeaveMinutes,
            dailyEarnings,
            status: lateMinutes > 0 ? 'LATE' : 'PRESENT'
        }
    });
    await prisma.employeeLocation.create({
        data: { employeeId: opts.employeeId, attendanceId: att.id, latitude: opts.lat, longitude: opts.lng, source: 'punch_out' }
    });
    return updated;
}
