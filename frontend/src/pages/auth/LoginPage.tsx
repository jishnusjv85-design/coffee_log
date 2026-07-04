import { useState } from 'react'
import { useAuth } from '../../store/auth'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

export default function LoginPage(){
  const [identifier,setIdentifier] = useState('emp001@coffeebun.local')
  const [password,setPassword] = useState('Employee123!')
  const login = useAuth(s=>s.login)
  const nav = useNavigate()
  const [loading,setLoading] = useState(false)

  const onSubmit = async (e:React.FormEvent)=>{
    e.preventDefault(); setLoading(true)
    try{
      await login(identifier,password)
      toast.success('Welcome to Coffee Bun')
      nav('/')
    }catch(err:any){
      toast.error(err?.response?.data?.error || 'Login failed')
    }finally{setLoading(false)}
  }

  return <div className="min-h-screen grid place-items-center px-4 bg-gradient-to-br from-cream to-coffee-100 dark:from-coffee-950 dark:to-coffee-900">
    <div className="card w-full max-w-md">
      <div className="text-center mb-6">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-coffee-800 text-cream grid place-items-center font-display font-bold text-xl">CB</div>
        <h1 className="font-display text-3xl mt-3">Coffee Bun</h1>
        <p className="text-coffee-600 dark:text-coffee-300 text-sm">Employee Attendance & Payroll</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="label">Email / Employee ID</label>
          <input className="input" value={identifier} onChange={e=>setIdentifier(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input type="password" className="input" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button disabled={loading} className="btn w-full">{loading? 'Signing in…':'Sign in'}</button>
        <p className="text-xs text-coffee-600 dark:text-coffee-400">Seed accounts: superadmin@coffeebun.local / ChangeMe123! · admin@coffeebun.local / Admin123! · emp001@coffeebun.local / Employee123!</p>
      </form>
    </div>
  </div>
}
