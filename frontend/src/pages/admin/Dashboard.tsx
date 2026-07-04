import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminDashboard(){
  const { data: employees=[] } = useQuery({ queryKey:['employees'], queryFn: async ()=> (await api.get('/employees')).data })
  const { data: attendance=[] } = useQuery({ queryKey:['att-all'], queryFn: async ()=> (await api.get('/attendance')).data })
  const present = attendance.filter((a:any)=> a.punchInAt && !a.punchOutAt).length
  const chart = [...Array(7)].map((_,i)=>({ day:`D${i+1}`, hours: 6+Math.random()*3 }))
  return <div className="space-y-6">
    <h2 className="font-display text-2xl">Admin Dashboard</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        ['Total Employees', employees.length],
        ['Present Today', present],
        ['Attendance Logs', attendance.length],
        ['Payroll Pending', '—']
      ].map(([k,v])=> <div key={k as string} className="card"><div className="text-sm text-coffee-600">{k}</div><div className="text-2xl font-semibold">{String(v)}</div></div>)}
    </div>
    <div className="card h-72"><h3 className="font-semibold mb-2">Weekly Hours</h3><ResponsiveContainer width="100%" height="90%"><BarChart data={chart}><XAxis dataKey="day"/><YAxis/><Tooltip/><Bar dataKey="hours" /></BarChart></ResponsiveContainer></div>
  </div>
}
