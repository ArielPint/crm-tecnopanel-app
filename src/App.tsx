import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PermisosProvider } from '@/contexts/PermisosContext'
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  return session ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { session } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/oportunidades" element={<Oportunidades />} />
        <Route path="/ingenieria"   element={<Ingenieria />} />
        <Route path="/cubicacion"   element={<Cubicacion />} />
        <Route path="/presupuestos" element={<Presupuestos />} />
        <Route path="/credito"      element={<Credito />} />
        <Route path="/clientes"     element={<Clientes />} />
        <Route path="/usuarios"     element={<Usuarios />} />
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
