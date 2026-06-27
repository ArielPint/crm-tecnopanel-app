import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { AppLayout } from '@/components/Layout/AppLayout'
import Login         from '@/pages/Login'
import Dashboard     from '@/pages/Dashboard'
import Oportunidades from '@/pages/Oportunidades'

// PÃ¡ginas stub â se implementarÃ¡n en fases siguientes
const Stub = ({ title }: { title: string }) => (
  <div className="p-6">
    <h1 className="text-xl font-bold text-gray-700">{title}</h1>
    <p className="text-sm text-gray-400 mt-1">MÃ³dulo en desarrollo</p>
  </div>
)

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
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/oportunidades" element={<Oportunidades />} />
        <Route path="/ingenieria"    element={<Stub title="IngenierÃ­a" />} />
        <Route path="/cubicacion"    element={<Stub title="CubicaciÃ³n" />} />
        <Route path="/presupuestos"  element={<Stub title="Presupuestos" />} />
        <Route path="/credito"       element={<Stub title="EvaluaciÃ³n Crediticia" />} />
        <Route path="/clientes"      element={<Stub title="Clientes" />} />
        <Route path="/usuarios"      element={<Stub title="Usuarios" />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
