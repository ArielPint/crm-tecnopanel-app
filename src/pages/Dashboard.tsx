import { useEffect, useState } from 'react'
import { Briefcase, TrendingUp, CheckCircle2, DollarSign, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Oportunidad, OportunidadHistorialEtapa } from '@/types/database'

interface Stats { total: number; activas: number; ganadas: number; monto: number }

const ETAPAS = [
  'Clasificación','Ingeniería','Cubicación','Presupuestos',
  'Revisión Vendedor','Revisión Cliente','Evaluación Crediticia',
]

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

const STAT_CARDS = (s: Stats, loading: boolean) => [
  {
    label: 'Total oportunidades',
    value: loading ? '-' : String(s.total),
    icon: Briefcase,
    iconBg: 'bg-slate-100',
    iconColor: 'text-slate-500',
    valueColor: 'text-gray-800',
  },
  {
    label: 'En curso',
    value: loading ? '-' : String(s.activas),
    icon: TrendingUp,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    valueColor: 'text-red-600',
  },
  {
    label: 'Ganadas',
    value: loading ? '-' : String(s.ganadas),
    icon: CheckCircle2,
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-500',
    valueColor: 'text-emerald-600',
  },
  {
    label: 'Monto estimado',
    value: loading ? '-' : formatCLP(s.monto),
    icon: DollarSign,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600',
  },
]

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
    <div className="p-6 space-y-6">
      <p className="text-sm text-gray-500">
        Bienvenido, <span className="font-medium text-gray-700">{profile?.nombre}</span>
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS(stats, loading).map(k => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-lg ${k.iconBg} flex items-center justify-center flex-shrink-0`}>
              <k.icon size={18} className={k.iconColor} />
            </div>
            <div className="min-w-0 overflow-hidden">
              <p className={`text-xl font-bold leading-none truncate ${k.valueColor}`}>{k.value}</p>
              <p className="text-xs text-gray-400 mt-1.5 leading-tight">{k.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-5">Pipeline por etapa</h2>
        {loading ? (
          <div className="space-y-3">
            {ETAPAS.map(e => (
              <div key={e} className="flex items-center gap-3">
                <div className="w-44 h-3 bg-slate-100 rounded animate-pulse" />
                <div className="flex-1 h-5 bg-slate-100 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {ETAPAS.map((etapa, i) => (
              <div key={etapa} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-44 truncate">{etapa}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                  <div
                    className="h-5 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max((funnel[etapa] ?? 0) / maxFunnel * 100, funnel[etapa] ? 6 : 0)}%`,
                      background: ETAPA_COLORS[i],
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-gray-600 w-5 text-right">{funnel[etapa] ?? 0}</span>
                {avgDias[etapa] !== undefined && (
                  <span className="text-xs text-gray-400 w-16 text-right">{avgDias[etapa]}d prom.</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tiempo promedio */}
      {!loading && Object.keys(avgDias).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <Clock size={15} className="text-gray-400" />
            <h2 className="text-sm font-semibold text-gray-700">Tiempo promedio por etapa (días)</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {ETAPAS.map((etapa, i) => avgDias[etapa] !== undefined && (
              <div key={etapa} className="rounded-lg p-4 text-center bg-slate-50 border border-slate-200">
                <p className="text-2xl font-bold" style={{ color: ETAPA_COLORS[i] }}>{avgDias[etapa]}</p>
                <p className="text-[11px] text-gray-400 mt-1 leading-tight">{etapa}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
