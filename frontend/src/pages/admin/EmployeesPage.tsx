import { useQuery } from '@tanstack/react-query'
import { api } from '../../api/client'

export default function EmployeesPage(){
  const { data=[], refetch } = useQuery({ queryKey:['employees'], queryFn: async ()=> (await api.get('/employees')).data })
  return <div className="space-y-4">
    <h2 className="font-display text-2xl">Employees</h2>
    <div className="card overflow-auto">
      <table className="w-full text-sm"><thead><tr className="text-left"><th>Name</th><th>Code</th><th>Email</th><th>Branch</th><th>Status</th></tr></thead>
      <tbody>{data.map((e:any)=><tr key={e.id} className="border-t border-coffee-100 dark:border-coffee-800"><td>{e.fullName}</td><td>{e.employeeCode}</td><td>{e.user.email}</td><td>{e.branch?.name||'—'}</td><td>{e.employmentStatus}</td></tr>)}</tbody>
      </table>
    </div>
  </div>
}
