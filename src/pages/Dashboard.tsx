import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Oportunidad, OportunidadHistorialEtapa } from '@/types/database'

interface Stats { total: number; activas: number; ganadas: number; monto: number }

const ETAPAS = [
  'Clasificación','Ingeniería','Cubicación','Presupuestos',
  'Revisión Vendedor','Revisión Cliente','Evaluación Crediticia',
]

// Rampa monocromática: del rojo de marca desaturado (inicio) al rojo saturado (final)
const ETAPA_COLORS = [
  '#fca5a5','#f87171','#ef4444','#dc2626','#c0241a','#a31c13','#ed3224'
]

function formatCLP(n: number) {
  return '$' + n.toLocaleString('es-CL')
}

function diffDias(from: string, to: string | null) {
  const ms = (to ? new Date(to) : new Date()).getTime() - new Date(from).getTime()
  return Math.max(0, Math.floor(ms / 86400000))
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [stats, setStats] = useState<Stats>({ total: 0, activas: 0, ganadas: 0, monto: 0 })
  const [funnel, setFunnel] = useState<Record<string, number>>({})
  const [avgDias, setAvgDias] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: rawData }, { data: histData }] = await Promise.all([
        supabase.from('oportunidades').select('*'),
        supabase.from('oportunidad_historial_etapas').select('*'),
      ])
      const data = (rawData as Oportunidad[]) || []
      const hist = (histData as OportunidadHistorialEtapa[]) || []

      const total = data.length
      const ganadas = data.filter(o => o.etapa_actual === 'Ganado').length
      const activas = data.filter(o => !['Ganado','Perdido'].includes(o.etapa_actual)).length
      const monto = data.reduce((s, o) => s + (o.monto_estimado ?? 0), 0)
      setStats({ total, activas, ganadas, monto })

      const f: Record<string, number> = {}
      ETAPAS.forEach(e => { f[e] = data.filter(o => o.etapa_actual === e).length })
      setFunnel(f)

      const diasPorEtapa: Record<string, number[]> = {}
      hist.forEach(h => {
        const dias = diffDias(h.fecha_entrada, h.fecha_salida)
        if (!diasPorEtapa[h.etapa]) diasPorEtapa[h.etapa] = []
        diasPorEtapa[h.etapa].push(dias)
      })
      const avg: Record<string, number> = {}
      Object.entries(diasPorEtapa).forEach(([etapa, values]) => {
        avg[etapa] = Math.round(values.reduce((a, b) => a + b, 0) / values.length)
      })
      setAvgDias(avg)
      setLoading(false)
    }
    load()
  }, [])

  const maxFunnel = Math.max(...Object.values(funnel), 1)

  return (
    <div className="p-6 space-y-6 overflow-auto">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-500">Bienvenido, {profile?.nombre}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total oportunidades', value: loading ? '-' : String(stats.total),    color: 'var(--color-text)' },
          { label: 'En curso',            value: loading ? '-' : String(stats.activas),  color: 'var(--color-primary)' },
          { label: 'Ganadas',             value: loading ? '-' : String(stats.ganadas),  color: 'var(--color-success)' },
          { label: 'Monto estimado',      value: loading ? '-' : formatCLP(stats.monto), color: 'var(--color-info)' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-2xl font-bold" style={{ color: k.color }}>{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Pipeline por etapa</h2>
        {loading ? (
          <p className="text-sm text-gray-400">Cargando...</p>
        ) : (
          <div className="space-y-3">
            {ETAPAS.map((etapa, i) => (
              <div key={etapa} className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-44 truncate font-medium">{etapa}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className="h-6 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max((funnel[etapa] ?? 0) / maxFunnel * 100, funnel[etapa] ? 8 : 0)}%`,
                      background: ETAPA_COLORS[i],
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-700 w-6 text-right">{funnel[etapa] ?? 0}</span>
                {avgDias[etapa] !== undefined && (
                  <span className="text-xs text-gray-400 w-16 text-right">{avgDias[etapa]}d prom.</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {!loading && Object.keys(avgDias).length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Tiempo promedio por etapa (días)</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ETAPAS.map((etapa, i) => avgDias[etapa] !== undefined && (
              <div key={etapa} className="rounded-lg p-3 text-center bg-red-50 border border-red-100">
                <p className="text-xl font-bold" style={{ color: ETAPA_COLORS[i] }}>{avgDias[etapa]}</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{etapa}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
