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
      affiliates: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          opted_in_leaderboard: boolean | null
          referral_code: string
          source: string | null
          user_id: string | null
          whatsapp: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          opted_in_leaderboard?: boolean | null
          referral_code: string
          source?: string | null
          user_id?: string | null
          whatsapp: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          opted_in_leaderboard?: boolean | null
          referral_code?: string
          source?: string | null
          user_id?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      business_intakes: {
        Row: {
          ad_platforms: string[] | null
          ad_spend: string | null
          agency_experience: string | null
          biggest_fear: string | null
          business_description: string | null
          business_name: string
          business_stage: string | null
          business_type: string | null
          city: string | null
          communication_preference: string[] | null
          consent: boolean
          country: string | null
          created_at: string
          customer_age_max: number | null
          customer_age_min: number | null
          customer_gender: string | null
          desired_outcomes: string | null
          email: string
          email_list_size: string | null
          engagement_type: string | null
          full_name: string
          growth_budget: string | null
          has_marketing_budget: string | null
          has_website: string | null
          how_found_us: string | null
          id: string
          instagram_handle: string | null
          language: string | null
          monthly_revenue: string | null
          other_notes: string | null
          primary_goal: string | null
          referrer_name: string | null
          revenue_goal: string | null
          revenue_source: string | null
          revenue_trend: string | null
          runs_ads: string | null
          services_needed: string[] | null
          social_platforms: Json | null
          source: string | null
          start_timeline: string | null
          success_metric: string | null
          target_market: string[] | null
          timeline: string | null
          uploaded_file_name: string | null
          website_rating: number | null
          website_url: string | null
          whatsapp: string
          worked_with_agency: string | null
          years_in_business: string | null
        }
        Insert: {
          ad_platforms?: string[] | null
          ad_spend?: string | null
          agency_experience?: string | null
          biggest_fear?: string | null
          business_description?: string | null
          business_name: string
          business_stage?: string | null
          business_type?: string | null
          city?: string | null
          communication_preference?: string[] | null
          consent?: boolean
          country?: string | null
          created_at?: string
          customer_age_max?: number | null
          customer_age_min?: number | null
          customer_gender?: string | null
          desired_outcomes?: string | null
          email: string
          email_list_size?: string | null
          engagement_type?: string | null
          full_name: string
          growth_budget?: string | null
          has_marketing_budget?: string | null
          has_website?: string | null
          how_found_us?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          monthly_revenue?: string | null
          other_notes?: string | null
          primary_goal?: string | null
          referrer_name?: string | null
          revenue_goal?: string | null
          revenue_source?: string | null
          revenue_trend?: string | null
          runs_ads?: string | null
          services_needed?: string[] | null
          social_platforms?: Json | null
          source?: string | null
          start_timeline?: string | null
          success_metric?: string | null
          target_market?: string[] | null
          timeline?: string | null
          uploaded_file_name?: string | null
          website_rating?: number | null
          website_url?: string | null
          whatsapp: string
          worked_with_agency?: string | null
          years_in_business?: string | null
        }
        Update: {
          ad_platforms?: string[] | null
          ad_spend?: string | null
          agency_experience?: string | null
          biggest_fear?: string | null
          business_description?: string | null
          business_name?: string
          business_stage?: string | null
          business_type?: string | null
          city?: string | null
          communication_preference?: string[] | null
          consent?: boolean
          country?: string | null
          created_at?: string
          customer_age_max?: number | null
          customer_age_min?: number | null
          customer_gender?: string | null
          desired_outcomes?: string | null
          email?: string
          email_list_size?: string | null
          engagement_type?: string | null
          full_name?: string
          growth_budget?: string | null
          has_marketing_budget?: string | null
          has_website?: string | null
          how_found_us?: string | null
          id?: string
          instagram_handle?: string | null
          language?: string | null
          monthly_revenue?: string | null
          other_notes?: string | null
          primary_goal?: string | null
          referrer_name?: string | null
          revenue_goal?: string | null
          revenue_source?: string | null
          revenue_trend?: string | null
          runs_ads?: string | null
          services_needed?: string[] | null
          social_platforms?: Json | null
          source?: string | null
          start_timeline?: string | null
          success_metric?: string | null
          target_market?: string[] | null
          timeline?: string | null
          uploaded_file_name?: string | null
          website_rating?: number | null
          website_url?: string | null
          whatsapp?: string
          worked_with_agency?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      client_accounts: {
        Row: {
          avatar_initials: string | null
          business_name: string
          created_at: string
          full_name: string
          id: string
          manager_name: string | null
          plan: string
          start_date: string
          user_id: string
        }
        Insert: {
          avatar_initials?: string | null
          business_name: string
          created_at?: string
          full_name: string
          id?: string
          manager_name?: string | null
          plan?: string
          start_date?: string
          user_id: string
        }
        Update: {
          avatar_initials?: string | null
          business_name?: string
          created_at?: string
          full_name?: string
          id?: string
          manager_name?: string | null
          plan?: string
          start_date?: string
          user_id?: string
        }
        Relationships: []
      }
      client_files: {
        Row: {
          category: string | null
          client_user_id: string
          created_at: string
          file_name: string
          id: string
          size_kb: number | null
          storage_url: string | null
        }
        Insert: {
          category?: string | null
          client_user_id: string
          created_at?: string
          file_name: string
          id?: string
          size_kb?: number | null
          storage_url?: string | null
        }
        Update: {
          category?: string | null
          client_user_id?: string
          created_at?: string
          file_name?: string
          id?: string
          size_kb?: number | null
          storage_url?: string | null
        }
        Relationships: []
      }
      client_messages: {
        Row: {
          body: string
          client_user_id: string
          created_at: string
          id: string
          sender: string
        }
        Insert: {
          body: string
          client_user_id: string
          created_at?: string
          id?: string
          sender: string
        }
        Update: {
          body?: string
          client_user_id?: string
          created_at?: string
          id?: string
          sender?: string
        }
        Relationships: []
      }
      client_projects: {
        Row: {
          client_user_id: string
          created_at: string
          id: string
          metrics: Json | null
          next_milestone: string | null
          next_milestone_date: string | null
          progress_pct: number
          status: string
          title: string
        }
        Insert: {
          client_user_id: string
          created_at?: string
          id?: string
          metrics?: Json | null
          next_milestone?: string | null
          next_milestone_date?: string | null
          progress_pct?: number
          status?: string
          title: string
        }
        Update: {
          client_user_id?: string
          created_at?: string
          id?: string
          metrics?: Json | null
          next_milestone?: string | null
          next_milestone_date?: string | null
          progress_pct?: number
          status?: string
          title?: string
        }
        Relationships: []
      }
      client_tasks: {
        Row: {
          client_user_id: string
          created_at: string
          done: boolean
          id: string
          label: string
          week: number
        }
        Insert: {
          client_user_id: string
          created_at?: string
          done?: boolean
          id?: string
          label: string
          week?: number
        }
        Update: {
          client_user_id?: string
          created_at?: string
          done?: boolean
          id?: string
          label?: string
          week?: number
        }
        Relationships: []
      }
      email_sequence_leads: {
        Row: {
          business_name: string | null
          business_type: string | null
          created_at: string
          email: string | null
          id: string
          language: string | null
          name: string | null
          sequence_goal: string | null
          tone: string | null
          whatsapp: string | null
        }
        Insert: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          sequence_goal?: string | null
          tone?: string | null
          whatsapp?: string | null
        }
        Update: {
          business_name?: string | null
          business_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          sequence_goal?: string | null
          tone?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      knowledge_articles: {
        Row: {
          body_md: string
          category: string
          created_at: string
          difficulty: string
          excerpt: string | null
          featured: boolean
          id: string
          published: boolean
          read_time_minutes: number
          slug: string
          title: string
        }
        Insert: {
          body_md: string
          category: string
          created_at?: string
          difficulty?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          read_time_minutes?: number
          slug: string
          title: string
        }
        Update: {
          body_md?: string
          category?: string
          created_at?: string
          difficulty?: string
          excerpt?: string | null
          featured?: boolean
          id?: string
          published?: boolean
          read_time_minutes?: number
          slug?: string
          title?: string
        }
        Relationships: []
      }
      knowledge_feedback: {
        Row: {
          article_slug: string
          created_at: string
          helpful: boolean
          id: string
        }
        Insert: {
          article_slug: string
          created_at?: string
          helpful: boolean
          id?: string
        }
        Update: {
          article_slug?: string
          created_at?: string
          helpful?: boolean
          id?: string
        }
        Relationships: []
      }
      lead_magnet_downloads: {
        Row: {
          business_type: string | null
          created_at: string
          email: string | null
          id: string
          language: string | null
          name: string
          opted_in_weekly: boolean | null
          resource_slug: string
          resource_title: string | null
          whatsapp: string
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name: string
          opted_in_weekly?: boolean | null
          resource_slug: string
          resource_title?: string | null
          whatsapp: string
        }
        Update: {
          business_type?: string | null
          created_at?: string
          email?: string | null
          id?: string
          language?: string | null
          name?: string
          opted_in_weekly?: boolean | null
          resource_slug?: string
          resource_title?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          budget: string | null
          business_name: string | null
          business_type: string | null
          challenges: string[] | null
          created_at: string
          email: string | null
          goal: string | null
          id: string
          language: string | null
          location: string | null
          name: string | null
          presence: string[] | null
          recommended_services: string[] | null
          revenue: string | null
          score: number | null
          source: string
          team_size: string | null
          timeline: string | null
          whatsapp: string | null
          years_in_business: string | null
        }
        Insert: {
          budget?: string | null
          business_name?: string | null
          business_type?: string | null
          challenges?: string[] | null
          created_at?: string
          email?: string | null
          goal?: string | null
          id?: string
          language?: string | null
          location?: string | null
          name?: string | null
          presence?: string[] | null
          recommended_services?: string[] | null
          revenue?: string | null
          score?: number | null
          source: string
          team_size?: string | null
          timeline?: string | null
          whatsapp?: string | null
          years_in_business?: string | null
        }
        Update: {
          budget?: string | null
          business_name?: string | null
          business_type?: string | null
          challenges?: string[] | null
          created_at?: string
          email?: string | null
          goal?: string | null
          id?: string
          language?: string | null
          location?: string | null
          name?: string | null
          presence?: string[] | null
          recommended_services?: string[] | null
          revenue?: string | null
          score?: number | null
          source?: string
          team_size?: string | null
          timeline?: string | null
          whatsapp?: string | null
          years_in_business?: string | null
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          business_type: string | null
          created_at: string
          id: string
          language: string | null
          name: string | null
          no_questions: Json | null
          result_bucket: string
          score: number
          whatsapp: string | null
        }
        Insert: {
          business_type?: string | null
          created_at?: string
          id?: string
          language?: string | null
          name?: string | null
          no_questions?: Json | null
          result_bucket: string
          score: number
          whatsapp?: string | null
        }
        Update: {
          business_type?: string | null
          created_at?: string
          id?: string
          language?: string | null
          name?: string | null
          no_questions?: Json | null
          result_bucket?: string
          score?: number
          whatsapp?: string | null
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          country: string | null
          created_at: string
          id: string
          page: string | null
          referral_code: string
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          id?: string
          page?: string | null
          referral_code: string
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          id?: string
          page?: string | null
          referral_code?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      roi_calculations: {
        Row: {
          additional_revenue: number | null
          avg_order_value: number | null
          break_even_days: number | null
          budget: string | null
          conversion_rate: number | null
          created_at: string
          current_ad_spend: number | null
          current_leads: number | null
          current_revenue: number | null
          email: string | null
          id: string
          language: string | null
          name: string | null
          niche: string | null
          projected_leads: number | null
          projected_revenue: number | null
          roi_multiplier: number | null
          timeline: number | null
          whatsapp: string | null
        }
        Insert: {
          additional_revenue?: number | null
          avg_order_value?: number | null
          break_even_days?: number | null
          budget?: string | null
          conversion_rate?: number | null
          created_at?: string
          current_ad_spend?: number | null
          current_leads?: number | null
          current_revenue?: number | null
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          niche?: string | null
          projected_leads?: number | null
          projected_revenue?: number | null
          roi_multiplier?: number | null
          timeline?: number | null
          whatsapp?: string | null
        }
        Update: {
          additional_revenue?: number | null
          avg_order_value?: number | null
          break_even_days?: number | null
          budget?: string | null
          conversion_rate?: number | null
          created_at?: string
          current_ad_spend?: number | null
          current_leads?: number | null
          current_revenue?: number | null
          email?: string | null
          id?: string
          language?: string | null
          name?: string | null
          niche?: string | null
          projected_leads?: number | null
          projected_revenue?: number | null
          roi_multiplier?: number | null
          timeline?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "affiliate"
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
      app_role: ["admin", "client", "affiliate"],
    },
  },
} as const
