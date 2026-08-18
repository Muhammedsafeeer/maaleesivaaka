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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          value: string
          label: string
          malayalam_label: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          value: string
          label: string
          malayalam_label?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          value?: string
          label?: string
          malayalam_label?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ad_media: {
        Row: {
          ad_id: string
          created_at: string
          id: string
          media_type: string
          media_url: string
          position: number
        }
        Insert: {
          ad_id: string
          created_at?: string
          id?: string
          media_type: string
          media_url: string
          position: number
        }
        Update: {
          ad_id?: string
          created_at?: string
          id?: string
          media_type?: string
          media_url?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "ad_media_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "ads"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          created_at: string
          id: string
          name: string
          play_duration_seconds: number
          position: number
          transition_duration_ms: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          play_duration_seconds?: number
          position: number
          transition_duration_ms?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          play_duration_seconds?: number
          position?: number
          transition_duration_ms?: number
          updated_at?: string
        }
        Relationships: []
      }
      certificate_settings: {
        Row: {
          created_at: string
          id: number
          seal_url: string | null
          signatory_name: string
          signature_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          seal_url?: string | null
          signatory_name?: string
          signature_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          seal_url?: string | null
          signatory_name?: string
          signature_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      judge_scores: {
        Row: {
          criteria_scores: Json
          id: string
          judge_id: string
          program_id: string
          score: number
          student_id: string
          submitted_at: string
          updated_at: string
        }
        Insert: {
          criteria_scores?: Json
          id?: string
          judge_id: string
          program_id: string
          score: number
          student_id: string
          submitted_at?: string
          updated_at?: string
        }
        Update: {
          criteria_scores?: Json
          id?: string
          judge_id?: string
          program_id?: string
          score?: number
          student_id?: string
          submitted_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "judge_scores_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "judge_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      main_groups: {
        Row: {
          created_at: string
          id: string
          malayalam_name: string | null
          name: string
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          malayalam_name?: string | null
          name: string
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          malayalam_name?: string | null
          name?: string
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      poster_settings: {
        Row: {
          background_url: string | null
          created_at: string
          fields: Json
          id: number
          updated_at: string
        }
        Insert: {
          background_url?: string | null
          created_at?: string
          fields?: Json
          id?: number
          updated_at?: string
        }
        Update: {
          background_url?: string | null
          created_at?: string
          fields?: Json
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      program_judges: {
        Row: {
          created_at: string
          id: string
          judge_id: string
          program_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          judge_id: string
          program_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          judge_id?: string
          program_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_judges_judge_id_fkey"
            columns: ["judge_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_judges_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_students: {
        Row: {
          created_at: string
          id: string
          program_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          program_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          program_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_students_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          category: Database["public"]["Enums"]["participant_category"]
          created_at: string
          id: string
          malayalam_name: string | null
          name: string
          serial_number: number | null
          stage_type: Database["public"]["Enums"]["stage_type"]
          status: Database["public"]["Enums"]["program_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["participant_category"]
          created_at?: string
          id?: string
          malayalam_name?: string | null
          name: string
          serial_number?: number | null
          stage_type: Database["public"]["Enums"]["stage_type"]
          status?: Database["public"]["Enums"]["program_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["participant_category"]
          created_at?: string
          id?: string
          malayalam_name?: string | null
          name?: string
          serial_number?: number | null
          stage_type?: Database["public"]["Enums"]["stage_type"]
          status?: Database["public"]["Enums"]["program_status"]
          updated_at?: string
        }
        Relationships: []
      }
      results: {
        Row: {
          average_score: number
          created_at: string
          criteria_averages: Json
          id: string
          points: number
          position: number
          program_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          average_score: number
          created_at?: string
          criteria_averages?: Json
          id?: string
          points?: number
          position: number
          program_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          average_score?: number
          created_at?: string
          criteria_averages?: Json
          id?: string
          points?: number
          position?: number
          program_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "results_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      score_settings: {
        Row: {
          created_at: string
          first_place_points: number
          id: number
          second_place_points: number
          third_place_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_place_points?: number
          id?: number
          second_place_points?: number
          third_place_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_place_points?: number
          id?: number
          second_place_points?: number
          third_place_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      scoring_criteria: {
        Row: {
          created_at: string
          id: string
          name: string
          program_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          program_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          program_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scoring_criteria_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          category: Database["public"]["Enums"]["participant_category"]
          class: string
          created_at: string
          gender: Database["public"]["Enums"]["gender"]
          group_id: string
          id: string
          malayalam_name: string | null
          name: string
          photo_url: string | null
          roll_number: string
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["participant_category"]
          class: string
          created_at?: string
          gender: Database["public"]["Enums"]["gender"]
          group_id: string
          id?: string
          malayalam_name?: string | null
          name: string
          photo_url?: string | null
          roll_number: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["participant_category"]
          class?: string
          created_at?: string
          gender?: Database["public"]["Enums"]["gender"]
          group_id?: string
          id?: string
          malayalam_name?: string | null
          name?: string
          photo_url?: string | null
          roll_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "group_leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "main_groups"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      group_leaderboard: {
        Row: {
          id: string | null
          name: string | null
          photo_url: string | null
          rank: number | null
          total_points: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      finalize_program_results: {
        Args: { p_program_id: string; p_results: Json }
        Returns: undefined
      }
      get_program_scores: {
        Args: { p_program_id: string }
        Returns: {
          criteria_scores: Json
          score: number
          student_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_judge_assigned_to_program: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      is_program_fully_scored: {
        Args: { p_program_id: string }
        Returns: boolean
      }
      is_program_published: { Args: { p_program_id: string }; Returns: boolean }
      is_student_assigned_to_program: {
        Args: { p_program_id: string; p_student_id: string }
        Returns: boolean
      }
      reorder_ads: { Args: { p_ids: string[] }; Returns: undefined }
      search_student_results: {
        Args: { p_query: string }
        Returns: {
          points: number
          program_category: Database["public"]["Enums"]["participant_category"]
          program_name: string
          result_position: number
          student_id: string
          student_name: string
          updated_at: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      gender: "male" | "female"
      participant_category:
        | "kids"
        | "sub_junior"
        | "junior"
        | "senior"
        | "super_senior"
        | "general"
      program_status:
        | "draft"
        | "upcoming"
        | "scoring"
        | "completed"
        | "published"
      stage_type: "on_stage" | "off_stage"
      user_role: "admin" | "judge"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      gender: ["male", "female"],
      participant_category: [
        "kids",
        "sub_junior",
        "junior",
        "senior",
        "super_senior",
        "general",
      ],
      program_status: [
        "draft",
        "upcoming",
        "scoring",
        "completed",
        "published",
      ],
      stage_type: ["on_stage", "off_stage"],
      user_role: ["admin", "judge"],
    },
  },
} as const
