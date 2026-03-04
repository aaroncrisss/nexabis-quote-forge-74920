// CRM Types for Nexabis

export interface Pago {
    id: string;
    usuario_id: string;
    cliente_id: string;
    presupuesto_id?: string | null;
    factura_id?: string | null;
    monto: number;
    moneda: string;
    metodo_pago: string;
    referencia?: string | null;
    mp_payment_id?: string | null;
    estado: string;
    fecha_pago: string;
    notas?: string | null;
    created_at: string;
    updated_at: string;
    clientes?: { nombre: string; empresa: string | null } | null;
}

export interface Factura {
    id: string;
    usuario_id: string;
    cliente_id: string;
    presupuesto_id?: string | null;
    numero: string;
    titulo: string;
    subtotal: number;
    iva_porcentaje: number;
    iva_monto: number;
    total: number;
    moneda: string;
    estado: string;
    fecha_emision: string;
    fecha_vencimiento?: string | null;
    notas?: string | null;
    created_at: string;
    updated_at: string;
    clientes?: { nombre: string; empresa: string | null } | null;
}

export interface ItemFactura {
    id: string;
    factura_id: string;
    descripcion: string;
    cantidad: number;
    precio_unitario: number;
    total: number;
    orden: number;
}

export interface PipelineEtapa {
    id: string;
    usuario_id: string;
    nombre: string;
    color: string;
    orden: number;
}

export interface Oportunidad {
    id: string;
    usuario_id: string;
    cliente_id: string;
    etapa_id: string;
    titulo: string;
    valor: number;
    moneda: string;
    probabilidad: number;
    fecha_cierre_esperada?: string | null;
    notas?: string | null;
    estado: string;
    created_at: string;
    updated_at: string;
    clientes?: { nombre: string; empresa: string | null } | null;
}

export interface Tarea {
    id: string;
    usuario_id: string;
    cliente_id?: string | null;
    oportunidad_id?: string | null;
    proyecto_id?: string | null;
    titulo: string;
    descripcion?: string | null;
    tipo: string;
    prioridad: string;
    estado: string;
    fecha_vencimiento?: string | null;
    fecha_completada?: string | null;
    created_at: string;
    updated_at: string;
    clientes?: { nombre: string; empresa: string | null } | null;
}

export interface NotaCliente {
    id: string;
    usuario_id: string;
    cliente_id: string;
    contenido: string;
    tipo: string;
    created_at: string;
}

export interface Documento {
    id: string;
    usuario_id: string;
    cliente_id: string;
    nombre: string;
    url: string;
    tipo_mime?: string | null;
    tamano_bytes?: number | null;
    created_at: string;
}

export interface Etiqueta {
    id: string;
    usuario_id: string;
    nombre: string;
    color: string;
    created_at: string;
}

export interface Contrato {
    id: string;
    usuario_id: string;
    cliente_id: string;
    titulo: string;
    descripcion?: string | null;
    valor?: number | null;
    moneda: string;
    estado: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    renovacion_auto: boolean;
    created_at: string;
    updated_at: string;
    clientes?: { nombre: string; empresa: string | null } | null;
}

export interface ClienteCRM {
    id: string;
    usuario_id: string;
    nombre: string;
    email: string;
    telefono?: string | null;
    empresa?: string | null;
    rut?: string | null;
    direccion?: string | null;
    industria?: string | null;
    fuente?: string | null;
    etapa_ciclo?: string | null;
    avatar_url?: string | null;
    notas?: string | null;
    sitio_web?: string | null;
    valor_total?: number | null;
    created_at: string;
    updated_at: string;
}
