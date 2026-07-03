import { useEffect, useState, useRef } from 'react'
import { X, ChevronRight, Upload, Link2, FileText, Clock, User, Loader2, Trash2, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Oportunidad, Profile, OportunidadHistorialEtapa, OportunidadDocumento } from '@/types/database'

const ETAPAS_ORDER = [
  'Clasificación','Ingeniería','Desarrollo','Costos y Presupuestos',
  'Revisión Vendedor','Negociación',
]

const ETAPAS_LABELS: Record<string,string> = {
  'Clasificación': 'Clasificación',
  'Ingeniería': 'Ingeniería',
  'Desarrollo': 'Desarrollo',
  'Costos y Presupuestos': 'Costos y Presupuestos',
  'Revisión Vendedor': 'Revisión Vendedor',
  'Negociación': 'Negociación',
}

const TIPO_COLOR: Record<string, string> = {
  Proyecto: 'bg-purple-100 text-purple-700',
  Producto: 'bg-blue-100 text-blue-700',
  Kit: 'bg-amber-100 text-amber-700',
}

const TIPO_VENTA_LABELS: Record<string, string> = {
  Proyecto: 'Proyecto',
  Producto: 'Venta Directa',
  Kit: 'Viviendas Industrializadas',
}

const STAGE_ROLES: Record<string, string[]> = {
  'Clasificación': ['admin','gerente_ventas','vendedor'],
  'Ingeniería': ['admin','jefe_ingenieria','ingeniero'],
  'Desarrollo': ['admin','jefe_ingenieria','desarrollador'],
  'Costos y Presupuestos': ['admin','cubicador','presupuestista'],
  'Revisión Vendedor': ['admin','gerente_ventas','vendedor'],
  'Negociación': ['admin','gerente_ventas','vendedor','finanzas'],
}

function formatCLP(n: number) { return '$' + n.toLocaleString('es-CL') }
function formatMM(n: number) { return (n / 1_000_000).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' MM' }
function diffDias(from: string) {
  return Math.floor((new Date().getTime() - new Date(from).getTime()) / 86400000)
}
function getFileIcon(ext: string | null) {
  if (!ext) return '📄'
  const e = ext.toLowerCase()
  if (e === 'pdf') return '📕'
  if (['doc','docx'].includes(e)) return '📘'
  if (['xls','xlsx'].includes(e)) return '📗'
  if (e === 'dwg') return '📐'
  if (['jpg','jpeg','png','gif','webp'].includes(e)) return '🖼️'
  return '📄'
}

interface Props {
  oportunidad: Oportunidad
  onClose: () => void
  onUpdate: () => void
}

type Tab = 'general' | 'etapa' | 'docs' | 'historial'

export default function OportunidadDrawer({ oportunidad, onClose, onUpdate }: Props) {
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('general')
  const [opp, setOpp] = useState<Oportunidad>(oportunidad)
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [asignadoId, setAsignadoId] = useState<string>('')
  const [etapaData, setEtapaData] = useState<Record<string, string>>({})
  const [docs, setDocs] = useState<OportunidadDocumento[]>([])
  const [historial, setHistorial] = useState<OportunidadHistorialEtapa[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const [linkNombre, setLinkNombre] = useState('')
  const [showLink, setShowLink] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setOpp(oportunidad); setTab('general'); loadAll() }, [oportunidad.id])

  async function loadAll() {
    setLoading(true)
    const [asigRes, etapaRes, docsRes, histRes, usersRes] = await Promise.all([
      supabase.from('oportunidad_asignaciones').select('*').eq('oportunidad_id', oportunidad.id).eq('etapa', oportunidad.etapa_actual).maybeSingle(),
      supabase.from('oportunidad_datos_etapa').select('*').eq('oportunidad_id', oportunidad.id).eq('etapa', oportunidad.etapa_actual).maybeSingle(),
      supabase.from('oportunidad_documentos').select('*').eq('oportunidad_id', oportunidad.id).order('created_at', { ascending: false }),
      supabase.from('oportunidad_historial_etapas').select('*,usuario:profiles(nombre,apellido)').eq('oportunidad_id', oportunidad.id).order('fecha_entrada', { ascending: false }),
      supabase.from('profiles').select('*').eq('activo', true).order('nombre'),
    ])
    setAsignadoId((asigRes.data as {usuario_id?:string}|null)?.usuario_id ?? '')
    setEtapaData(((etapaRes.data as {datos?:Record<string,string>}|null)?.datos) ?? {})
    setDocs((docsRes.data as OportunidadDocumento[]) ?? [])
    setHistorial((histRes.data as OportunidadHistorialEtapa[]) ?? [])
    setUsuarios((usersRes.data as Profile[]) ?? [])
    setLoading(false)
  }

  async function saveGeneral() {
    setSaving(true)
    await supabase.from('oportunidades').update({
      nombre: opp.nombre, monto_estimado: opp.monto_estimado,
      probabilidad: opp.probabilidad, fecha_cierre_est: opp.fecha_cierre_est,
      descripcion: opp.descripcion, tipo_venta: opp.tipo_venta,
    }).eq('id', opp.id)
    setSaving(false); onUpdate()
  }

  async function saveEtapaData() {
    setSaving(true)
    await supabase.from('oportunidad_datos_etapa').upsert({
      oportunidad_id: opp.id, etapa: opp.etapa_actual,
      datos: etapaData, updated_by: profile?.id, updated_at: new Date().toISOString(),
    }, { onConflict: 'oportunidad_id,etapa' })
    setSaving(false)
  }

  async function saveAsignacion(userId: string) {
    setAsignadoId(userId)
    if (!userId) {
      await supabase.from('oportunidad_asignaciones').delete().eq('oportunidad_id', opp.id).eq('etapa', opp.etapa_actual)
    } else {
      await supabase.from('oportunidad_asignaciones').upsert({
        oportunidad_id: opp.id, etapa: opp.etapa_actual,
        usuario_id: userId, asignado_por: profile?.id,
      }, { onConflict: 'oportunidad_id,etapa' })
      await supabase.from('notifications').insert({
        user_id: userId,
        tipo: 'asignacion',
        titulo: `Te asignaron: ${opp.nombre}`,
        mensaje: `${opp.codigo} · etapa ${opp.etapa_actual}`,
        oportunidad_id: opp.id,
      })
    }
  }

  async function avanzarEtapa() {
    const idx = ETAPAS_ORDER.indexOf(opp.etapa_actual)
    const newEtapa = idx >= 0 && idx < ETAPAS_ORDER.length - 1 ? ETAPAS_ORDER[idx + 1] : 'Ganado'
    setSaving(true)
    const { data: cur } = await supabase.from('oportunidad_historial_etapas').select('id').eq('oportunidad_id', opp.id).eq('etapa', opp.etapa_actual).is('fecha_salida', null).maybeSingle()
    if (cur) await supabase.from('oportunidad_historial_etapas').update({ fecha_salida: new Date().toISOString(), usuario_id: profile?.id }).eq('id', (cur as {id:string}).id)
    await supabase.from('oportunidades').update({ etapa_actual: newEtapa, updated_at: new Date().toISOString() }).eq('id', opp.id)
    await supabase.from('oportunidad_historial_etapas').insert({ oportunidad_id: opp.id, etapa: newEtapa, fecha_entrada: new Date().toISOString(), usuario_id: profile?.id })
    await supabase.from('notifications').insert({
      user_id: profile?.id,
      tipo: 'etapa_cambio',
      titulo: `${opp.nombre} avanzó a ${newEtapa}`,
      mensaje: `${opp.codigo} · de ${opp.etapa_actual} a ${newEtapa}`,
      oportunidad_id: opp.id,
    })
    setSaving(false); onUpdate(); onClose()
  }

  async function retrocederEtapa() {
    const idx = ETAPAS_ORDER.indexOf(opp.etapa_actual)
    if (idx <= 0) return
    const newEtapa = ETAPAS_ORDER[idx - 1]
    setSaving(true)
    const { data: cur } = await supabase.from('oportunidad_historial_etapas').select('id').eq('oportunidad_id', opp.id).eq('etapa', opp.etapa_actual).is('fecha_salida', null).maybeSingle()
    if (cur) await supabase.from('oportunidad_historial_etapas').update({ fecha_salida: new Date().toISOString(), usuario_id: profile?.id }).eq('id', (cur as {id:string}).id)
    await supabase.from('oportunidades').update({ etapa_actual: newEtapa, updated_at: new Date().toISOString() }).eq('id', opp.id)
    await supabase.from('oportunidad_historial_etapas').insert({ oportunidad_id: opp.id, etapa: newEtapa, fecha_entrada: new Date().toISOString(), usuario_id: profile?.id })
    await supabase.from('notifications').insert({
      user_id: profile?.id,
      tipo: 'etapa_cambio',
      titulo: `${opp.nombre} retrocedió a ${newEtapa}`,
      mensaje: `${opp.codigo} · de ${opp.etapa_actual} a ${newEtapa}`,
      oportunidad_id: opp.id,
    })
    setSaving(false); onUpdate(); onClose()
  }

  async function marcarEstado(estado: 'Ganado' | 'Perdido') {
    setSaving(true)
    const { data: cur } = await supabase.from('oportunidad_historial_etapas').select('id').eq('oportunidad_id', opp.id).eq('etapa', opp.etapa_actual).is('fecha_salida', null).maybeSingle()
    if (cur) await supabase.from('oportunidad_historial_etapas').update({ fecha_salida: new Date().toISOString(), usuario_id: profile?.id }).eq('id', (cur as {id:string}).id)
    await supabase.from('oportunidades').update({ etapa_actual: estado, updated_at: new Date().toISOString() }).eq('id', opp.id)
    await supabase.from('oportunidad_historial_etapas').insert({ oportunidad_id: opp.id, etapa: estado, fecha_entrada: new Date().toISOString(), usuario_id: profile?.id })
    await supabase.from('notifications').insert({
      user_id: profile?.id,
      tipo: 'estado_final',
      titulo: `${opp.nombre} marcada como ${estado}`,
      mensaje: `${opp.codigo} · ${estado === 'Ganado' ? '✓ cerrada con éxito' : '✗ perdida'}`,
      oportunidad_id: opp.id,
    })
    setSaving(false); onUpdate(); onClose()
  }

  async function uploadFile(file: File) {
    setUploading(true)
    const ext = file.name.split('.').pop() ?? ''
    const path = opp.id + '/' + Date.now() + '-' + file.name
    const { error: upErr } = await supabase.storage.from('oportunidades').upload(path, file)
    if (!upErr) {
      await supabase.from('oportunidad_documentos').insert({
        oportunidad_id: opp.id, nombre: file.name, tipo: 'archivo',
        url: path, extension: ext, tamanio_bytes: file.size,
        subido_por: profile?.id, etapa: opp.etapa_actual,
      })
      await loadAll()
    }
    setUploading(false)
  }

  function isSafeUrl(url: string): boolean {
    try {
      const { protocol } = new URL(url)
      return protocol === 'https:' || protocol === 'http:'
    } catch { return false }
  }

  async function addLink() {
    if (!linkUrl.trim()) return
    if (!isSafeUrl(linkUrl.trim())) {
      alert('Solo se permiten URLs http o https.')
      return
    }
    await supabase.from('oportunidad_documentos').insert({
      oportunidad_id: opp.id, nombre: linkNombre.trim() || linkUrl.trim(),
      tipo: 'link', url: linkUrl.trim(), subido_por: profile?.id, etapa: opp.etapa_actual,
    })
    setLinkUrl(''); setLinkNombre(''); setShowLink(false); await loadAll()
  }

  async function deleteDoc(id: string, tipo: string, url: string) {
    if (tipo === 'archivo') await supabase.storage.from('oportunidades').remove([url])
    await supabase.from('oportunidad_documentos').delete().eq('id', id)
    await loadAll()
  }

  async function openFile(tipo: string, url: string) {
    if (tipo === 'link') {
      if (!isSafeUrl(url)) return
      window.open(url, '_blank', 'noopener,noreferrer')
      return
    }
    const { data } = await supabase.storage.from('oportunidades').createSignedUrl(url, 3600)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  const etapas = ETAPAS_ORDER
  const currentIdx = etapas.indexOf(opp.etapa_actual)
  const isTerminal = ['Ganado','Perdido'].includes(opp.etapa_actual)
  const nextEtapa = currentIdx >= 0 && currentIdx < etapas.length - 1 ? etapas[currentIdx + 1] : 'Ganado'
  const allowedRoles = STAGE_ROLES[opp.etapa_actual] ?? []
  const filteredUsers = usuarios.filter(u => allowedRoles.includes(u.rol))
  // Mismo control de rol para Avanzar y Retroceder: ambas son acciones de gestión de la etapa actual.
  const canManageStage = !profile?.rol || allowedRoles.length === 0 || allowedRoles.includes(profile.rol)
  const canGoBack = currentIdx > 0 && !isTerminal

  function renderEtapaForm() {
    const e = opp.etapa_actual
    const field = (key: string, label: string, type = 'text', placeholder = '') => (
      <div key={key}>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <input type={type} value={etapaData[key] ?? ''} onChange={ev => setEtapaData(d => ({...d,[key]:ev.target.value}))} placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" />
      </div>
    )
    const ta = (key: string, label: string, placeholder = '') => (
      <div key={key}>
        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
        <textarea value={etapaData[key] ?? ''} onChange={ev => setEtapaData(d => ({...d,[key]:ev.target.value}))} rows={3} placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none" />
      </div>
    )
    if (e === 'Clasificación') return <div className="space-y-3">{ta('notas','Notas de clasificacion','Descripcion general, alcance...')}{field('origen_lead','Origen del lead','text','Referido, web, visita...')}{field('contacto_previo','Contacto previo','text','Si / No / Descripcion')}</div>
    if (e === 'Ingeniería') return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">{field('superficie_total','Superficie total (m²)','number','0')}{field('altura_libre','Altura libre (m)','number','0')}</div>
        <div className="grid grid-cols-2 gap-3">{field('largo','Largo (m)','number','0')}{field('ancho','Ancho (m)','number','0')}</div>
        {ta('descripcion_estructura','Descripcion de estructura','Tipo de estructura, caracteristicas, uso previsto...')}
        <div className="grid grid-cols-3 gap-3">{field('carga_viento','Viento (km/h)','number','0')}{field('carga_nieve','Nieve (kg/m²)','number','0')}{field('zona_sismica','Zona sismica','text','Z1, Z2...')}</div>
        {ta('observaciones_tecnicas','Observaciones tecnicas','Notas de ingenieria, restricciones...')}
      </div>
    )
    if (e === 'Desarrollo') return (
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de documento entregado</label>
          <select value={etapaData['tipo_documento'] ?? ''} onChange={ev => setEtapaData(d => ({...d,tipo_documento:ev.target.value}))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
            <option value="">Seleccionar...</option>
            <option value="Plano">Plano</option>
            <option value="Ficha">Ficha</option>
          </select>
        </div>
        {ta('notas_desarrollo','Notas','Observaciones sobre la entrega. El archivo se sube en la pestaña Docs.')}
      </div>
    )
    if (e === 'Costos y Presupuestos') return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cubicación</p>
        {field('acero_kg','Acero estructural (kg)','number','0')}{field('paneles_m2','Paneles (m²)','number','0')}{field('cubierta_m2','Cubierta (m²)','number','0')}{field('pilares_und','Pilares (und)','number','0')}{ta('lista_materiales','Materiales adicionales','Otros componentes...')}{ta('observaciones','Observaciones cubicación','')}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Presupuesto</p>
        {field('costo_materiales','Costo materiales (CLP)','number','0')}{field('costo_mano_obra','Mano de obra (CLP)','number','0')}{field('costo_transporte','Transporte (CLP)','number','0')}{field('margen_porcentaje','Margen (%)','number','0')}{field('precio_final','Precio final (CLP)','number','0')}{ta('notas_presupuesto','Notas','Condiciones, exclusiones...')}
      </div>
    )
    if (e === 'Revisión Vendedor') return <div className="space-y-3">{field('descuento_porcentaje','Descuento (%)','number','0')}{field('plazo_entrega_dias','Plazo entrega (dias)','number','0')}{ta('condiciones_comerciales','Condiciones comerciales','Formas de pago, garantias...')}{ta('notas_revision','Notas del vendedor','')}</div>
    if (e === 'Negociación') return (
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Revisión del cliente</p>
        {ta('feedback_cliente','Feedback del cliente','Observaciones, cambios solicitados...')}{field('modificaciones_solicitadas','Modificaciones','text','Resumen de cambios')}{ta('acuerdos','Acuerdos alcanzados','')}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Evaluación crediticia</p>
        {field('limite_credito','Limite de credito (CLP)','number','0')}{field('plazo_pago_dias','Plazo de pago (dias)','number','0')}{field('resultado','Resultado','text','Aprobado / Rechazado')}{ta('condiciones_credito','Condiciones','Garantias, avales...')}{ta('observaciones_finanzas','Observaciones','')}
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide pt-2">Cierre</p>
        {ta('motivo_perdida','Motivo de pérdida (si aplica)','Solo relevante si la oportunidad se marca como Perdido')}
      </div>
    )
    return <p className="text-sm text-gray-400 text-center py-6">Sin campos para esta etapa</p>
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-2xl bg-white flex flex-col shadow-2xl h-full overflow-hidden">

        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono text-gray-400">{opp.codigo}</span>
                <span className={['text-xs px-2 py-0.5 rounded-full font-medium', TIPO_COLOR[opp.tipo_venta] ?? 'bg-gray-100 text-gray-600'].join(' ')}>{TIPO_VENTA_LABELS[opp.tipo_venta] ?? opp.tipo_venta}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-50 text-red-600 border border-red-100">{opp.etapa_actual}</span>
              </div>
              <h2 className="text-base font-bold text-gray-800 leading-tight">{opp.nombre}</h2>
              {opp.cliente && <p className="text-xs text-gray-500 mt-0.5">{opp.cliente.razon_social}</p>}
              {opp.monto_estimado != null && (
                <p className="text-sm font-bold mt-1" style={{color:'#ed3224'}}>
                  {formatCLP(opp.monto_estimado)}
                  <span className="block text-[11px] font-normal text-gray-400">{formatMM(opp.monto_estimado)}</span>
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 flex-shrink-0"><X size={18} /></button>
          </div>
          {!isTerminal && currentIdx >= 0 && (
            <div className="mt-3 flex items-center gap-1">
              {etapas.map((e, i) => (
                <div key={e} className="flex-1 h-1.5 rounded-full" style={{background: i <= currentIdx ? '#ed3224' : '#e5e7eb'}} title={e} />
              ))}
            </div>
          )}
          {isTerminal && (
            <div className={['mt-2 text-xs font-medium px-2 py-1 rounded-full inline-block', opp.etapa_actual === 'Ganado' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'].join(' ')}>
              {opp.etapa_actual === 'Ganado' ? '✓ Oportunidad ganada' : '✗ Oportunidad perdida'}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          {([['general','General'],['etapa', isTerminal ? 'Datos' : opp.etapa_actual],['docs','Docs ('+docs.length+')'],['historial','Historial']] as [Tab,string][]).map(([k,label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={['flex-1 text-xs font-medium py-2.5 border-b-2 transition-colors truncate px-1', tab===k ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'].join(' ')}>
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 size={20} className="animate-spin text-gray-400" /></div>
          ) : tab === 'general' ? (
            <div className="space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
                <input value={opp.nombre} onChange={e => setOpp(o => ({...o,nombre:e.target.value}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tipo venta</label>
                  <select value={opp.tipo_venta} onChange={e => setOpp(o => ({...o,tipo_venta:e.target.value as 'Proyecto'|'Producto'|'Kit'}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
                    <option value="Proyecto">{TIPO_VENTA_LABELS.Proyecto}</option>
                    <option value="Producto">{TIPO_VENTA_LABELS.Producto}</option>
                    <option value="Kit">{TIPO_VENTA_LABELS.Kit}</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Cierre estimado</label>
                  <input type="date" value={opp.fecha_cierre_est ?? ''} onChange={e => setOpp(o => ({...o,fecha_cierre_est:e.target.value||null}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Monto estimado (CLP)</label>
                  <input type="number" value={opp.monto_estimado ?? ''} onChange={e => setOpp(o => ({...o,monto_estimado:e.target.value ? Number(e.target.value) : null}))} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Probabilidad: {opp.probabilidad}%</label>
                  <input type="range" min="0" max="100" step="5" value={opp.probabilidad} onChange={e => setOpp(o => ({...o,probabilidad:Number(e.target.value)}))} className="w-full mt-2" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
                <textarea value={opp.descripcion ?? ''} onChange={e => setOpp(o => ({...o,descripcion:e.target.value||null}))} rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none" /></div>
              {opp.etapa_actual !== 'Clasificación' && (
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Asignado a (etapa actual)</label>
                  <select value={asignadoId} onChange={e => saveAsignacion(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red">
                    <option value="">Sin asignar</option>
                    {filteredUsers.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rol.replace(/_/g,' ')})</option>)}
                  </select></div>
              )}
              <button onClick={saveGeneral} disabled={saving} className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2" style={{background:'#ed3224'}}>
                {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </div>
          ) : tab === 'etapa' ? (
            <div className="space-y-4">
              {renderEtapaForm()}
              <button onClick={saveEtapaData} disabled={saving} className="w-full py-2 text-white rounded-lg text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2" style={{background:'#ed3224'}}>
                {saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Guardando...' : 'Guardar datos de etapa'}
              </button>
            </div>
          ) : tab === 'docs' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}{uploading ? 'Subiendo...' : 'Subir archivo'}
                </button>
                <button onClick={() => setShowLink(s => !s)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50">
                  <Link2 size={12} /> Agregar link
                </button>
                <input ref={fileRef} type="file" className="hidden" onChange={e => { if(e.target.files?.[0]) uploadFile(e.target.files[0]) }} />
              </div>
              {showLink && (
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <input value={linkNombre} onChange={e => setLinkNombre(e.target.value)} placeholder="Nombre (opcional)" className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
                  <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="URL https://..." className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs" />
                  <div className="flex gap-2">
                    <button onClick={addLink} className="px-3 py-1 text-xs text-white rounded" style={{background:'#ed3224'}}>Agregar</button>
                    <button onClick={() => {setShowLink(false);setLinkUrl('');setLinkNombre('')}} className="px-3 py-1 text-xs text-gray-500 border border-gray-200 rounded">Cancelar</button>
                  </div>
                </div>
              )}
              {docs.length === 0 ? (
                <div className="text-center py-8 text-gray-400"><FileText size={32} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Sin documentos</p></div>
              ) : docs.map(d => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <span className="text-lg">{d.tipo === 'link' ? '🔗' : getFileIcon(d.extension)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{d.nombre}</p>
                    <p className="text-xs text-gray-400">{d.etapa ?? 'General'}{d.tamanio_bytes ? ' · ' + (d.tamanio_bytes/1024).toFixed(0) + ' KB' : ''}</p>
                  </div>
                  <button onClick={() => openFile(d.tipo, d.url)} className="text-gray-400 hover:text-blue-500 p-1"><ExternalLink size={13} /></button>
                  <button onClick={() => deleteDoc(d.id, d.tipo, d.url)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {historial.length === 0 ? <p className="text-center text-sm text-gray-400 py-8">Sin historial</p>
              : historial.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                    {i < historial.length-1 && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <p className="text-xs font-medium text-gray-700">{h.etapa}</p>
                    <p className="text-xs text-gray-400">{new Date(h.fecha_entrada).toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'})}{h.fecha_salida && ' → ' + new Date(h.fecha_salida).toLocaleDateString('es-CL',{day:'2-digit',month:'short'}) + ' (' + diffDias(h.fecha_entrada) + 'd)'}</p>
                    {h.usuario && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><User size={10} />{(h.usuario as Profile).nombre} {(h.usuario as Profile).apellido}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isTerminal && (
          <div className="p-4 border-t border-gray-200 flex-shrink-0 flex gap-2">
            {canGoBack && (
              <button onClick={retrocederEtapa} disabled={saving || !canManageStage} title={!canManageStage ? 'Tu rol no gestiona esta etapa' : undefined}
                className="px-3 py-2 flex items-center justify-center gap-1 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight size={14} className="rotate-180" />
                Retroceder
              </button>
            )}
            <button onClick={avanzarEtapa} disabled={saving || !canManageStage} title={!canManageStage ? 'Tu rol no gestiona esta etapa' : undefined}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-60" style={{background:'#ed3224'}}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={14} />}
              {saving ? 'Avanzando...' : 'Avanzar a ' + nextEtapa}
            </button>
            <button onClick={() => marcarEstado('Ganado')} disabled={saving} className="px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60">Ganado</button>
            <button onClick={() => marcarEstado('Perdido')} disabled={saving} className="px-3 py-2 text-xs font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-60">Perdido</button>
          </div>
        )}
      </div>
    </div>
  )
}
