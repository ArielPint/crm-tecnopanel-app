import { useState, useEffect } from 'react'
import { Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { TipoVenta } from '@/types/database'

interface Cliente { id: string; razon_social: string }
interface FormData {
  nombre: string; cliente_id: string; tipo_venta: TipoVenta;
  monto_estimado: string; probabilidad: string; etapa_actual: string;
  fecha_cierre_est: string; descripcion: string;
}
const INIT: FormData = { nombre:'', cliente_id:'', tipo_venta:'Proyecto', monto_estimado:'', probabilidad:'50', etapa_actual:'Clasificación', fecha_cierre_est:'', descripcion:'' }
const ETAPAS = ['Clasificación','Ingeniería','Cubicación','Presupuestos','Revisión Vendedor','Revisión Cliente','Evaluación Crediticia']
function genCodigo() { const d=new Date(); return 'OPP-'+d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+'-'+(crypto.getRandomValues(new Uint16Array(1))[0]%9000+1000) }

interface Props { isOpen: boolean; onClose: () => void; onSuccess: () => void }

export default function NuevaOportunidadModal({ isOpen, onClose, onSuccess }: Props) {
  const { profile } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [form, setForm] = useState<FormData>(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isOpen) return
    setForm(INIT); setError('')
    supabase.from('clientes').select('id,razon_social').order('razon_social')
      .then(({ data }) => setClientes((data as Cliente[]) ?? []))
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return setError('El nombre es requerido')
    setSaving(true); setError('')
    const codigo = genCodigo()
    const { data, error: err } = await supabase.from('oportunidades').insert({
      codigo, nombre: form.nombre.trim(), cliente_id: form.cliente_id || null,
      vendedor_id: profile?.id ?? null, tipo_venta: form.tipo_venta,
      monto_estimado: form.monto_estimado ? Number(form.monto_estimado) : null,
      probabilidad: Number(form.probabilidad), etapa_actual: form.etapa_actual,
      fecha_cierre_est: form.fecha_cierre_est || null, descripcion: form.descripcion || null,
    }).select('id').single()
    if (err) { setError(err.message); setSaving(false); return }
    await supabase.from('notifications').insert({
      user_id: profile?.id,
      tipo: 'oportunidad_nueva',
      titulo: `Nueva oportunidad: ${form.nombre.trim()}`,
      mensaje: `${codigo} · etapa inicial: ${form.etapa_actual}`,
      oportunidad_id: (data as { id: string })?.id ?? null,
    })
    setSaving(false); onSuccess(); onClose()
  }

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-800">Nueva Oportunidad</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
            <input value={form.nombre} onChange={e => setForm(f=>({...f,nombre:e.target.value}))} required
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Cliente</label>
            <select value={form.cliente_id} onChange={e => setForm(f=>({...f,cliente_id:e.target.value}))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
              <option value="">Sin cliente</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select value={form.tipo_venta} onChange={e => setForm(f=>({...f,tipo_venta:e.target.value as TipoVenta}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
                <option>Proyecto</option><option>Producto</option><option>Kit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Etapa inicial</label>
              <select value={form.etapa_actual} onChange={e => setForm(f=>({...f,etapa_actual:e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
                {ETAPAS.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Monto estimado (CLP)</label>
              <input type="number" value={form.monto_estimado} onChange={e => setForm(f=>({...f,monto_estimado:e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cierre estimado</label>
              <input type="date" value={form.fecha_cierre_est} onChange={e => setForm(f=>({...f,fecha_cierre_est:e.target.value}))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Probabilidad: {form.probabilidad}%</label>
            <input type="range" min="0" max="100" step="5" value={form.probabilidad}
              onChange={e => setForm(f=>({...f,probabilidad:e.target.value}))} className="w-full" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={e => setForm(f=>({...f,descripcion:e.target.value}))} rows={2}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none" />
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2"
              style={{background:'#ed3224'}}>
              {saving && <Loader2 size={14} className="animate-spin"/>}
              {saving ? 'Guardando...' : 'Crear oportunidad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
