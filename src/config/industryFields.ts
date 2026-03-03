export interface FieldConfig {
    id: string;
    label: string;
    type: 'text' | 'number';
    placeholder?: string;
    required?: boolean;
}

export interface IndustryConfig {
    extraFields: FieldConfig[];
    labels?: {
        tipoProyecto?: string;
        costoBase?: string;
        descripcion?: string;
        funcionalidades?: string;
    };
}

export const INDUSTRY_FIELDS: Record<string, IndustryConfig> = {
    tecnologia: {
        labels: {
            tipoProyecto: "Tipo de Proyecto (Ej: Web, App, MVP)",
            costoBase: "Costo Base Unitario (Hora programador)",
            descripcion: "Descripción Arquitectural / Requerimientos",
        },
        extraFields: [
            {
                id: "costos_servicios",
                label: "Costo de APIS / Servidores (Mensual / Único)",
                type: "number",
                placeholder: "Ej: 50000",
            },
        ]
    },
    construccion: {
        labels: {
            tipoProyecto: "Tipo de Obra (Ej: Construcción, Remodelación)",
            costoBase: "Costo Mano de Obra (Jornada/Hora)",
            descripcion: "Descripción de la Obra y Especificaciones",
            funcionalidades: "Partidas / Etapas Específicas",
        },
        extraFields: [
            {
                id: "costo_materiales",
                label: "Presupuesto o Costo de Materiales Estimado ($)",
                type: "number",
                placeholder: "Ej: 1500000",
                required: true,
            },
            {
                id: "metros_cuadrados",
                label: "Metros Cuadrados Aprox. (m²)",
                type: "number",
                placeholder: "Ej: 120",
            },
        ]
    },
    energia: {
        labels: {
            tipoProyecto: "Tipo de Servicio (Ej: Mantención, Instalación)",
            descripcion: "Descripción de la Falla o Requerimiento",
        },
        extraFields: [
            {
                id: "costo_equipos",
                label: "Costo de Equipos o Repuestos Principales ($)",
                type: "number",
                placeholder: "Ej: 350000",
                required: true,
            },
            {
                id: "distancia_traslado",
                label: "Distancia de Traslado (Km)",
                type: "number",
                placeholder: "Ej: 45",
            },
        ]
    },
    consultoria: {
        labels: {
            tipoProyecto: "Tipo de Asesoría / Especialidad",
            costoBase: "Tarifa Base Consultor (Hora)",
            descripcion: "Objetivos de la Consultoría y Entregables",
        },
        extraFields: [
            {
                id: "cantidad_sesiones",
                label: "Cantidad Total de Sesiones / Reuniones",
                type: "number",
                placeholder: "Ej: 4",
                required: true,
            },
            {
                id: "costo_por_sesion",
                label: "Costo o tarifa por Sesión ($)",
                type: "number",
                placeholder: "Ej: 50000",
                required: true,
            },
        ]
    },
    eventos: {
        labels: {
            tipoProyecto: "Tipo de Evento (Matrimonio, Corporativo)",
            descripcion: "Cronograma general y necesidades clave",
        },
        extraFields: [
            {
                id: "cantidad_asistentes",
                label: "Cantidad Aprox. de Asistentes",
                type: "number",
                placeholder: "Ej: 150",
            },
            {
                id: "costo_arriendo_banquetera",
                label: "Costos Fijos (Arriendos, Banquetera, etc) ($)",
                type: "number",
                placeholder: "Ej: 800000",
            },
        ]
    },
    salud: {
        labels: {
            tipoProyecto: "Servicio Médico / Tratamiento",
            descripcion: "Diagnóstico inicial o situación clínica",
        },
        extraFields: [
            {
                id: "cantidad_pacientes_mensual",
                label: "Flujo de Pacientes Mensual Estimado",
                type: "number",
                placeholder: "Ej: 300",
            },
            {
                id: "insumos_medicos",
                label: "Costo Fijo de Insumos Médicos / Tratamiento ($)",
                type: "number",
                placeholder: "Ej: 200000",
            }
        ]
    },
    audiovisual: {
        labels: {
            tipoProyecto: "Tipo de Producción (Spot, Documental)",
            descripcion: "Guión base, locaciones y requerimientos de cámara",
        },
        extraFields: [
            {
                id: "dias_rodaje",
                label: "Días de Rodaje / Grabación",
                type: "number",
                placeholder: "Ej: 3",
                required: true,
            },
            {
                id: "arriendo_equipos",
                label: "Costo Arriendo Equipos Externos / Viáticos ($)",
                type: "number",
                placeholder: "Ej: 150000",
            }
        ]
    },
    // Default de respaldo si un rubro no requiere extras
    default: {
        extraFields: []
    },
};
