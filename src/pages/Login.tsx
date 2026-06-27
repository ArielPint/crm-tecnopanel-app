import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError('Credenciales incorrectas. Verifica tu email y contraseÃ±a.')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #1a1a1b 0%, #3d0f0c 55%, #1a1a1b 100%)' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo horizontal.jpeg" alt="TECNOPANEL" className="h-14 w-auto" />
        </div>

        <h1 className="text-lg font-semibold text-gray-700 text-center mb-6">
          CRM Comercial
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrÃ³nico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="usuario@tecnopanel.cl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ContraseÃ±a
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-semibold py-3 rounded-lg transition-colors text-sm disabled:opacity-60"
            style={{ background: '#ed3224' }}
            onMouseOver={e => (e.currentTarget.style.background = '#c0241a')}
            onMouseOut={e => (e.currentTarget.style.background = '#ed3224')}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
