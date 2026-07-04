import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export default function AttendanceManagePage(){
  const { data=[] } = useQuery({ queryKey:['att-all'], queryFn: async ()=> (await api.get('/attendance')).data })
  return <div className="space-y-4">
    <h2 className="font-display text-2xl">Attendance Management</h2>
    <div className="card overflow-auto">
      <table className="w-full text-sm min-w-[760px]">
        <thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th>Hours</th><th>Location</th><th>Verified</th></tr></thead>
        <tbody>{data.map((a:any)=><tr key={a.id} className="border-t border-coffee-100 dark:border-coffee-800">
          <td>{a.employee?.fullName}</td>
          <td>{new Date(a.date).toLocaleDateString('en-IN')}</td>
          <td>{a.punchInAt? new Date(a.punchInAt).toLocaleTimeString():'—'}</td>
          <td>{a.punchOutAt? new Date(a.punchOutAt).toLocaleTimeString():'—'}</td>
          <td>{(a.workedMinutes/60).toFixed(1)}</td>
          <td className="text-xs">{a.punchInLat?.toFixed(4)}, {a.punchInLng?.toFixed(4)}</td>
          <td>{a.selfieVerified && a.networkVerified && a.geofenceVerified ? '✓' : '—'}</td>
        </tr>)}</tbody>
      </table>
    </div>
  </div>
}
