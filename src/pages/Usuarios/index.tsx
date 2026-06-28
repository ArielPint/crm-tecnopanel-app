import { useEffect, useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Profile { id:string;nombre:string;apellido:string;email:string;rol:string;activo:boolean }
const RC:Record<string,string> = { admin:'bg-red-100 text-red-700',gerente_general:'bg-purple-100 text-purple-700',gerente_ventas:'bg-blue-100 text-blue-700',vendedor:'bg-sky-100 text-sky-700',jefe_ingenieria:'bg-amber-100 text-amber-700',ingeniero:'bg-yellow-100 text-yellow-700',cubicador:'bg-emerald-100 text-emerald-700',presupuestista:'bg-teal-100 text-teal-700',finanzas:'bg-indigo-100 text-indigo-700' }

export default function Usuarios() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { supabase.from('profiles').select('*').order('nombre').then(({ data }) => { setProfiles((data as Profile[])||[]); setLoading(false) }) }, [])
  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-brand-red border-t-transparent rounded-full animate-spin"/></div>
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-gray-200 bg-white"><h1 className="text-lg font-bold text-gray-800">Usuarios</h1><p className="text-xs text-gray-500">{profiles.length} usuarios</p></div>
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full">
            <thead><tr className="border-b border-gray-100 bg-gray-50"><th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Usuario</th><th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Email</th><th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Rol</th><th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Estado</th></tr></thead>
            <tbody>
              {profiles.map((p,i) => (
                <tr key={p.id} className={`border-b border-gray-50 hover:bg-gray-50 ${i%2===0?'bg-white':'bg-gray-50/30'}`}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-brand-red flex items-center justify-center text-white text-xs font-bold">{p.nombre[0]}{p.apellido[0]}</div><p className="text-sm font-medium text-gray-800">{p.nombre} {p.apellido}</p></div></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{p.email}</td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${RC[p.rol]||'bg-gray-100 text-gray-600'}`}>{p.rol.replace(/_/g,' ')}</span></td>
                  <td className="px-4 py-3">{p.activo?<span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle size={13}/>Activo</span>:<span className="flex items-center gap-1 text-xs text-red-500"><XCircle size={13}/>Inactivo</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
