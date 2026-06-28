import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PermisosProvider, usePermisos } from '@/contexts/PermisosContext'
import { AppLayout } from '@/components/Layout/AppLayout'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Oportunidades from '@/pages/Oportunidades'
import Clientes from '@/pages/Clientes'
import Usuarios from '@/pages/Usuarios'
import Ingenieria from '@/pages/Ingenieria'
import Cubicacion from '@/pages/Cubicacion'
import Presupuestos from '@/pages/Presupuestos'
import Credito from '@/pages/Credito'

function ProtectedRoute({ modulo, children }: { modulo: string; children: React.ReactNode }) {
  const { profile } = useAuth()
  const { canAccess, loading } = usePermisos()
  if (loading) return null
  if (!profile || !canAccess(modulo, profile.rol)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={session ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/oportunidades" element={<ProtectedRoute modulo="Oportunidades"><Oportunidades /></ProtectedRoute>} />
        <Route path="/ingenieria"    element={<ProtectedRoute modulo="Ingeniería"><Ingenieria /></ProtectedRoute>} />
        <Route path="/cubicacion"    element={<ProtectedRoute modulo="Cubicación"><Cubicacion /></ProtectedRoute>} />
        <Route path="/presupuestos"  element={<ProtectedRoute modulo="Presupuestos"><Presupuestos /></ProtectedRoute>} />
        <Route path="/credito"       element={<ProtectedRoute modulo="Crédito"><Credito /></ProtectedRoute>} />
        <Route path="/clientes"      element={<ProtectedRoute modulo="Clientes"><Clientes /></ProtectedRoute>} />
        <Route path="/usuarios"      element={<ProtectedRoute modulo="Usuarios"><Usuarios /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
      <PermisosProvider>
        <AppRoutes />
      </PermisosProvider>
    </AuthProvider>
    </BrowserRouter>
  )
}
