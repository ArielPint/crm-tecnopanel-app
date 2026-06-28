import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Wrench, Box, Calculator, CreditCard, Users, Building2, LogOut, ChevronRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermisos } from '@/contexts/PermisosContext'

const MODULO_RUTA: Record<string, string> = {
  Dashboard: '/dashboard',
  Oportunidades: '/oportunidades',
  'Ingeniería': '/ingenieria',
  'Cubicación': '/cubicacion',
  Presupuestos: '/presupuestos',
  'Crédito': '/credito',
  Clientes: '/clientes',
  Usuarios: '/usuarios',
}

const MODULO_ICON: Record<string, React.ReactNode> = {
  Dashboard:    <LayoutDashboard size={16} />,
  Oportunidades:<Briefcase size={16} />,
  'Ingeniería': <Wrench size={16} />,
  'Cubicación': <Box size={16} />,
  Presupuestos: <Calculator size={16} />,
  'Crédito':    <CreditCard size={16} />,
  Clientes:     <Building2 size={16} />,
  Usuarios:     <Users size={16} />,
}

const GRUPOS = [
  { label: 'Principal', modulos: ['Dashboard', 'Oportunidades'] },
  { label: 'Módulos',   modulos: ['Ingeniería', 'Cubicación', 'Presupuestos', 'Crédito'] },
  { label: 'Sistema',   modulos: ['Clientes', 'Usuarios'] },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { canAccess, loading } = usePermisos()
  const rol = profile?.rol ?? ''

  return (
    <aside className="w-64 flex-shrink-0 bg-[#1a1a1b] flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <img src="/logo%20horizontal.jpeg" alt="TECNOPANEL" className="w-full object-contain max-h-10" />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {GRUPOS.map(grupo => {
          const visibles = grupo.modulos.filter(m => canAccess(m, rol))
          if (!visibles.length) return null
          return (
            <div key={grupo.label}>
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 mb-1.5">
                {grupo.label}
              </p>
              <div className="space-y-0.5">
                {visibles.map(m => (
                  <NavLink
                    key={m}
                    to={MODULO_RUTA[m]}
                    className={({ isActive }) =>
                      'group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ' +
                      (isActive
                        ? 'bg-brand-red text-white shadow-sm'
                        : 'text-white/60 hover:bg-white/6 hover:text-white')
                    }
                  >
                    <span className="flex items-center gap-2.5">
                      {MODULO_ICON[m]}
                      {m}
                    </span>
                    <ChevronRight size={12} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                  </NavLink>
                ))}
              </div>
            </div>
          )
        })}
        {loading && <div className="px-3 py-2 text-xs text-white/30">Cargando...</div>}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {profile?.nombre?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{profile?.nombre} {profile?.apellido}</p>
            <p className="text-[10px] text-white/40">{rol}</p>
          </div>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white transition-colors w-full"
        >
          <LogOut size={13} /> Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
