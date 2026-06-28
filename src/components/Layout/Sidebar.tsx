import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, HardHat, Calculator,
  FileText, CreditCard, Users, Building2, LogOut, ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import type { RolUsuario } from '@/types/database'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
  roles: RolUsuario[]
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Principal',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} />, roles: ['admin','gerente_ventas','gerente_general','vendedor','jefe_ingenieria','ingeniero','cubicador','presupuestista','finanzas'] },
      { to: '/oportunidades', label: 'Oportunidades', icon: <Briefcase size={16} />, roles: ['admin','gerente_ventas','gerente_general','vendedor','jefe_ingenieria'] },
    ],
  },
  {
    group: 'Modulos',
    items: [
      { to: '/ingenieria', label: 'Ingenieria', icon: <HardHat size={16} />, roles: ['admin','jefe_ingenieria','ingeniero'] },
      { to: '/cubicacion', label: 'Cubicacion', icon: <Calculator size={16} />, roles: ['admin','cubicador'] },
      { to: '/presupuestos', label: 'Presupuestos', icon: <FileText size={16} />, roles: ['admin','presupuestista'] },
      { to: '/credito', label: 'Eval. Crediticia', icon: <CreditCard size={16} />, roles: ['admin','finanzas'] },
    ],
  },
  {
    group: 'Sistema',
    items: [
      { to: '/clientes', label: 'Clientes', icon: <Building2 size={16} />, roles: ['admin','gerente_ventas','gerente_general','vendedor'] },
      { to: '/usuarios', label: 'Usuarios', icon: <Users size={16} />, roles: ['admin','gerente_ventas'] },
    ],
  },
]

export function Sidebar() {
  const { profile, signOut } = useAuth()

  const visibleNav = NAV.map(g => ({
    ...g,
    items: g.items.filter(i => profile ? i.roles.includes(profile.rol) : false),
  })).filter(g => g.items.length > 0)

  return (
    <aside className="w-56 bg-brand-bg text-slate-300 flex flex-col flex-shrink-0 h-screen">
      <div style={{ background: 'white', borderBottom: '2px solid #ed3224' }}>
        <img src="/logo horizontal.jpeg" alt="TECNOPANEL" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>
      <nav className="flex-1 p-2 space-y-4 overflow-y-auto mt-2">
        {visibleNav.map(group => (
          <div key={group.group}>
            <p className="text-slate-500 text-xs uppercase tracking-widest px-3 pb-1">{group.group}</p>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  ['flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-brand-red/15 text-red-400 border-l-2 border-brand-red'
                    : 'text-slate-400 hover:bg-brand-red/10 hover:text-slate-200'
                  ].join(' ')
                }
              >
                {item.icon}
                <span>{item.label}</span>
                <ChevronRight size={12} className="ml-auto opacity-40" />
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      {profile && (
        <div className="p-3 border-t border-slate-700/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {profile.nombre[0]}{profile.apellido[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{profile.nombre} {profile.apellido}</p>
              <p className="text-xs text-slate-500 truncate capitalize">{profile.rol.replace(/_/g, ' ')}</p>
            </div>
            <button onClick={signOut} className="text-slate-500 hover:text-red-400 transition-colors" title="Cerrar sesion">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
