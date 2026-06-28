import { useEffect, useState } from 'react'
import { TrendingUp, Briefcase, CheckCircle, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { EtapaOportunidad } from '@/types/database'

interface Stats {
  total: number
  activas: number
  ganadas: number
  monto: number
}

const ETAPAS: EtapaOportunidad[] = [
  'Clasificación','Ingeniería','Cubicación','Presupuestos',
  'Revisión Vendedor','Revisión Cliente','Evaluación Crediticia',
]

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, activas: 0, ganadas: 0, monto: 0 })
  const [funnel, setFunnel] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('oportunidades').select('*')
      if (!data) return
      const total   = data.length
      const ganadas = data.filter(o => o.etapa_actual === 'Ganado').length
      const activas = data.filter(o => !['Ganado','Perdido'].includes(o.etapa_actual)).length
      const monto   = data.reduce((s, o) => s + (o.monto_estimado || 0), 0)
      setStats({ total, activas, ganadas, monto })

      const f: Record<string, number> = {}
      ETAPAS.forEach(e => { f[e] = data.filter(o => o.etapa_actual === e).length })
      setFunnel(f)
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    { label: 'Total oportunidades', value: stats.total,  icon: <Briefcase size={20} />,    color: '#424243' },
    { label: 'En curso',           value: stats.activas, icon: <TrendingUp size={20} />,   color: '#ed3224' },
    { label: 'Ganadas',            value: stats.ganadas, icon: <CheckCircle size={20} />,  color: '#059669' },
    { label: 'Monto estimado',     value: `$${(stats.monto/1000000).toFixed(1)}M`, icon: <DollarSign size={20} />, color: '#7c3aed' },
  ]

  const maxFunnel = Math.max(...Object.values(funnel), 1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Bienvenido, {profile?.nombre}. Aquí está el resumen del pipeline.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                 style={{ background: k.color }}>
              {k.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? '—' : k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline por etapa</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {ETAPAS.map(etapa => (
              <div key={etapa} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-40 truncate">{etapa}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5">
                  <div
                    className="h-5 rounded-full transition-all"
                    style={{
                      width: `${((funnel[etapa] || 0) / maxFunnel) * 100}%`,
                      background: '#ed3224',
                      minWidth: funnel[etapa] ? 24 : 0,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-5 text-right">
                  {funnel[etapa] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}import { useEffect, useState } from 'react'
import { TrendingUp, Briefcase, CheckCircle, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { EtapaOportunidad } from '@/types/database'

interface Stats {
  total: number
  activas: number
  ganadas: number
  monto: number
}

const ETAPAS: EtapaOportunidad[] = [
  'ClasificaciÃ³n','IngenierÃ­a','CubicaciÃ³n','Presupuestos',
  'RevisiÃ³n Vendedor','RevisiÃ³n Cliente','EvaluaciÃ³n Crediticia',
]

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, activas: 0, ganadas: 0, monto: 0 })
  const [funnel, setFunnel] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('oportunidades').select('*')
      if (!data) return
      const total   = data.length
      const ganadas = data.filter(o => o.etapa_actual === 'Ganado').length
      const activas = data.filter(o => !['Ganado','Perdido'].includes(o.etapa_actual)).length
      const monto   = data.reduce((s, o) => s + (o.monto_estimado || 0), 0)
      setStats({ total, activas, ganadas, monto })

      const f: Record<string, number> = {}
      ETAPAS.forEach(e => { f[e] = data.filter(o => o.etapa_actual === e).length })
      setFunnel(f)
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    { label: 'Total oportunidades', value: stats.total,  icon: <Briefcase size={20} />,    color: '#424243' },
    { label: 'En curso',           value: stats.activas, icon: <TrendingUp size={20} />,   color: '#ed3224' },
    { label: 'Ganadas',            value: stats.ganadas, icon: <CheckCircle size={20} />,  color: '#059669' },
    { label: 'Monto estimado',     value: `$${(stats.monto/1000000).toFixed(1)}M`, icon: <DollarSign size={20} />, color: '#7c3aed' },
  ]

  const maxFunnel = Math.max(...Object.values(funnel), 1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Bienvenido, {profile?.nombre}. AquÃ­ estÃ¡ el resumen del pipeline.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0"
                 style={{ background: k.color }}>
              {k.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{loading ? 'â' : k.value}</p>
              <p className="text-xs text-gray-500">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline por etapa</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <div className="space-y-2">
            {ETAPAS.map(etapa => (
              <div key={etapa} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-40 truncate">{etapa}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-5">
                  <div
                    className="h-5 rounded-full transition-all"
                    style={{
                      width: `${((funnel[etapa] || 0) / maxFunnel) * 100}%`,
                      background: '#ed3224',
                      minWidth: funnel[etapa] ? 24 : 0,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 w-5 text-right">
                  {funnel[etapa] || 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
