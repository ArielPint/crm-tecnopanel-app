import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

const TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/oportunidades':'Oportunidades',
  '/ingenieria':   'Ingeniería',
  '/cubicacion':   'Cubicación',
  '/presupuestos': 'Presupuestos',
  '/credito':      'Crédito',
  '/clientes':     'Clientes',
  '/usuarios':     'Usuarios',
}

export function AppLayout() {
  const { pathname } = useLocation()
  const title = TITLES[pathname] ?? ''

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 flex-shrink-0 shadow-sm">
          <h1 className="text-base font-semibold text-gray-800">{title}</h1>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
