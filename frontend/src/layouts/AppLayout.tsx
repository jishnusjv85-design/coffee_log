import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'

export default function AppLayout(){
  const { user, logout } = useAuth()
  const loc = useLocation()
  const nav = useNavigate()
  const roles = user?.roles || []
  const isAdmin = roles.includes('ADMIN') || roles.includes('SUPER_ADMIN')
  const isSuper = roles.includes('SUPER_ADMIN')

  const NavItem = ({to,label}:{to:string,label:string}) => (
    <Link to={to} className={`px-3 py-2 rounded-xl text-sm ${loc.pathname===to ? 'bg-coffee-700 text-white' : 'hover:bg-coffee-100 dark:hover:bg-coffee-800'}`}>{label}</Link>
  )

  return <div className="min-h-screen">
    <header className="border-b border-coffee-200 dark:border-coffee-800 bg-white/70 dark:bg-coffee-900/70 backdrop-blur sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-coffee-800 text-cream grid place-items-center font-display font-bold">CB</div>
          <div className="font-display text-xl">Coffee Bun</div>
          <span className="text-xs text-coffee-600 dark:text-coffee-300">Attendance & Payroll</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-coffee-700 dark:text-coffee-200">{user?.name || user?.email}</span>
          <button className="btn-secondary px-3 py-1.5 rounded-lg" onClick={async()=>{ await logout(); nav('/login') }}>Logout</button>
        </div>
      </div>
    </header>
    <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[230px_1fr] gap-6">
      <aside className="card h-fit">
        <nav className="flex flex-col gap-1">
          <NavItem to="/" label="Dashboard" />
          <NavItem to="/punch" label="Punch In/Out" />
          <NavItem to="/attendance" label="My Attendance" />
          <NavItem to="/payroll" label="My Payroll" />
          {isAdmin && <div className="text-xs uppercase text-coffee-500 mt-3 mb-1">Admin</div>}
          {isAdmin && <NavItem to="/admin" label="Admin Dashboard" />}
          {isAdmin && <NavItem to="/admin/employees" label="Employees" />}
          {isAdmin && <NavItem to="/admin/attendance" label="Attendance" />}
          {isSuper && <div className="text-xs uppercase text-coffee-500 mt-3 mb-1">Super Admin</div>}
          {isSuper && <NavItem to="/superadmin" label="Super Admin" />}
        </nav>
      </aside>
      <main><Outlet/></main>
    </div>
    <footer className="max-w-6xl mx-auto px-4 py-10 text-center text-sm text-coffee-600 dark:text-coffee-400">© {new Date().getFullYear()} Coffee Bun • Asia/Kolkata • INR</footer>
  </div>
}
