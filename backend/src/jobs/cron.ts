import cron from 'node-cron';
import { prisma } from '../config/db.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import tz from 'dayjs/plugin/timezone.js';
import { calcWorked } from '../modules/attendance/service.js';
dayjs.extend(utc); dayjs.extend(tz);

const TZ='Asia/Kolkata';

export function startCronJobs(){
  // 1:00 AM IST daily
  cron.schedule('0 1 * * *', async ()=>{
    console.log('[cron] auto-closing attendance...');
    const yesterday = dayjs().tz(TZ).subtract(1,'day').format('YYYY-MM-DD');
    const date = new Date(yesterday+'T00:00:00.000Z');
    const open = await prisma.attendance.findMany({ where: { date, punchInAt: { not: null }, punchOutAt: null, deletedAt: null }, include:{ employee: { include:{ shift:true } } } });
    for (const att of open){
      const punchOutAt = dayjs.tz(yesterday+' 23:59', TZ).toDate();
      const breakMin = att.employee.shift?.breakMinutes ?? 60;
      const workedMinutes = calcWorked(att.punchInAt!, punchOutAt, breakMin);
      await prisma.attendance.update({
        where: { id: att.id },
        data: {
          punchOutAt, workedMinutes,
          autoClosed: true,
          status: 'AUTO_CLOSED',
          dailyEarnings: att.employee.salaryType === 'HOURLY' ? (workedMinutes/60)*Number(att.employee.hourlyRate) : Number(att.employee.monthlySalary)/26
        }
      });
      await prisma.auditLog.create({ data: { action: 'attendance.auto_close', entity: 'Attendance', entityId: att.id }});
    }
    console.log(`[cron] auto-closed ${open.length} records`);
  }, { timezone: TZ });

  console.log('Cron jobs scheduled (Asia/Kolkata)');
}
