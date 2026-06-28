import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Oportunidad, EtapaOportunidad, TipoVenta } from '@/types/database'
import OportunidadDrawer from '@/components/OportunidadDrawer'

const ETAPAS: EtapaOportunidad[] = [
  'Clasificación','Ingeniería','Cubicación','Presupuestos',
  'Revisión Vendedor','Revisión Cliente','Evaluación Crediticia',
]

const TIPO_COLOR: Record<TipoVenta, string> = {
  Proyecto: 'bg-purple-100 text-purple-700',
  Producto: 'bg-blue-100 text-blue-700',
  Kit: 'bg-amber-100 text-amber-700',
}

interface Cliente { id: string; razon_social: string }
interface FormData {
  nombre: string; cliente_id: string; tipo_venta: TipoVenta;
  monto_estimado: string; probabilidad: string; etapa_actual: EtapaOportunidad;
  fecha_cierre_est: string; descripcion: string;
}
const FORM_INIT: FormData = { nombre:'', cliente_id:'', tipo_venta:'Proyecto', monto_estimado:'', probabilidad:'50', etapa_actual:'Clasificación', fecha_cierre_est:'', descripcion:'' }
function genCodigo() { const d = new Date(); return 'OPP-'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+'-'+Math.floor(Math.random()*9000+1000) }

export default function Oportunidades() {
  const { profile } = useAuth()
  const [oportunidades, setOportunidades] = useState<Oportunidad[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(FORM_INIT)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [selected, setSelected] = useState<Oportunidad | null>(null)

  async function load() {
    const [{ data: opps }, { data: cls }] = await Promise.all([
      supabase.from('oportunidades').select('*, cliente:clientes(razon_social), vendedor:profiles(nombre,apellido)').not('etapa_actual','in','("Ganado","Perdido")').order('updated_at',{ascending:false}),
      supabase.from('clientes').select('id,razon_social').order('razon_social'),
    ])
    setOportunidades((opps as Oportunidad[]) || [])
    setClientes((cls as Cliente[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const filtradas = oportunidades.filter(o => o.nombre.toLowerCase().includes(busqueda.toLowerCase()) || o.codigo.toLowerCase().includes(busqueda.toLowerCase()))
  const porEtapa = (etapa: EtapaOportunidad) => filtradas.filter(o => o.etapa_actual === etapa)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return setFormError('El nombre es requerido')
    setSaving(true); setFormError('')
    const { error } = await supabase.from('oportunidades').insert({
      codigo: genCodigo(), nombre: form.nombre.trim(), cliente_id: form.cliente_id || null,
      vendedor_id: profile?.id || null, tipo_venta: form.tipo_venta,
      monto_estimado: form.monto_estimado ? Number(form.monto_estimado) : null,
      probabilidad: Number(form.probabilidad), etapa_actual: form.etapa_actual,
      fecha_cierre_est: form.fecha_cierre_est || null, descripcion: form.descripcion || null,
    })
    if (error) { setFormError(error.message); setSaving(false); return }
    setShowForm(false); setForm(FORM_INIT); setSaving(false); await load()
  }

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <div><h1 className="text-lg font-bold text-gray-800">Oportunidades</h1><p className="text-xs text-gray-500">{filtradas.length} en curso</p></div>
        <div className="flex-1 max-w-xs ml-4 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
        </div>
        <button onClick={() => setShowForm(true)} className="ml-auto flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg" style={{background:'#ed3224'}}>
          <Plus size={16} /> Nueva
        </button>
      </div>

      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-3 h-full" style={{minWidth: ETAPAS.length * 220 + 'px'}}>
          {ETAPAS.map(etapa => {
            const cards = porEtapa(etapa)
            return (
              <div key={etapa} className="flex-shrink-0 w-52 flex flex-col">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-600 truncate">{etapa}</span>
                  <span className="ml-auto text-xs bg-gray-200 text-gray-600 rounded-full px-2 py-0.5">{cards.length}</span>
                </div>
                <div className="flex-1 space-y-2 overflow-y-auto min-h-20">
                  {cards.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center text-xs text-gray-400">Sin oportunidades</div>
                  ) : cards.map(opp => (
                    <div key={opp.id} onClick={() => setSelected(opp)}
                      className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer">
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <span className="text-xs text-gray-400 font-mono">{opp.codigo}</span>
                        <span className={'text-xs px-1.5 py-0.5 rounded-full font-medium ' + TIPO_COLOR[opp.tipo_venta]}>{opp.tipo_venta}</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 leading-tight mb-1">{opp.nombre}</p>
                      {opp.cliente && <p className="text-xs text-gray-500 truncate">{opp.cliente.razon_social}</p>}
                      {opp.monto_estimado != null && <p className="text-xs font-medium mt-2" style={{color:'#ed3224'}}>{'$' + opp.monto_estimado.toLocaleString('es-CL')}</p>}
                      <div className="mt-2 bg-gray-100 rounded-full h-1.5"><div className="h-1.5 rounded-full bg-green-400" style={{width:(opp.probabilidad??0)+'%'}} /></div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-base font-bold text-gray-800">Nueva Oportunidad</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f=>({...f,nombre:e.target.value}))} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
                <select value={form.cliente_id} onChange={e => setForm(f=>({...f,cliente_id:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                  <option value="">Sin cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={form.tipo_venta} onChange={e => setForm(f=>({...f,tipo_venta:e.target.value as TipoVenta}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                    <option>Proyecto</option><option>Producto</option><option>Kit</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Etapa inicial</label>
                  <select value={form.etapa_actual} onChange={e => setForm(f=>({...f,etapa_actual:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300">
                    {ETAPAS.map(e=><option key={e} value={e}>{e}</option>)}
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Monto (CLP)</label>
                  <input type="number" value={form.monto_estimado} onChange={e => setForm(f=>({...f,monto_estimado:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" /></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Cierre est.</label>
                  <input type="date" value={form.fecha_cierre_est} onChange={e => setForm(f=>({...f,fecha_cierre_est:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Probabilidad: {form.probabilidad}%</label>
                <input type="range" min="0" max="100" step="5" value={form.probabilidad} onChange={e => setForm(f=>({...f,probabilidad:e.target.value}))} className="w-full" /></div>
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Descripcion</label>
                <textarea value={form.descripcion} onChange={e => setForm(f=>({...f,descripcion:e.target.value}))} rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none" /></div>
              {formError && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60" style={{background:'#ed3224'}}>{saving ? 'Guardando...' : 'Crear'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && <OportunidadDrawer oportunidad={selected} onClose={() => setSelected(null)} onUpdate={() => { setSelected(null); load() }} />}
    </div>
  )
}
