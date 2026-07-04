import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'
export default function PayrollPage(){
  const { data=[] } = useQuery({ queryKey:['my-pay'], queryFn: async ()=> (await api.get('/payroll/me')).data })
  const pending = data.reduce((s:number,p:any)=> s+Number(p.pendingAmount||0),0)
  return <div className="space-y-4">
    <h2 className="font-display text-2xl">My Payroll</h2>
    <div className="card">Pending Salary: <b>₹ {pending.toLocaleString('en-IN')}</b></div>
    <div className="card overflow-auto"><table className="w-full text-sm"><thead><tr><th>Period</th><th>Worked</th><th>Gross</th><th>Net</th><th>Status</th></tr></thead><tbody>{data.map((p:any)=><tr key={p.id}><td>{new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}</td><td>{(p.totalWorkedMin/60).toFixed(1)}h</td><td>₹{p.grossAmount}</td><td>₹{p.netAmount}</td><td>{p.status}</td></tr>)}</tbody></table></div>
  </div>
}
