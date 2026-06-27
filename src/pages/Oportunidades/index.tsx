import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Oportunidad, EtapaOportunidad, TipoVenta } from '@/types/database'

const ETAPAS: EtapaOportunidad[] = [
  'ClasificaciÃ³n','IngenierÃ­a','CubicaciÃ³n','Presupuestos',
  'RevisiÃ³n Vendedor','RevisiÃ³n Cliente','EvaluaciÃ³n Crediticia',
]

const TIPO_COLOR: Record<TipoVenta, string> = {
  Proyecto: 'bg-purple-100 text-purple-700',
  Producto: 'bg-blue-100 text-blue-700',
  Kit:      'bg-amber-100 text-amber-700',
}

export default function Oportunidades() {
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [loading, setLoading]             = useState(true)
  const [busqueda, setBusqueda]           = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('oportunidades')
        .select('*, cliente:clientes(razon_social), vendedor:profiles(nombre,apellido)')
        .not('etapa_actual', 'in', '("Ganado","Perdido")')
        .order('updated_at', { ascending: false })
      setOportunidades((data as Oportunidad[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtradas = oportunidades.filter(o =>
    o.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
    o.cliente?.razon_social?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const porEtapa = (etapa: EtapaOportunidad) =>
    filtradas.filter(o => o.etapa_actual === etapa)

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Oportunidades</h1>
          <p className="text-xs text-gray-500">{filtradas.length} en curso</p>
        </div>
        <div className="flex-1 max-w-xs ml-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar..."
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
        </div>
        <button
          className="ml-auto flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          style={{ background: '#ed3224' }}
          onMouseOver={e => (e.currentTarget.style.background = '#c0241a')}
          onMouseOut={e => (e.currentTarget.style.background = '#ed3224')}
        >
          <Plus size={16} />
          Nueva
        </button>
      </div>

      {/* Kanban */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 h-full" style={{ minWidth: `${ETAPAS.length * 220}px` }}>
          {ETAPAS.map(etapa => {
            const cards = porEtapa(etapa)
            return (
              <div key={etapa} className="flex-shrink-0 w-52 flex flex-col">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-600">{etapa}</span>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5 font-medium">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {cards.map(opp => (
                    <div
                      key={opp.id}
                      className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-xs text-gray-400 font-mono">{opp.codigo}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${TIPO_COLOR[opp.tipo_venta]}`}>
                          {opp.tipo_venta}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight mb-1.5">
                        {opp.nombre}
                      </p>
                      {opp.cliente && (
                        <p className="text-xs text-gray-500 truncate">{opp.cliente.razon_social}</p>
                      )}
                      {opp.monto_estimado && (
                        <p className="text-xs font-medium mt-2" style={{ color: '#ed3224' }}>
                          ${opp.monto_estimado.toLocaleString('es-CL')}
                        </p>
                      )}
                      {/* Probabilidad bar */}
                      <div className="mt-2 bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ width: `${opp.probabilidad}%`, background: opp.probabilidad > 70 ? '#059669' : '#ed3224' }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{opp.probabilidad}% prob.</p>
                    </div>
                  ))}

                  {cards.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">Sin oportunidades</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
