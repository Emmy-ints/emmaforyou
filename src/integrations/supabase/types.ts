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
    Enums: {},
  },
} as const
