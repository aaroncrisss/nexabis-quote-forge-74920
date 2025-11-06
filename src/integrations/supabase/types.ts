export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string | null
          direccion: string | null
          email: string
          empresa: string | null
          id: string
          nombre: string
          telefono: string | null
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          created_at?: string | null
          direccion?: string | null
          email: string
          empresa?: string | null
          id?: string
          nombre: string
          telefono?: string | null
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          created_at?: string | null
          direccion?: string | null
          email?: string
          empresa?: string | null
          id?: string
          nombre?: string
          telefono?: string | null
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clientes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items_presupuesto: {
        Row: {
          cantidad: number
          created_at: string | null
          descripcion: string
          id: string
          orden: number
          precio_unitario: number
          presupuesto_id: string
          total: number
        }
        Insert: {
          cantidad?: number
          created_at?: string | null
          descripcion: string
          id?: string
          orden?: number
          precio_unitario: number
          presupuesto_id: string
          total: number
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          descripcion?: string
          id?: string
          orden?: number
          precio_unitario?: number
          presupuesto_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_presupuesto_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones: {
        Row: {
          created_at: string | null
          id: string
          mensaje: string
          presupuesto_id: string | null
          tipo: string
          usuario_id: string
          visto: boolean | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          mensaje: string
          presupuesto_id?: string | null
          tipo: string
          usuario_id: string
          visto?: boolean | null
        }
        Update: {
          created_at?: string | null
          id?: string
          mensaje?: string
          presupuesto_id?: string | null
          tipo?: string
          usuario_id?: string
          visto?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificaciones_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos: {
        Row: {
          cliente_id: string
          codigo_auto: string | null
          comentarios_cliente: string | null
          created_at: string | null
          descuento_tipo: string | null
          descuento_total: number | null
          descuento_valor: number | null
          estado: string
          fecha: string
          fecha_vencimiento: string | null
          forma_pago: string | null
          id: string
          iva_monto: number | null
          iva_porcentaje: number | null
          modo_impresion: string | null
          moneda: string
          numero: string
          promocion_aplicada: string | null
          subtotal: number
          terminos: string | null
          titulo: string
          token: string
          total: number
          updated_at: string | null
          usuario_id: string
          validez_dias: number
        }
        Insert: {
          cliente_id: string
          codigo_auto?: string | null
          comentarios_cliente?: string | null
          created_at?: string | null
          descuento_tipo?: string | null
          descuento_total?: number | null
          descuento_valor?: number | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          forma_pago?: string | null
          id?: string
          iva_monto?: number | null
          iva_porcentaje?: number | null
          modo_impresion?: string | null
          moneda?: string
          numero: string
          promocion_aplicada?: string | null
          subtotal?: number
          terminos?: string | null
          titulo: string
          token?: string
          total?: number
          updated_at?: string | null
          usuario_id: string
          validez_dias?: number
        }
        Update: {
          cliente_id?: string
          codigo_auto?: string | null
          comentarios_cliente?: string | null
          created_at?: string | null
          descuento_tipo?: string | null
          descuento_total?: number | null
          descuento_valor?: number | null
          estado?: string
          fecha?: string
          fecha_vencimiento?: string | null
          forma_pago?: string | null
          id?: string
          iva_monto?: number | null
          iva_porcentaje?: number | null
          modo_impresion?: string | null
          moneda?: string
          numero?: string
          promocion_aplicada?: string | null
          subtotal?: number
          terminos?: string | null
          titulo?: string
          token?: string
          total?: number
          updated_at?: string | null
          usuario_id?: string
          validez_dias?: number
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuestos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          activo: boolean | null
          created_at: string | null
          direccion: string | null
          email: string
          id: string
          logo_url: string | null
          moneda_predeterminada: string | null
          nombre: string
          nombre_empresa: string | null
          plantilla_tyc: string | null
          rut: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          direccion?: string | null
          email: string
          id: string
          logo_url?: string | null
          moneda_predeterminada?: string | null
          nombre: string
          nombre_empresa?: string | null
          plantilla_tyc?: string | null
          rut?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          direccion?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          moneda_predeterminada?: string | null
          nombre?: string
          nombre_empresa?: string | null
          plantilla_tyc?: string | null
          rut?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promociones: {
        Row: {
          activa: boolean | null
          created_at: string | null
          descripcion: string | null
          descuento_porcentaje: number
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          monto_minimo: number
          nombre: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          descuento_porcentaje: number
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_minimo: number
          nombre: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          descuento_porcentaje?: number
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          monto_minimo?: number
          nombre?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios_permitidos: {
        Row: {
          activo: boolean | null
          created_at: string | null
          email: string
          fecha_invitacion: string | null
          id: string
          invitado_por: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          email: string
          fecha_invitacion?: string | null
          id?: string
          invitado_por?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          email?: string
          fecha_invitacion?: string | null
          id?: string
          invitado_por?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      email_permitido: { Args: { email_check: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "usuario"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "usuario"],
    },
  },
} as const
