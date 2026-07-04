import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
export default function AttendanceHistory(){
  const { data=[] } = useQuery({ queryKey:['my-att'], queryFn: async ()=> (await api.get('/attendance/me')).data })
  return <div className="space-y-4">
    <h2 className="font-display text-2xl">My Attendance</h2>
    <div className="card overflow-auto"><table className="w-full text-sm min-w-[640px]"><thead><tr className="text-left"><th>Date</th><th>In</th><th>Out</th><th>Worked</th><th>OT</th><th>Earnings</th><th>Status</th></tr></thead><tbody>{data.map((a:any)=><tr key={a.id} className="border-t border-coffee-100 dark:border-coffee-800"><td className="py-2">{new Date(a.date).toLocaleDateString('en-IN')}</td><td>{a.punchInAt? new Date(a.punchInAt).toLocaleTimeString():'—'}</td><td>{a.punchOutAt? new Date(a.punchOutAt).toLocaleTimeString():'—'}</td><td>{(a.workedMinutes/60).toFixed(2)}h</td><td>{(a.overtimeMinutes/60).toFixed(2)}h</td><td>₹{Number(a.dailyEarnings).toFixed(2)}</td><td>{a.status}</td></tr>)}</tbody></table></div>
  </div>
}
