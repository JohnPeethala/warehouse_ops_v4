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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cfg_geo_zones: {
        Row: {
          area: string | null
          city: string | null
          id: string
          lat: number | null
          lng: number | null
          pincode: string | null
          zone: string | null
        }
        Insert: {
          area?: string | null
          city?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          pincode?: string | null
          zone?: string | null
        }
        Update: {
          area?: string | null
          city?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          pincode?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      cfg_lookups: {
        Row: {
          created_at: string | null
          domain: Database["public"]["Enums"]["lookup_domain"]
          id: string
          is_active: boolean | null
          is_terminal: boolean | null
          order_idx: number | null
          status: string
          status_color: string | null
          sub_status: string | null
          sub_status_color: string | null
        }
        Insert: {
          created_at?: string | null
          domain: Database["public"]["Enums"]["lookup_domain"]
          id?: string
          is_active?: boolean | null
          is_terminal?: boolean | null
          order_idx?: number | null
          status: string
          status_color?: string | null
          sub_status?: string | null
          sub_status_color?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: Database["public"]["Enums"]["lookup_domain"]
          id?: string
          is_active?: boolean | null
          is_terminal?: boolean | null
          order_idx?: number | null
          status?: string
          status_color?: string | null
          sub_status?: string | null
          sub_status_color?: string | null
        }
        Relationships: []
      }
      cfg_ticket_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon_name: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_category_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_category_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cfg_ticket_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "cfg_ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      core_profiles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login_at: string | null
          name: string
          phone: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name: string
          phone?: string | null
          role: Database["public"]["Enums"]["profile_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login_at?: string | null
          name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["profile_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      core_vehicles: {
        Row: {
          created_at: string | null
          driver_name: string | null
          driver_phone: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          vehicle_no: string
        }
        Insert: {
          created_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          vehicle_no: string
        }
        Update: {
          created_at?: string | null
          driver_name?: string | null
          driver_phone?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          vehicle_no?: string
        }
        Relationships: []
      }
      daily_schedule_snapshot: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          snapshot_date: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          snapshot_date: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          snapshot_date?: string
        }
        Relationships: []
      }
      fact_dispatch_lifecycle: {
        Row: {
          completed_at: string | null
          dispatch_log_id: string
          gt1_id: string | null
          gt2_id: string | null
          scheduled_date: string
          status: string | null
          sub_status: string | null
          ticket_id: string
        }
        Insert: {
          completed_at?: string | null
          dispatch_log_id: string
          gt1_id?: string | null
          gt2_id?: string | null
          scheduled_date: string
          status?: string | null
          sub_status?: string | null
          ticket_id: string
        }
        Update: {
          completed_at?: string | null
          dispatch_log_id?: string
          gt1_id?: string | null
          gt2_id?: string | null
          scheduled_date?: string
          status?: string | null
          sub_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fact_dispatch_lifecycle_dispatch_log_id_fkey"
            columns: ["dispatch_log_id"]
            isOneToOne: true
            referencedRelation: "latest_dispatch_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fact_dispatch_lifecycle_dispatch_log_id_fkey"
            columns: ["dispatch_log_id"]
            isOneToOne: true
            referencedRelation: "ops_dispatch_log"
            referencedColumns: ["id"]
          },
        ]
      }
      log_audit_trail: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
          table_name: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          table_name: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_audit_trail_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      log_ticket_lifecycle: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          new_status: string | null
          old_status: string | null
          ticket_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "log_ticket_lifecycle_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_dispatch_log: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          gt_map: string | null
          gt_trip_id: string | null
          id: string
          location: string | null
          notes: string | null
          pincode: string | null
          remarks: string | null
          route: string | null
          scheduled_date: string
          status: string | null
          sub_category: string | null
          sub_status: string | null
          ticket_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          gt_map?: string | null
          gt_trip_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          pincode?: string | null
          remarks?: string | null
          route?: string | null
          scheduled_date: string
          status?: string | null
          sub_category?: string | null
          sub_status?: string | null
          ticket_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          gt_map?: string | null
          gt_trip_id?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          pincode?: string | null
          remarks?: string | null
          route?: string | null
          scheduled_date?: string
          status?: string | null
          sub_category?: string | null
          sub_status?: string | null
          ticket_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_dispatch_log_gt_trip_id_fkey"
            columns: ["gt_trip_id"]
            isOneToOne: false
            referencedRelation: "daily_route_summary"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "ops_dispatch_log_gt_trip_id_fkey"
            columns: ["gt_trip_id"]
            isOneToOne: false
            referencedRelation: "ops_route_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_dispatch_log_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_gt_master: {
        Row: {
          created_at: string | null
          gt_name: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          gt_name: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          gt_name?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      ops_gt_roster: {
        Row: {
          attendance: string | null
          created_at: string | null
          date: string
          delivery_count: number | null
          duty: string | null
          gt_id: string | null
          id: string
          last_dispatched_at: string | null
        }
        Insert: {
          attendance?: string | null
          created_at?: string | null
          date: string
          delivery_count?: number | null
          duty?: string | null
          gt_id?: string | null
          id?: string
          last_dispatched_at?: string | null
        }
        Update: {
          attendance?: string | null
          created_at?: string | null
          date?: string
          delivery_count?: number | null
          duty?: string | null
          gt_id?: string | null
          id?: string
          last_dispatched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_gt_roster_gt_id_fkey"
            columns: ["gt_id"]
            isOneToOne: false
            referencedRelation: "ops_gt_master"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_manifest_batches: {
        Row: {
          created_at: string | null
          id: string
          ticket_count: number | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ticket_count?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ticket_count?: number | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_manifest_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_route_sessions: {
        Row: {
          created_at: string | null
          done_tickets: number | null
          ending_km: number | null
          gt1_id: string | null
          gt2_id: string | null
          adhoc_gt1: string | null
          adhoc_gt2: string | null
          adhoc_vehicle: string | null
          id: string
          nd_veh_drvr_tickets: number | null
          not_done_tickets: number | null
          pending_tickets: number | null
          starting_km: number | null
          total_km: number | null
          total_tickets: number | null
          trip_date: string
          updated_at: string | null
          updated_by: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          done_tickets?: number | null
          ending_km?: number | null
          gt1_id?: string | null
          gt2_id?: string | null
          adhoc_gt1?: string | null
          adhoc_gt2?: string | null
            adhoc_vehicle?: string | null
            id?: string
          not_done_tickets?: number | null
          pending_tickets?: number | null
          starting_km?: number | null
          total_km?: number | null
          total_tickets?: number | null
          trip_date: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          done_tickets?: number | null
          ending_km?: number | null
          gt1_id?: string | null
          gt2_id?: string | null
          adhoc_gt1?: string | null
          adhoc_gt2?: string | null
            adhoc_vehicle?: string | null
            id?: string
          not_done_tickets?: number | null
          pending_tickets?: number | null
          starting_km?: number | null
          total_km?: number | null
          total_tickets?: number | null
          trip_date?: string
          updated_at?: string | null
          updated_by?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_route_sessions_gt1_id_fkey"
            columns: ["gt1_id"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_route_sessions_gt2_id_fkey"
            columns: ["gt2_id"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_route_sessions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_route_sessions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "core_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_staged_tickets: {
        Row: {
          address1: string | null
          batch_id: string | null
          category: string | null
          contact_name: string | null
          date: string
          id: string
          phone: string | null
          raw_tags: string | null
          sub_category: string | null
          ticket_age: number | null
          ticket_id: string
        }
        Insert: {
          address1?: string | null
          batch_id?: string | null
          category?: string | null
          contact_name?: string | null
          date: string
          id?: string
          phone?: string | null
          raw_tags?: string | null
          sub_category?: string | null
          ticket_age?: number | null
          ticket_id: string
        }
        Update: {
          address1?: string | null
          batch_id?: string | null
          category?: string | null
          contact_name?: string | null
          date?: string
          id?: string
          phone?: string | null
          raw_tags?: string | null
          sub_category?: string | null
          ticket_age?: number | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ops_staged_tickets_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "ops_manifest_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      ops_ticket_annotations: {
        Row: {
          id: string
          location: string | null
          notes: string | null
          pincode: string | null
          priority_tag: string | null
          staged_ticket_id: string | null
          ticket_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          location?: string | null
          notes?: string | null
          pincode?: string | null
          priority_tag?: string | null
          staged_ticket_id?: string | null
          ticket_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          location?: string | null
          notes?: string | null
          pincode?: string | null
          priority_tag?: string | null
          staged_ticket_id?: string | null
          ticket_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_ticket_annotations_staged_ticket_id_fkey"
            columns: ["staged_ticket_id"]
            isOneToOne: false
            referencedRelation: "ops_staged_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_ticket_annotations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_route_summary: {
        Row: {
          completed_tickets: number | null
          driver_name: string | null
          route_id: string | null
          total_tickets: number | null
          trip_date: string | null
          vehicle_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_route_sessions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "core_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fact_crew_daily_stats: {
        Row: {
          date: string | null
          profile_id: string | null
          success_rate: number | null
          total_assigned: number | null
          total_done: number | null
        }
        Relationships: []
      }
      latest_dispatch_logs: {
        Row: {
          created_at: string | null
          gt_trip_id: string | null
          id: string | null
          remarks: string | null
          scheduled_date: string | null
          status: string | null
          sub_status: string | null
          ticket_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ops_dispatch_log_gt_trip_id_fkey"
            columns: ["gt_trip_id"]
            isOneToOne: false
            referencedRelation: "daily_route_summary"
            referencedColumns: ["route_id"]
          },
          {
            foreignKeyName: "ops_dispatch_log_gt_trip_id_fkey"
            columns: ["gt_trip_id"]
            isOneToOne: false
            referencedRelation: "ops_route_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ops_dispatch_log_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "core_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      recalculate_session_counters: {
        Args: { session_id: string }
        Returns: undefined
      }
    }
    Enums: {
      lookup_domain: "TICKET" | "kra_status"
      profile_role:
        | "admin"
        | "supervisor"
        | "ground"
        | "technician"
        | "carpenter"
        | "viewer"
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
      lookup_domain: ["TICKET", "kra_status"],
      profile_role: [
        "admin",
        "supervisor",
        "ground",
        "technician",
        "carpenter",
        "viewer",
      ],
    },
  },
} as const
