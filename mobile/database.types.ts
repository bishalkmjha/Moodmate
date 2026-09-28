export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      workout_profiles: {
        Row: {
          user_id: string
          height_cm: number
          weight_kg: number
          sex: "male" | "female" | "other" | null
          birth_year: number | null
          self_reported_level: "beginner" | "intermediate" | "advanced"
          primary_goal:
            | "lose_weight"
            | "build_muscle"
            | "general_fitness"
            | "endurance"
            | "mobility"
          equipment: string[]
          injury_notes: string | null
          identity_statement: string | null
          wake_time: string | null
          fitness_tier: "foundation" | "building" | "progressing" | "advanced"
          onboarded_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          height_cm: number
          weight_kg: number
          sex?: "male" | "female" | "other" | null
          birth_year?: number | null
          self_reported_level?: "beginner" | "intermediate" | "advanced"
          primary_goal?:
            | "lose_weight"
            | "build_muscle"
            | "general_fitness"
            | "endurance"
            | "mobility"
          equipment?: string[]
          injury_notes?: string | null
          identity_statement?: string | null
          wake_time?: string | null
          fitness_tier?: "foundation" | "building" | "progressing" | "advanced"
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          height_cm?: number
          weight_kg?: number
          sex?: "male" | "female" | "other" | null
          birth_year?: number | null
          self_reported_level?: "beginner" | "intermediate" | "advanced"
          primary_goal?:
            | "lose_weight"
            | "build_muscle"
            | "general_fitness"
            | "endurance"
            | "mobility"
          equipment?: string[]
          injury_notes?: string | null
          identity_statement?: string | null
          wake_time?: string | null
          fitness_tier?: "foundation" | "building" | "progressing" | "advanced"
          onboarded_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          focus: "full_body" | "upper" | "lower" | "core" | "mobility" | "cardio"
          tier_at_time: string
          status: "planned" | "in_progress" | "completed" | "skipped"
          plan: Json
          overall_rpe: number | null
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date?: string
          focus?: "full_body" | "upper" | "lower" | "core" | "mobility" | "cardio"
          tier_at_time: string
          status?: "planned" | "in_progress" | "completed" | "skipped"
          plan?: Json
          overall_rpe?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_date?: string
          focus?: "full_body" | "upper" | "lower" | "core" | "mobility" | "cardio"
          tier_at_time?: string
          status?: "planned" | "in_progress" | "completed" | "skipped"
          plan?: Json
          overall_rpe?: number | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      session_exercise_logs: {
        Row: {
          id: string
          session_id: string
          user_id: string
          exercise_id: string
          order_index: number
          target_sets: number
          target_reps: number
          completed_sets: number | null
          completed_reps: number | null
          weight_kg: number | null
          rpe: number | null
          completed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          exercise_id: string
          order_index?: number
          target_sets?: number
          target_reps?: number
          completed_sets?: number | null
          completed_reps?: number | null
          weight_kg?: number | null
          rpe?: number | null
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          exercise_id?: string
          order_index?: number
          target_sets?: number
          target_reps?: number
          completed_sets?: number | null
          completed_reps?: number | null
          weight_kg?: number | null
          rpe?: number | null
          completed?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      habits: {
        Row: {
          id: string
          user_id: string
          title: string
          identity_statement: string | null
          cue: string | null
          craving: string | null
          response: string | null
          reward: string | null
          cue_time: string | null
          frequency: string[]
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          identity_statement?: string | null
          cue?: string | null
          craving?: string | null
          response?: string | null
          reward?: string | null
          cue_time?: string | null
          frequency?: string[]
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          identity_statement?: string | null
          cue?: string | null
          craving?: string | null
          response?: string | null
          reward?: string | null
          cue_time?: string | null
          frequency?: string[]
          active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      habit_logs: {
        Row: {
          id: string
          habit_id: string
          user_id: string
          log_date: string
          completed: boolean
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          habit_id: string
          user_id: string
          log_date?: string
          completed?: boolean
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          habit_id?: string
          user_id?: string
          log_date?: string
          completed?: boolean
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      morning_routine_logs: {
        Row: {
          id: string
          user_id: string
          log_date: string
          move_minutes: number
          reflect_minutes: number
          grow_minutes: number
          completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          log_date?: string
          move_minutes?: number
          reflect_minutes?: number
          grow_minutes?: number
          completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          log_date?: string
          move_minutes?: number
          reflect_minutes?: number
          grow_minutes?: number
          completed?: boolean
          created_at?: string
        }
        Relationships: []
      }
      mood_checkins: {
        Row: {
          id: string
          user_id: string | null
          created_at: string
          stress_level: number
          mode: "Quick" | "Daily" | "Detailed"
          notes: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          created_at?: string
          stress_level: number
          mode: "Quick" | "Daily" | "Detailed"
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          created_at?: string
          stress_level?: number
          mode?: "Quick" | "Daily" | "Detailed"
          notes?: string | null
        }
        Relationships: []
      }
      mood_tags: {
        Row: {
          id: number
          slug: string
          label: string
        }
        Insert: {
          id?: number
          slug: string
          label: string
        }
        Update: {
          id?: number
          slug?: string
          label?: string
        }
        Relationships: []
      }
      mood_checkin_tags: {
        Row: {
          checkin_id: string
          tag_id: number
        }
        Insert: {
          checkin_id: string
          tag_id: number
        }
        Update: {
          checkin_id?: string
          tag_id?: number
        }
        Relationships: []
      }
      reels: {
        Row: {
          id: string
          user_id: string
          video_path: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          video_path: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          video_path?: string
          caption?: string | null
          created_at?: string
        }
        Relationships: []
      }
      reel_likes: {
        Row: {
          reel_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          reel_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          reel_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
