import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

interface PermisoRow { modulo: string; rol: string; permitido: boolean }
interface PermisosContextValue {
  permisos: PermisoRow[]
  loading: boolean
  canAccess: (modulo: string, rol: string) => boolean
  togglePermiso: (modulo: string, rol: string, current: boolean) => Promise<void>
  refresh: () => Promise<void>
}

const PermisosContext = createContext<PermisosContextValue>({
  permisos: [], loading: true,
  canAccess: ()=>false,
  togglePermiso: async()=>{},
  refresh: async()=>{},
})

export function PermisosProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [permisos, setPermisos] = useState<PermisoRow[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('permisos_modulo').select('modulo,rol,permitido')
    setPermisos((data as PermisoRow[]) || [])
    setLoading(false)
  }

  useEffect(() => { if (user) load() }, [user])

  function canAccess(modulo: string, rol: string): boolean {
    const row = permisos.find(p => p.modulo === modulo && p.rol === rol)
    return row?.permitido ?? false
  }

  async function togglePermiso(modulo: string, rol: string, current: boolean) {
    // Optimistic update
    setPermisos(prev => prev.map(p =>
      p.modulo === modulo && p.rol === rol ? { ...p, permitido: !current } : p
    ))
    await supabase.from('permisos_modulo')
      .upsert({ modulo, rol, permitido: !current, updated_at: new Date().toISOString() }, { onConflict: 'modulo,rol' })
  }

  return (
    <PermisosContext.Provider value={{ permisos, loading, canAccess, togglePermiso, refresh: load }}>
      {children}
    </PermisosContext.Provider>
  )
}

export function usePermisos() { return useContext(PermisosContext) }
