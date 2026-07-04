import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
import { Link } from 'react-router-dom'

export default function EmployeeDashboard(){
  const { data: atts=[] } = useQuery({ queryKey:['my-att'], queryFn: async ()=> (await api.get('/attendance/me')).data })
  const { data: payroll=[] } = useQuery({ queryKey:['my-pay'], queryFn: async ()=> (await api.get('/payroll/me')).data })
  const today = atts[0]
  const pending = payroll.reduce((s:number,p:any)=> s + Number(p.pendingAmount||0),0)

  return <div className="space-y-6">
    <h2 className="font-display text-2xl">Good morning ☕</h2>
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        ['Today In', today?.punchInAt ? new Date(today.punchInAt).toLocaleTimeString() : '—'],
        ['Today Out', today?.punchOutAt ? new Date(today.punchOutAt).toLocaleTimeString() : '—'],
        ['Hours Today', today ? (today.workedMinutes/60).toFixed(1)+'h' : '0h'],
        ['Pending Salary', `₹ ${pending.toLocaleString('en-IN')}`],
      ].map(([k,v])=> <div key={k} className="card"><div className="text-sm text-coffee-600 dark:text-coffee-300">{k}</div><div className="text-2xl font-semibold">{v}</div></div>)}
    </div>
    <div className="card">
      <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Last 30 days</h3><Link className="text-coffee-700 underline" to="/attendance">View all</Link></div>
      <table className="w-full text-sm">
        <thead><tr className="text-left text-coffee-600"><th className="py-2">Date</th><th>In</th><th>Out</th><th>Hours</th><th>Status</th></tr></thead>
        <tbody>{atts.slice(0,10).map((a:any)=><tr key={a.id} className="border-t border-coffee-100 dark:border-coffee-800"><td className="py-2">{new Date(a.date).toLocaleDateString('en-IN')}</td><td>{a.punchInAt? new Date(a.punchInAt).toLocaleTimeString():'—'}</td><td>{a.punchOutAt? new Date(a.punchOutAt).toLocaleTimeString():'—'}</td><td>{(a.workedMinutes/60).toFixed(1)}</td><td>{a.status}</td></tr>)}</tbody>
      </table>
    </div>
  </div>
}
