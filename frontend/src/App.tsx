import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './store/auth'
import LoginPage from './pages/auth/LoginPage'
import EmployeeDashboard from './pages/employee/Dashboard'
import PunchPage from './pages/employee/PunchPage'
import AttendanceHistory from './pages/employee/AttendanceHistory'
import PayrollPage from './pages/employee/PayrollPage'
import AdminDashboard from './pages/admin/Dashboard'
import EmployeesPage from './pages/admin/EmployeesPage'
import AttendanceManagePage from './pages/admin/AttendanceManagePage'
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import AppLayout from './layouts/AppLayout'
import { useEffect } from 'react'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RoleGate({ allow, children }: { allow: string[], children: React.ReactNode }) {
  const { user } = useAuth()
  const roles = user?.roles || []
  if (!roles.some(r=>allow.includes(r))) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App(){
  const loadMe = useAuth(s=>s.loadMe)
  useEffect(()=>{ loadMe() },[])
  const user = useAuth(s=>s.user)
  const home = !user ? '/login' : user.roles.includes('SUPER_ADMIN') ? '/superadmin' : user.roles.includes('ADMIN') ? '/admin' : '/'

  return <Routes>
    <Route path="/login" element={<LoginPage/>} />
    <Route element={<RequireAuth><AppLayout/></RequireAuth>}>
      <Route path="/" element={<EmployeeDashboard/>} />
      <Route path="/punch" element={<PunchPage/>} />
      <Route path="/attendance" element={<AttendanceHistory/>} />
      <Route path="/payroll" element={<PayrollPage/>} />
      <Route path="/admin" element={<RoleGate allow={['ADMIN','SUPER_ADMIN']}><AdminDashboard/></RoleGate>} />
      <Route path="/admin/employees" element={<RoleGate allow={['ADMIN','SUPER_ADMIN']}><EmployeesPage/></RoleGate>} />
      <Route path="/admin/attendance" element={<RoleGate allow={['ADMIN','SUPER_ADMIN']}><AttendanceManagePage/></RoleGate>} />
      <Route path="/superadmin" element={<RoleGate allow={['SUPER_ADMIN']}><SuperAdminDashboard/></RoleGate>} />
    </Route>
    <Route path="*" element={<Navigate to={home} replace />} />
  </Routes>
}
