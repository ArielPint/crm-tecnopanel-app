import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { PermisosProvider, usePermisos } from '@/contexts/PermisosContext'
import { AppLayout } from '@/components/Layout/AppLayout'
import { supabase } from '@/lib/supabase'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Oportunidades from '@/pages/Oportunidades'
import Clientes from '@/pages/Clientes'
import Usuarios from '@/pages/Usuarios'
import Ingenieria from '@/pages/Ingenieria'
import GanadasPerdidas from '@/pages/GanadasPerdidas'
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

function ForcePasswordChange({ userId }: { userId: string }) {
  const [newPass, setNewPass] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (newPass.length < 6) { setError('Mínimo 6 caracteres'); return }
    setSaving(true); setError(null)
    const { error: err } = await supabase.auth.updateUser({ password: newPass })
    if (err) { setError(err.message); setSaving(false); return }
    await supabase.from('profiles').update({ must_change_password: false }).eq('id', userId)
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100"><h2 className="text-lg font-bold text-gray-800">Cambia tu contraseña</h2><p className="text-xs text-gray-500 mt-1">Es tu primer ingreso, debes establecer una contraseña nueva.</p></div>
        <div className="px-6 py-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nueva contraseña</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Mínimo 6 caracteres" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"/>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <button onClick={handleSubmit} disabled={saving || !newPass} className="px-4 py-2 text-sm bg-brand-red text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar y continuar'}</button>
        </div>
      </div>
    </div>
  )
}

function AppRoutes() {
  const { session, profile, loading } = useAuth()
  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (session && profile?.must_change_password) return <ForcePasswordChange userId={profile.id} />
  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route element={session ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard"     element={<Dashboard />} />
        <Route path="/oportunidades" element={<ProtectedRoute modulo="Oportunidades"><Oportunidades /></ProtectedRoute>} />
        <Route path="/ingenieria"    element={<ProtectedRoute modulo="Ingeniería"><Ingenieria /></ProtectedRoute>} />
        <Route path="/ganadas-perdidas" element={<ProtectedRoute modulo="Ganadas y Perdidas"><GanadasPerdidas /></ProtectedRoute>} />
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
