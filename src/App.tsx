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
import Desarrollo from '@/pages/Desarrollo'
import Cubicacion from '@/pages/Cubicacion'
import Negociacion from '@/pages/Negociacion'
import RevisionVendedor from '@/pages/RevisionVendedor'

function ProtectedRoute({ modulo, children }: { modulo: string; children: React.ReactNode }) {
  const { profile } = useAuth()
  const { canAccess, loading } = usePermisos()
  if (loading) return null
  if (!profile || !canAccess(modulo)) return <Navigate to="/dashboard" replace />
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
        <Route path="/desarrollo"    element={<ProtectedRoute modulo="Desarrollo"><Desarrollo /></ProtectedRoute>} />
        <Route path="/cubicacion"    element={<ProtectedRoute modulo="Costos y Presupuestos"><Cubicacion /></ProtectedRoute>} />
        <Route path="/negociacion"   element={<ProtectedRoute modulo="Negociación"><Negociacion /></ProtectedRoute>} />
        <Route path="/revision-vendedor" element={<ProtectedRoute modulo="Revisión Vendedor"><RevisionVendedor /></ProtectedRoute>} />
        <Route path="/clientes"      element={<ProtectedRoute modulo="Clientes"><Clientes /></ProtectedRoute>} />
        <Route path="/usuarios"      element={<ProtectedRoute modulo="Usuarios"><Usuarios /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

import { GlobalModalsProvider } from '@/contexts/GlobalModalsContext'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermisosProvider>
          <GlobalModalsProvider>
            <AppRoutes />
          </GlobalModalsProvider>
        </PermisosProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
