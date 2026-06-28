import { useEffect, useState } from 'react'
import { Clock, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Oportunidad } from '@/types/database'
import OportunidadDrawer from '@/components/OportunidadDrawer'

const TC:Record<string,string>={Proyecto:'bg-purple-100 text-purple-700',Producto:'bg-blue-100 text-blue-700',Kit:'bg-amber-100 text-amber-700'}
interface OE extends Oportunidad{asignado?:{nombre:string;apellido:string}|null;dias?:number}

export default function Cubicacion(){
  const [opps,setOpps]=useState<OE[]>([])
  const [loading,setLoading]=useState(true)
  const [sel,setSel]=useState<Oportunidad|null>(null)
  async function load(){
    const {data}=await supabase.from('oportunidades').select('*,cliente:clientes(razon_social),vendedor:profiles(nombre,apellido)').eq('etapa_actual','Cubicación').order('updated_at',{ascending:false})
    const base=(data as Oportunidad[])||[]
    if(!base.length){setOpps([]);setLoading(false);return}
    const ids=base.map(o=>o.id)
    const [{data:asigs},{data:hist}]=await Promise.all([
      supabase.from('oportunidad_asignaciones').select('oportunidad_id,usuario:profiles(nombre,apellido)').in('oportunidad_id',ids).eq('etapa','Cubicación'),
      supabase.from('oportunidad_historial_etapas').select('oportunidad_id,fecha_entrada').in('oportunidad_id',ids).eq('etapa','Cubicación').is('fecha_salida',null),
    ])
    const am:Record<string,{nombre:string;apellido:string}>={};const dm:Record<string,number>={}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(asigs||[]).forEach((a:any)=>{const u=Array.isArray(a.usuario)?a.usuario[0]:a.usuario;if(u)am[a.oportunidad_id]=u})
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(hist||[]).forEach((h:any)=>{dm[h.oportunidad_id]=Math.floor((Date.now()-new Date(h.fecha_entrada).getTime())/86400000)})
    setOpps(base.map(o=>({...o,asignado:am[o.id]??null,dias:dm[o.id]??0})));setLoading(false)
  }
  useEffect(()=>{load()},[])
  if(loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"/></div>
  return(
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white"><h1 className="text-lg font-bold text-gray-800">Cubicación</h1><p className="text-xs text-gray-500">{opps.length} oportunidades</p></div>
      <div className="flex-1 overflow-auto p-6">
        {opps.length===0?(<div className="flex flex-col items-center justify-center h-64 text-gray-400"><div className="text-5xl mb-3 opacity-20">📦</div><p className="text-sm">Sin oportunidades</p></div>):(
          <div className="space-y-3 max-w-3xl">{opps.map(o=>(
            <div key={o.id} onClick={()=>setSel(o)} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-red-200 transition-all cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs text-gray-400 font-mono">{o.codigo}</span><span className={'text-xs px-1.5 py-0.5 rounded-full font-medium '+(TC[o.tipo_venta]??'bg-gray-100 text-gray-600')}>{o.tipo_venta}</span></div>
                  <p className="text-sm font-semibold text-gray-800">{o.nombre}</p>
                  {o.cliente&&<p className="text-xs text-gray-500 mt-0.5">{(o.cliente as {razon_social:string}).razon_social}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  {o.monto_estimado!=null&&<p className="text-sm font-bold" style={{color:'#ed3224'}}>{'$'+o.monto_estimado.toLocaleString('es-CL')}</p>}
                  <p className="text-xs text-gray-400 mt-0.5">{o.probabilidad??0}%</p>
                  {o.dias!==undefined&&<div className="flex items-center justify-end gap-1 mt-1"><Clock size={10} className="text-gray-400"/><span className="text-xs text-gray-400">{o.dias}d</span></div>}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                {o.vendedor&&<p className="text-xs text-gray-400">Vendedor: {(o.vendedor as {nombre:string;apellido:string}).nombre} {(o.vendedor as {nombre:string;apellido:string}).apellido}</p>}
                {o.asignado&&<p className="text-xs text-blue-500 font-medium flex items-center gap-1"><User size={10}/>{o.asignado.nombre} {o.asignado.apellido}</p>}
              </div>
            </div>
          ))}</div>
        )}
      </div>
      {sel&&<OportunidadDrawer oportunidad={sel} onClose={()=>setSel(null)} onUpdate={()=>{setSel(null);load()}}/>}
    </div>
  )
}
