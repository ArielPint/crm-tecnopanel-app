import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Target, Compass, Hammer, Ruler, Landmark, Users, Building2, LogOut, ChevronRight, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePermisos } from '@/contexts/PermisosContext'

// Nota: se mantiene la ruta '/cubicacion' para el modulo renombrado a "Costos y Presupuestos"
// (antes "Cubicación") para no romper enlaces/bookmarks existentes; solo cambia el label visible.
const MODULO_RUTA: Record<string, string> = {
  Dashboard: '/dashboard',
  Oportunidades: '/oportunidades',
  'Ingeniería': '/ingenieria',
  'Desarrollo': '/desarrollo',
  'Costos y Presupuestos': '/cubicacion',
  'Negociación': '/negociacion',
  Clientes: '/clientes',
  Usuarios: '/usuarios',
}

const MODULO_ICON: Record<string, React.ReactNode> = {
  Dashboard:    <LayoutDashboard size={16} />,
  Oportunidades:<Target size={16} />,
  'Ingeniería': <Compass size={16} />,
  'Desarrollo': <Hammer size={16} />,
  'Costos y Presupuestos': <Ruler size={16} />,
  'Negociación': <Landmark size={16} />,
  Clientes:     <Building2 size={16} />,
  Usuarios:     <Users size={16} />,
}

const GRUPOS = [
  { label: 'Principal', modulos: ['Dashboard', 'Oportunidades'] },
  { label: 'Módulos',   modulos: ['Ingeniería', 'Desarrollo', 'Costos y Presupuestos', 'Negociación'] },
  { label: 'Sistema',   modulos: ['Clientes', 'Usuarios'] },
]

interface SidebarProps {
  open?: boolean
  onClose?: () => void
}

export default function Sidebar({ open = false, onClose }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const { canAccess, loading } = usePermisos()
  const rol = profile?.rol ?? ''

  const inner = (
    <aside className="w-64 flex-shrink-0 bg-[#1a1a1b] flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <img src="/logo%20horizontal.jpeg" alt="TECNOPANEL" className="object-contain h-8 flex-1" />
        {onClose && (
          <button onClick={onClose} className="ml-3 p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

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
                    onClick={onClose}
                    className={({ isActive }) =>
                      'group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ' +
                      (isActive
                        ? 'bg-brand-red text-white'
                        : 'text-white/60 hover:bg-white/10 hover:text-white')
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

      <div className="px-4 py-4 border-t border-white/10">
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

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">
        {inner}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative flex h-full">
            {inner}
          </div>
        </div>
      )}
    </>
  )
}
