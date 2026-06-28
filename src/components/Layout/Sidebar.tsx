import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Wrench, Box, Calculator, CreditCard, Users, Building2, LogOut } from 'lucide-react'
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
  Dashboard: <LayoutDashboard size={18}/>,
  Oportunidades: <Briefcase size={18}/>,
  'Ingeniería': <Wrench size={18}/>,
  'Cubicación': <Box size={18}/>,
  Presupuestos: <Calculator size={18}/>,
  'Crédito': <CreditCard size={18}/>,
  Clientes: <Building2 size={18}/>,
  Usuarios: <Users size={18}/>,
}

const GRUPOS = [
  { label: 'Principal', modulos: ['Dashboard','Oportunidades'] },
  { label: 'Módulos', modulos: ['Ingeniería','Cubicación','Presupuestos','Crédito'] },
  { label: 'Sistema', modulos: ['Clientes','Usuarios'] },
]

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const { canAccess, loading } = usePermisos()
  const rol = profile?.rol ?? ''

  return (
    <aside className="w-56 bg-white border-r border-gray-100 flex flex-col h-full shadow-sm">
      <div className="px-4 py-5 border-b border-gray-100">
        <img src="/logo%20horizontal.jpeg" alt="TECNOPANEL" className="h-8 object-contain"/>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
        {GRUPOS.map(grupo => {
          const visibles = grupo.modulos.filter(m => canAccess(m, rol))
          if (!visibles.length) return null
          return (
            <div key={grupo.label}>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">{grupo.label}</p>
              {visibles.map(m => (
                <NavLink
                  key={m}
                  to={MODULO_RUTA[m]}
                  className={({ isActive }) =>
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ' +
                    (isActive ? 'bg-red-50 text-brand-red' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800')
                  }
                >
                  {MODULO_ICON[m]}
                  <span>{m}</span>
                </NavLink>
              ))}
            </div>
          )
        })}
        {loading && <div className="px-3 py-2 text-xs text-gray-400">Cargando...</div>}
      </nav>

      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-xs font-medium text-gray-700 truncate">{profile?.nombre} {profile?.apellido}</p>
        <p className="text-[10px] text-gray-400 mb-2">{rol}</p>
        <button onClick={signOut} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors">
          <LogOut size={13}/> Cerrar sesion
        </button>
      </div>
    </aside>
  )
}
