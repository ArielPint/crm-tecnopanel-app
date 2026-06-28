export type RolUsuario =
  | 'admin' | 'gerente_ventas' | 'gerente_general' | 'vendedor'
  | 'jefe_ingenieria' | 'ingeniero' | 'cubicador' | 'presupuestista' | 'finanzas'

export type TipoVenta = 'Proyecto' | 'Producto' | 'Kit'

export type EtapaOportunidad = string

export type EstadoTarea = 'pendiente' | 'en_progreso' | 'completada' | 'rechazada'
export type ResultadoCredito = 'aprobado' | 'rechazado' | 'observado' | 'pendiente'

export interface Profile {
  id: string
  nombre: string
  apellido: string
  email: string
  rol: RolUsuario
  activo: boolean
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  razon_social: string
  rut: string | null
  tipo: 'empresa' | 'persona_natural'
  rubro: string | null
  ciudad: string | null
  contacto_nombre: string | null
  contacto_email: string | null
  contacto_fono: string | null
  es_nuevo: boolean
  created_at: string
}

export interface Oportunidad {
  id: string
  codigo: string
  nombre: string
  cliente_id: string | null
  tipo_venta: TipoVenta
  etapa_actual: EtapaOportunidad
  requiere_ingenieria: boolean
  probabilidad: number
  monto_estimado: number | null
  monto_final: number | null
  moneda: string
  vendedor_id: string | null
  fecha_cierre_est: string | null
  descripcion: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  vendedor?: Profile
}

export interface TareaIngenieria {
  id: string
  oportunidad_id: string
  titulo: string
  descripcion: string | null
  asignado_a: string | null
  estado: EstadoTarea
  prioridad: number
  fecha_limite: string | null
  created_at: string
  asignado?: Profile
}

export type Database = {
  public: {
    Tables: {
      profiles:              { Row: Profile }
      clientes:              { Row: Cliente }
      oportunidades:         { Row: Oportunidad }
      tareas_ingenieria:     { Row: TareaIngenieria }
    }
    Enums: {
      rol_usuario:       RolUsuario
      tipo_venta:        TipoVenta
      etapa_oportunidad: EtapaOportunidad
      estado_tarea:      EstadoTarea
    }
  }
}
