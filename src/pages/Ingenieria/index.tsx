import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Oportunidad } from '@/types/database'

export default function Ingenieria() {
  const [opps, setOpps] = useState<Oportunidad[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('oportunidades')
      .select('*, cliente:clientes(razon_social), vendedor:profiles(nombre,apellido)')
      .eq('etapa_actual', 'Ingeniería')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { setOpps((data as Oportunidad[])||[]); setLoading(false) })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"/></div>

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-bold text-gray-800">Ingenieria</h1>
        <p className="text-xs text-gray-500">{opps.length} oportunidades en esta etapa</p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {opps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <div className="text-5xl mb-3 opacity-20">📋</div>
            <p className="text-sm">Sin oportunidades en Ingenieria</p>
          </div>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {opps.map(o => (
              <div key={o.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-400 font-mono">{o.codigo}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">{o.tipo_venta}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800">{o.nombre}</p>
                    {o.cliente && <p className="text-xs text-gray-500 mt-0.5">{o.cliente.razon_social}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {o.monto_estimado && (
                      <p className="text-sm font-bold" style={{color:'#ed3224'}}>${o.monto_estimado.toLocaleString('es-CL')}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{o.probabilidad ?? 0}% prob.</p>
                  </div>
                </div>
                {o.vendedor && (
                  <p className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2">
                    Vendedor: {o.vendedor.nombre} {o.vendedor.apellido}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
