import { useEffect, useState } from 'react'
import { Plus, X, Building2, Phone, Mail, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface Cliente { id:string;razon_social:string;rut:string|null;rubro:string|null;ciudad:string|null;contacto_nombre:string|null;contacto_email:string|null;contacto_fono:string|null;es_nuevo:boolean }
interface FormData { razon_social:string;rut:string;rubro:string;ciudad:string;region:string;contacto_nombre:string;contacto_email:string;contacto_fono:string }
const INIT:FormData = { razon_social:'',rut:'',rubro:'',ciudad:'',region:'',contacto_nombre:'',contacto_email:'',contacto_fono:'' }

export default function Clientes() {
  const { profile } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormData>(INIT)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  async function load() {
    const { data } = await supabase.from('clientes').select('*').order('razon_social')
    setClientes((data as Cliente[]) || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])
  const filtrados = clientes.filter(c => c.razon_social.toLowerCase().includes(busqueda.toLowerCase()) || (c.ciudad||'').toLowerCase().includes(busqueda.toLowerCase()))
  function cerrar() { setShowForm(false); setForm(INIT); setError('') }
  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault()
    if (!form.razon_social.trim()) return setError('La razon social es requerida')
    setSaving(true); setError('')
    const { error:err } = await supabase.from('clientes').insert({ razon_social:form.razon_social.trim(),rut:form.rut||null,rubro:form.rubro||null,ciudad:form.ciudad||null,region:form.region||null,contacto_nombre:form.contacto_nombre||null,contacto_email:form.contacto_email||null,contacto_fono:form.contacto_fono||null,creado_por:profile?.id||null,es_nuevo:true })
    if (err) { setError(err.message); setSaving(false); return }
    cerrar(); setSaving(false); await load()
  }
  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin" /></div>
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white flex items-center gap-4">
        <div><h1 className="text-lg font-bold text-gray-800">Clientes</h1><p className="text-xs text-gray-500">{filtrados.length} registros</p></div>
        <input value={busqueda} onChange={e=>setBusqueda(e.target.value)} placeholder="Buscar..." className="ml-4 px-3 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:outline-none focus:ring-2 focus:ring-red-400" />
        <button onClick={()=>setShowForm(true)} className="ml-auto flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg" style={{background:'#ed3224'}}><Plus size={16} /> Nuevo cliente</button>
      </div>
      <div className="flex-1 overflow-auto p-6">
        {filtrados.length===0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <Building2 size={40} className="mb-3 opacity-30" />
            <p className="text-sm">No hay clientes registrados</p>
            <button onClick={()=>setShowForm(true)} className="mt-3 text-sm text-red-500 hover:underline">Agregar el primero</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtrados.map(c => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center"><Building2 size={16} style={{color:'#ed3224'}} /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{c.razon_social}</p>{c.rut&&<p className="text-xs text-gray-400">{c.rut}</p>}</div>
                  {c.es_nuevo&&<span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Nuevo</span>}
                </div>
                <div className="space-y-1 text-xs text-gray-500">
                  {c.rubro&&<p>{c.rubro}</p>}
                  {c.ciudad&&<div className="flex items-center gap-1"><MapPin size={11}/> {c.ciudad}</div>}
                  {c.contacto_nombre&&<p className="font-medium text-gray-600 mt-2">{c.contacto_nombre}</p>}
                  {c.contacto_email&&<div className="flex items-center gap-1"><Mail size={11}/> {c.contacto_email}</div>}
                  {c.contacto_fono&&<div className="flex items-center gap-1"><Phone size={11}/> {c.contacto_fono}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {showForm&&(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-base font-bold text-gray-800">Nuevo Cliente</h2>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div><label className="block text-xs font-medium text-gray-700 mb-1">Razon social *</label><input value={form.razon_social} onChange={e=>setForm(f=>({...f,razon_social:e.target.value}))} placeholder="Empresa Ltda." required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-700 mb-1">RUT</label><input value={form.rut} onChange={e=>setForm(f=>({...f,rut:e.target.value}))} placeholder="12.345.678-9" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Rubro</label><input value={form.rubro} onChange={e=>setForm(f=>({...f,rubro:e.target.value}))} placeholder="Construccion..." className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Ciudad</label><input value={form.ciudad} onChange={e=>setForm(f=>({...f,ciudad:e.target.value}))} placeholder="Santiago" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
                <div><label className="block text-xs font-medium text-gray-700 mb-1">Region</label><input value={form.region} onChange={e=>setForm(f=>({...f,region:e.target.value}))} placeholder="Metropolitana" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
              </div>
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contacto principal</p>
                <div className="space-y-3">
                  <div><label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label><input value={form.contacto_nombre} onChange={e=>setForm(f=>({...f,contacto_nombre:e.target.value}))} placeholder="Juan Perez" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Email</label><input type="email" value={form.contacto_email} onChange={e=>setForm(f=>({...f,contacto_email:e.target.value}))} placeholder="juan@empresa.cl" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
                    <div><label className="block text-xs font-medium text-gray-700 mb-1">Telefono</label><input value={form.contacto_fono} onChange={e=>setForm(f=>({...f,contacto_fono:e.target.value}))} placeholder="+56 9 1234 5678" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-300"/></div>
                  </div>
                </div>
              </div>
              {error&&<p className="text-xs text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={cerrar} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60" style={{background:'#ed3224'}}>{saving?'Guardando...':'Crear cliente'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
