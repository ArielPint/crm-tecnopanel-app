import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Demasiados intentos. Esperá ${Math.ceil((lockedUntil - Date.now()) / 1000)} segundos.`)
      return
    }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const next = attempts + 1
      setAttempts(next)
      if (next >= 5) setLockedUntil(Date.now() + 30_000)
      setError('Correo o contraseña incorrectos.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'radial-gradient(ellipse at center, #3a0a08 0%, #1a0404 60%, #0d0101 100%)' }}>
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <svg width="80" height="48" viewBox="0 0 120 72" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="20" width="12" height="52" fill="#ed3224"/>
            <rect x="16" y="8" width="12" height="64" fill="#ed3224"/>
            <rect x="32" y="0" width="12" height="72" fill="#ed3224"/>
            <text x="50" y="32" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#424243">TECNO</text>
            <text x="50" y="52" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#ed3224">PANEL</text>
          </svg>
        </div>

        <h1 className="text-center text-xl font-bold text-gray-800 mb-6">CRM Comercial</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electronico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="usuario@tecnopanel.cl"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contrasena
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-white font-semibold text-sm transition-colors disabled:opacity-60"
            style={{ background: '#ed3224' }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
