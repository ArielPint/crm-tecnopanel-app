import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Oportunidad } from '@/types/database'

interface Stats {
  total: number
  activas: number
  ganadas: number
  monto: number
}

const ETAPAS = [
  'Clasificacion','Ingenieria','Cubicacion','Presupuestos',
  'Revision Vendedor','Revision Cliente','Evaluacion Crediticia',
]

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, activas: 0, ganadas: 0, monto: 0 })
  const [funnel, setFunnel] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: rawData } = await supabase.from('oportunidades').select('*')
      const data = rawData as Oportunidad[] | null
      if (!data) return
      const total   = data.length
      const ganadas = data.filter(o => o.etapa_actual === 'Ganado').length
      const activas = data.filter(o => !['Ganado','Perdido'].includes(o.etapa_actual)).length
      const monto   = data.reduce((s, o) => s + (o.monto_estimado ?? 0), 0)
      setStats({ total, activas, ganadas, monto })
      const f: Record<string, number> = {}
      ETAPAS.forEach(e => { f[e] = data.filter(o => o.etapa_actual === e).length })
      setFunnel(f)
      setLoading(false)
    }
    load()
  }, [])

  const kpis = [
    { label: 'Total oportunidades', value: stats.total,  color: '#424243' },
    { label: 'En curso',           value: stats.activas, color: '#ed3224' },
    { label: 'Ganadas',            value: stats.ganadas, color: '#059669' },
    { label: 'Monto estimado',     value: String(stats.monto), color: '#7c3aed' },
  ]

  const maxFunnel = Math.max(...Object.values(funnel), 1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Bienvenido, {profile?.nombre}</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-2xl font-bold text-gray-800">{loading ? '-' : k.value}</p>
            <p className="text-xs text-gray-500">{k.label}</p>
          </div>
        ))}
      </div>
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
                  <div className="h-5 rounded-full"
                    style={{ width: ((funnel[etapa] ?? 0) / maxFunnel * 100) + '%', background: '#ed3224' }} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-5 text-right">{funnel[etapa] ?? 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
