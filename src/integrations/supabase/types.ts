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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
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
      agent_action_claims: {
        Row: {
          agent_id: string | null
          claimed_at: string
          expires_at: string
          finished_at: string | null
          member_id: string | null
          outcome: string | null
          post_id: string | null
          state: string
          target: string
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          claimed_at?: string
          expires_at: string
          finished_at?: string | null
          member_id?: string | null
          outcome?: string | null
          post_id?: string | null
          state: string
          target: string
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          claimed_at?: string
          expires_at?: string
          finished_at?: string | null
          member_id?: string | null
          outcome?: string | null
          post_id?: string | null
          state?: string
          target?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_action_claims_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          agent_id: string | null
          created_at: string
          details: Json
          id: number
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          agent_id?: string | null
          created_at?: string
          details?: Json
          id?: number
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          agent_id?: string | null
          created_at?: string
          details?: Json
          id?: number
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_audit_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_community_actions: {
        Row: {
          action: string
          agent_id: string | null
          comment_id: string | null
          created_at: string
          dedupe_key: string | null
          detail: Json
          id: number
          member_id: string | null
          ok: boolean
          post_id: string | null
          reason: string | null
          task_id: string | null
        }
        Insert: {
          action: string
          agent_id?: string | null
          comment_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          detail?: Json
          id?: number
          member_id?: string | null
          ok?: boolean
          post_id?: string | null
          reason?: string | null
          task_id?: string | null
        }
        Update: {
          action?: string
          agent_id?: string | null
          comment_id?: string | null
          created_at?: string
          dedupe_key?: string | null
          detail?: Json
          id?: number
          member_id?: string | null
          ok?: boolean
          post_id?: string | null
          reason?: string | null
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_community_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_community_actions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_community_actions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_community_actions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_content_queue: {
        Row: {
          agent_id: string
          body: string
          created_at: string
          error: string | null
          fingerprint: string
          id: string
          kind: string
          parent_comment_id: string | null
          post_id: string | null
          post_kind: string | null
          publish_at: string
          published_ref: string | null
          reason: string | null
          research_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sources: Json
          status: string
          tags: string[]
          task_id: string | null
          title: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          body: string
          created_at?: string
          error?: string | null
          fingerprint: string
          id?: string
          kind: string
          parent_comment_id?: string | null
          post_id?: string | null
          post_kind?: string | null
          publish_at?: string
          published_ref?: string | null
          reason?: string | null
          research_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sources?: Json
          status?: string
          tags?: string[]
          task_id?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          body?: string
          created_at?: string
          error?: string | null
          fingerprint?: string
          id?: string
          kind?: string
          parent_comment_id?: string | null
          post_id?: string | null
          post_kind?: string | null
          publish_at?: string
          published_ref?: string | null
          reason?: string | null
          research_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sources?: Json
          status?: string
          tags?: string[]
          task_id?: string | null
          title?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_content_queue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_content_queue_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_content_queue_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_content_queue_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "agent_research_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_content_queue_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_conversation_context: {
        Row: {
          facts: string
          interactions: number
          last_agent_id: string | null
          member_id: string
          updated_at: string
        }
        Insert: {
          facts?: string
          interactions?: number
          last_agent_id?: string | null
          member_id: string
          updated_at?: string
        }
        Update: {
          facts?: string
          interactions?: number
          last_agent_id?: string | null
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_conversation_context_last_agent_id_fkey"
            columns: ["last_agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_daily_posts: {
        Row: {
          agent_id: string
          alerted_at: string | null
          attempts: number
          created_at: string
          day: string
          id: string
          last_error: string | null
          last_published_at: string | null
          mode: string | null
          on_rota: boolean
          post_ids: string[]
          published_count: number
          queue_ids: string[]
          rounds: number
          slot_at: string
          status: string
          target: number
          updated_at: string
        }
        Insert: {
          agent_id: string
          alerted_at?: string | null
          attempts?: number
          created_at?: string
          day: string
          id?: string
          last_error?: string | null
          last_published_at?: string | null
          mode?: string | null
          on_rota?: boolean
          post_ids?: string[]
          published_count?: number
          queue_ids?: string[]
          rounds?: number
          slot_at: string
          status?: string
          target?: number
          updated_at?: string
        }
        Update: {
          agent_id?: string
          alerted_at?: string | null
          attempts?: number
          created_at?: string
          day?: string
          id?: string
          last_error?: string | null
          last_published_at?: string | null
          mode?: string | null
          on_rota?: boolean
          post_ids?: string[]
          published_count?: number
          queue_ids?: string[]
          rounds?: number
          slot_at?: string
          status?: string
          target?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_daily_posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_followup_tasks: {
        Row: {
          agent_id: string | null
          channel: string
          consent: string
          created_at: string
          due_at: string
          id: string
          lead_id: string | null
          member_id: string
          post_id: string | null
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          channel?: string
          consent: string
          created_at?: string
          due_at: string
          id?: string
          lead_id?: string | null
          member_id: string
          post_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          channel?: string
          consent?: string
          created_at?: string
          due_at?: string
          id?: string
          lead_id?: string | null
          member_id?: string
          post_id?: string | null
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_followup_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_followup_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "agent_lead_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_followup_tasks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_handover_states: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          reason: string | null
          state: string
          target_id: string
          target_type: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          reason?: string | null
          state?: string
          target_id: string
          target_type: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          reason?: string | null
          state?: string
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      agent_knowledge_sources: {
        Row: {
          active: boolean
          agent_id: string | null
          body: string
          id: string
          keywords: string[]
          layer: string
          niche_key: string | null
          niche_type: string | null
          path: string | null
          ref: string
          source: string
          title: string
          updated_at: string
          verified: boolean
        }
        Insert: {
          active?: boolean
          agent_id?: string | null
          body?: string
          id?: string
          keywords?: string[]
          layer: string
          niche_key?: string | null
          niche_type?: string | null
          path?: string | null
          ref: string
          source?: string
          title: string
          updated_at?: string
          verified?: boolean
        }
        Update: {
          active?: boolean
          agent_id?: string | null
          body?: string
          id?: string
          keywords?: string[]
          layer?: string
          niche_key?: string | null
          niche_type?: string | null
          path?: string | null
          ref?: string
          source?: string
          title?: string
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agent_knowledge_sources_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_lead_records: {
        Row: {
          agent_id: string | null
          assigned_to: string | null
          confidence: number
          created_at: string
          evidence: string | null
          history: Json
          human_override: boolean
          id: string
          member_id: string | null
          need: string
          next_action: string | null
          next_action_at: string | null
          niche: string | null
          outcome_note: string | null
          post_id: string | null
          service_path: string | null
          source: string
          source_id: string
          stage: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          assigned_to?: string | null
          confidence?: number
          created_at?: string
          evidence?: string | null
          history?: Json
          human_override?: boolean
          id?: string
          member_id?: string | null
          need: string
          next_action?: string | null
          next_action_at?: string | null
          niche?: string | null
          outcome_note?: string | null
          post_id?: string | null
          service_path?: string | null
          source: string
          source_id: string
          stage?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          assigned_to?: string | null
          confidence?: number
          created_at?: string
          evidence?: string | null
          history?: Json
          human_override?: boolean
          id?: string
          member_id?: string | null
          need?: string
          next_action?: string | null
          next_action_at?: string | null
          niche?: string | null
          outcome_note?: string | null
          post_id?: string | null
          service_path?: string | null
          source?: string
          source_id?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_lead_records_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_lead_records_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_member_prefs: {
        Row: {
          no_followups: boolean
          no_memory: boolean
          no_replies: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          no_followups?: boolean
          no_memory?: boolean
          no_replies?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          no_followups?: boolean
          no_memory?: boolean
          no_replies?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_niche_assignments: {
        Row: {
          agent_id: string
          created_at: string
          id: number
          is_primary: boolean
          niche_key: string
          niche_type: string
          source: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: number
          is_primary?: boolean
          niche_key: string
          niche_type: string
          source?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: number
          is_primary?: boolean
          niche_key?: string
          niche_type?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_niche_assignments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_profiles: {
        Row: {
          capabilities: string[]
          community_strategy: string
          created_at: string
          daily_post_target: number
          daily_reply_limit: number
          description: string
          enabled: boolean
          id: string
          keywords: string[]
          kind: string
          knowledge: string
          limits: string
          merged_into: string | null
          model: string | null
          monthly_token_budget: number | null
          name: string
          posts_per_week: number
          problem_workflow: string
          publish_policy: string
          reply_policy: string
          research_strategy: string
          sales_workflow: string
          scope: string
          slug: string
          sort: number
          title: string
          topics: string[]
          updated_at: string
          user_id: string | null
          voice: string
        }
        Insert: {
          capabilities?: string[]
          community_strategy?: string
          created_at?: string
          daily_post_target?: number
          daily_reply_limit?: number
          description?: string
          enabled?: boolean
          id?: string
          keywords?: string[]
          kind?: string
          knowledge?: string
          limits?: string
          merged_into?: string | null
          model?: string | null
          monthly_token_budget?: number | null
          name: string
          posts_per_week?: number
          problem_workflow?: string
          publish_policy?: string
          reply_policy?: string
          research_strategy?: string
          sales_workflow?: string
          scope?: string
          slug: string
          sort?: number
          title: string
          topics?: string[]
          updated_at?: string
          user_id?: string | null
          voice?: string
        }
        Update: {
          capabilities?: string[]
          community_strategy?: string
          created_at?: string
          daily_post_target?: number
          daily_reply_limit?: number
          description?: string
          enabled?: boolean
          id?: string
          keywords?: string[]
          kind?: string
          knowledge?: string
          limits?: string
          merged_into?: string | null
          model?: string | null
          monthly_token_budget?: number | null
          name?: string
          posts_per_week?: number
          problem_workflow?: string
          publish_policy?: string
          reply_policy?: string
          research_strategy?: string
          sales_workflow?: string
          scope?: string
          slug?: string
          sort?: number
          title?: string
          topics?: string[]
          updated_at?: string
          user_id?: string | null
          voice?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_profiles_merged_into_fkey"
            columns: ["merged_into"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_reports: {
        Row: {
          created_at: string
          data: Json
          id: number
          period: string
          period_start: string
        }
        Insert: {
          created_at?: string
          data: Json
          id?: number
          period: string
          period_start: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: number
          period?: string
          period_start?: string
        }
        Relationships: []
      }
      agent_research_items: {
        Row: {
          agent_id: string
          confidence: string
          created_at: string
          fingerprint: string
          id: string
          kind: string
          published_at: string | null
          relevance: number
          source_name: string | null
          status: string
          summary: string | null
          title: string
          topic: string | null
          trend_id: string | null
          url: string | null
        }
        Insert: {
          agent_id: string
          confidence?: string
          created_at?: string
          fingerprint: string
          id?: string
          kind?: string
          published_at?: string | null
          relevance?: number
          source_name?: string | null
          status?: string
          summary?: string | null
          title: string
          topic?: string | null
          trend_id?: string | null
          url?: string | null
        }
        Update: {
          agent_id?: string
          confidence?: string
          created_at?: string
          fingerprint?: string
          id?: string
          kind?: string
          published_at?: string | null
          relevance?: number
          source_name?: string | null
          status?: string
          summary?: string | null
          title?: string
          topic?: string | null
          trend_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_research_items_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_research_items_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "blog_trends"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_schedules: {
        Row: {
          config: Json
          enabled: boolean
          id: string
          interval_minutes: number
          label: string
          last_run_at: string | null
          last_status: string | null
          next_run_at: string
          updated_at: string
        }
        Insert: {
          config?: Json
          enabled?: boolean
          id: string
          interval_minutes: number
          label: string
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string
          updated_at?: string
        }
        Update: {
          config?: Json
          enabled?: boolean
          id?: string
          interval_minutes?: number
          label?: string
          last_run_at?: string | null
          last_status?: string | null
          next_run_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_settings: {
        Row: {
          admin_instructions: string | null
          auto_publish_posts: boolean
          daily_ai_call_limit: number
          daily_posters: number
          id: number
          last_kick_at: string | null
          max_agent_replies_per_thread: number
          max_followups_per_member_per_month: number
          max_replies_per_member_per_day: number
          model: string | null
          monitor_comments: boolean
          monthly_cost_limit_usd: number | null
          monthly_token_limit: number
          paused: boolean
          paused_reason: string | null
          post_window_end: number
          post_window_start: number
          price_input_per_1m: number | null
          price_output_per_1m: number | null
          private_outreach_enabled: boolean
          reply_delay_jitter_seconds: number
          reply_delay_seconds: number
          review_all_replies: boolean
          tick_secret: string
          timezone: string
          unanswered_after_minutes: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          admin_instructions?: string | null
          auto_publish_posts?: boolean
          daily_ai_call_limit?: number
          daily_posters?: number
          id?: number
          last_kick_at?: string | null
          max_agent_replies_per_thread?: number
          max_followups_per_member_per_month?: number
          max_replies_per_member_per_day?: number
          model?: string | null
          monitor_comments?: boolean
          monthly_cost_limit_usd?: number | null
          monthly_token_limit?: number
          paused?: boolean
          paused_reason?: string | null
          post_window_end?: number
          post_window_start?: number
          price_input_per_1m?: number | null
          price_output_per_1m?: number | null
          private_outreach_enabled?: boolean
          reply_delay_jitter_seconds?: number
          reply_delay_seconds?: number
          review_all_replies?: boolean
          tick_secret?: string
          timezone?: string
          unanswered_after_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          admin_instructions?: string | null
          auto_publish_posts?: boolean
          daily_ai_call_limit?: number
          daily_posters?: number
          id?: number
          last_kick_at?: string | null
          max_agent_replies_per_thread?: number
          max_followups_per_member_per_month?: number
          max_replies_per_member_per_day?: number
          model?: string | null
          monitor_comments?: boolean
          monthly_cost_limit_usd?: number | null
          monthly_token_limit?: number
          paused?: boolean
          paused_reason?: string | null
          post_window_end?: number
          post_window_start?: number
          price_input_per_1m?: number | null
          price_output_per_1m?: number | null
          private_outreach_enabled?: boolean
          reply_delay_jitter_seconds?: number
          reply_delay_seconds?: number
          review_all_replies?: boolean
          tick_secret?: string
          timezone?: string
          unanswered_after_minutes?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      agent_task_runs: {
        Row: {
          agent_id: string | null
          attempt: number
          detail: Json
          error: string | null
          finished_at: string | null
          id: number
          kind: string
          ms: number | null
          ok: boolean | null
          outcome: string | null
          started_at: string
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          attempt?: number
          detail?: Json
          error?: string | null
          finished_at?: string | null
          id?: number
          kind: string
          ms?: number | null
          ok?: boolean | null
          outcome?: string | null
          started_at?: string
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          attempt?: number
          detail?: Json
          error?: string | null
          finished_at?: string | null
          id?: number
          kind?: string
          ms?: number | null
          ok?: boolean | null
          outcome?: string | null
          started_at?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_task_runs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_task_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_tasks: {
        Row: {
          agent_id: string | null
          attempts: number
          created_at: string
          created_by: string | null
          dedupe_key: string
          finished_at: string | null
          id: string
          kind: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          payload: Json
          priority: number
          result: Json | null
          run_after: string
          status: string
          updated_at: string
        }
        Insert: {
          agent_id?: string | null
          attempts?: number
          created_at?: string
          created_by?: string | null
          dedupe_key: string
          finished_at?: string | null
          id?: string
          kind: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          run_after?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agent_id?: string | null
          attempts?: number
          created_at?: string
          created_by?: string | null
          dedupe_key?: string
          finished_at?: string | null
          id?: string
          kind?: string
          last_error?: string | null
          locked_until?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          result?: Json | null
          run_after?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_ticks: {
        Row: {
          claimed: number | null
          finished_at: string | null
          id: number
          note: string | null
          ok: boolean | null
          processed: number | null
          request_id: number | null
          source: string
          started_at: string
        }
        Insert: {
          claimed?: number | null
          finished_at?: string | null
          id?: number
          note?: string | null
          ok?: boolean | null
          processed?: number | null
          request_id?: number | null
          source: string
          started_at?: string
        }
        Update: {
          claimed?: number | null
          finished_at?: string | null
          id?: number
          note?: string | null
          ok?: boolean | null
          processed?: number | null
          request_id?: number | null
          source?: string
          started_at?: string
        }
        Relationships: []
      }
      agent_usage_records: {
        Row: {
          agent_id: string | null
          created_at: string
          est_cost_usd: number | null
          id: number
          input_tokens: number | null
          model: string | null
          ms: number | null
          ok: boolean
          output_tokens: number | null
          provider: string | null
          purpose: string
          task_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          est_cost_usd?: number | null
          id?: number
          input_tokens?: number | null
          model?: string | null
          ms?: number | null
          ok?: boolean
          output_tokens?: number | null
          provider?: string | null
          purpose: string
          task_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          est_cost_usd?: number | null
          id?: number
          input_tokens?: number | null
          model?: string | null
          ms?: number | null
          ok?: boolean
          output_tokens?: number | null
          provider?: string | null
          purpose?: string
          task_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_usage_records_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agent_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_usage_records_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "agent_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_agent_settings: {
        Row: {
          enabled: boolean
          extra_instructions: string | null
          id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          extra_instructions?: string | null
          id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          extra_instructions?: string | null
          id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_articles: {
        Row: {
          body: string
          category: string
          content_hash: string
          cover: Json
          created_at: string
          excerpt: string
          id: string
          industry: string
          internal_links: string[]
          keywords: string[]
          model: string | null
          provider: string | null
          published_at: string
          quality: Json
          quality_score: number
          read_minutes: number
          run_id: string | null
          seo_title: string | null
          slug: string
          sources: Json
          status: string
          title: string
          title_fingerprint: string
          trend_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          category: string
          content_hash: string
          cover?: Json
          created_at?: string
          excerpt: string
          id?: string
          industry: string
          internal_links?: string[]
          keywords?: string[]
          model?: string | null
          provider?: string | null
          published_at?: string
          quality?: Json
          quality_score?: number
          read_minutes?: number
          run_id?: string | null
          seo_title?: string | null
          slug: string
          sources?: Json
          status?: string
          title: string
          title_fingerprint: string
          trend_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          category?: string
          content_hash?: string
          cover?: Json
          created_at?: string
          excerpt?: string
          id?: string
          industry?: string
          internal_links?: string[]
          keywords?: string[]
          model?: string | null
          provider?: string | null
          published_at?: string
          quality?: Json
          quality_score?: number
          read_minutes?: number
          run_id?: string | null
          seo_title?: string | null
          slug?: string
          sources?: Json
          status?: string
          title?: string
          title_fingerprint?: string
          trend_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_articles_run_fk"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "blog_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_articles_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "blog_trends"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_maintenance: {
        Row: {
          article_id: string | null
          created_at: string
          detail: string
          id: string
          kind: string
          resolved_at: string | null
          status: string
        }
        Insert: {
          article_id?: string | null
          created_at?: string
          detail: string
          id?: string
          kind: string
          resolved_at?: string | null
          status?: string
        }
        Update: {
          article_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          kind?: string
          resolved_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_maintenance_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_runs: {
        Row: {
          article_id: string | null
          attempts: number
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          local_date: string
          log: Json
          scheduled_for: string
          slot_key: string
          started_at: string
          status: string
          trend_id: string | null
          updated_at: string
        }
        Insert: {
          article_id?: string | null
          attempts?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          local_date: string
          log?: Json
          scheduled_for: string
          slot_key: string
          started_at?: string
          status?: string
          trend_id?: string | null
          updated_at?: string
        }
        Update: {
          article_id?: string | null
          attempts?: number
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          local_date?: string
          log?: Json
          scheduled_for?: string
          slot_key?: string
          started_at?: string
          status?: string
          trend_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_runs_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "blog_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_runs_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "blog_trends"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_settings: {
        Row: {
          daily_target: number
          enabled: boolean
          id: number
          last_maintenance_at: string | null
          site_url: string
          slots: string[]
          timezone: string
          updated_at: string
        }
        Insert: {
          daily_target?: number
          enabled?: boolean
          id?: number
          last_maintenance_at?: string | null
          site_url?: string
          slots?: string[]
          timezone?: string
          updated_at?: string
        }
        Update: {
          daily_target?: number
          enabled?: boolean
          id?: number
          last_maintenance_at?: string | null
          site_url?: string
          slots?: string[]
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_sources: {
        Row: {
          created_at: string
          enabled: boolean
          feed_url: string
          id: string
          industry: string
          item_count: number
          last_error: string | null
          last_fetched_at: string | null
          last_status: string | null
          name: string
          site_url: string
          trust: number
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feed_url: string
          id?: string
          industry: string
          item_count?: number
          last_error?: string | null
          last_fetched_at?: string | null
          last_status?: string | null
          name: string
          site_url: string
          trust?: number
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feed_url?: string
          id?: string
          industry?: string
          item_count?: number
          last_error?: string | null
          last_fetched_at?: string | null
          last_status?: string | null
          name?: string
          site_url?: string
          trust?: number
        }
        Relationships: []
      }
      blog_ticks: {
        Row: {
          created_at: string
          id: number
          request_id: number | null
          target: string
        }
        Insert: {
          created_at?: string
          id?: number
          request_id?: number | null
          target: string
        }
        Update: {
          created_at?: string
          id?: number
          request_id?: number | null
          target?: string
        }
        Relationships: []
      }
      blog_trends: {
        Row: {
          fetched_at: string
          id: string
          industry: string
          keywords: string[]
          published_at: string | null
          score: number
          score_detail: Json
          source_id: string
          summary: string | null
          title: string
          url: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          industry: string
          keywords?: string[]
          published_at?: string | null
          score?: number
          score_detail?: Json
          source_id: string
          summary?: string | null
          title: string
          url: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          fetched_at?: string
          id?: string
          industry?: string
          keywords?: string[]
          published_at?: string | null
          score?: number
          score_detail?: Json
          source_id?: string
          summary?: string | null
          title?: string
          url?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_trends_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "blog_sources"
            referencedColumns: ["id"]
          },
        ]
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
      case_studies: {
        Row: {
          approach: string | null
          challenge: string | null
          client_role: string | null
          deliverables: string[]
          published: boolean
          quote: string | null
          quote_author: string | null
          results: string | null
          screenshots: string[]
          slug: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          approach?: string | null
          challenge?: string | null
          client_role?: string | null
          deliverables?: string[]
          published?: boolean
          quote?: string | null
          quote_author?: string | null
          results?: string | null
          screenshots?: string[]
          slug: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          approach?: string | null
          challenge?: string | null
          client_role?: string | null
          deliverables?: string[]
          published?: boolean
          quote?: string | null
          quote_author?: string | null
          results?: string | null
          screenshots?: string[]
          slug?: string
          timeline?: string | null
          updated_at?: string
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
      client_approvals: {
        Row: {
          client_note: string | null
          client_user_id: string
          created_at: string
          decided_at: string | null
          details: string | null
          id: string
          preview_url: string | null
          status: string
          title: string
        }
        Insert: {
          client_note?: string | null
          client_user_id: string
          created_at?: string
          decided_at?: string | null
          details?: string | null
          id?: string
          preview_url?: string | null
          status?: string
          title: string
        }
        Update: {
          client_note?: string | null
          client_user_id?: string
          created_at?: string
          decided_at?: string | null
          details?: string | null
          id?: string
          preview_url?: string | null
          status?: string
          title?: string
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
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          client_user_id: string
          created_at?: string
          file_name: string
          id?: string
          size_kb?: number | null
          storage_url?: string | null
          uploaded_by?: string
        }
        Update: {
          category?: string | null
          client_user_id?: string
          created_at?: string
          file_name?: string
          id?: string
          size_kb?: number | null
          storage_url?: string | null
          uploaded_by?: string
        }
        Relationships: []
      }
      client_invoices: {
        Row: {
          amount: number
          client_user_id: string
          created_at: string
          currency: string
          description: string
          due_date: string | null
          id: string
          number: string
          pay_url: string | null
          status: string
        }
        Insert: {
          amount: number
          client_user_id: string
          created_at?: string
          currency?: string
          description: string
          due_date?: string | null
          id?: string
          number: string
          pay_url?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_user_id?: string
          created_at?: string
          currency?: string
          description?: string
          due_date?: string | null
          id?: string
          number?: string
          pay_url?: string | null
          status?: string
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
      client_testimonials: {
        Row: {
          approval_id: string | null
          approved: boolean
          body: string
          business: string | null
          client_user_id: string
          created_at: string
          display_name: string
          id: string
          may_publish: boolean
          rating: number
        }
        Insert: {
          approval_id?: string | null
          approved?: boolean
          body: string
          business?: string | null
          client_user_id: string
          created_at?: string
          display_name: string
          id?: string
          may_publish?: boolean
          rating: number
        }
        Update: {
          approval_id?: string | null
          approved?: boolean
          body?: string
          business?: string | null
          client_user_id?: string
          created_at?: string
          display_name?: string
          id?: string
          may_publish?: boolean
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_testimonials_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "client_approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      community_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json
          id: number
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: number
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json
          id?: number
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      community_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_comment_reactions: {
        Row: {
          comment_id: string
          created_at: string
          kind: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          kind: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comment_reactions_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_comments: {
        Row: {
          author_id: string
          body: string
          client_key: string | null
          created_at: string
          depth: number
          edited_at: string | null
          id: string
          is_helpful: boolean
          parent_id: string | null
          post_id: string
          reaction_count: number
          reactions: Json
          reply_count: number
          status: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          client_key?: string | null
          created_at?: string
          depth?: number
          edited_at?: string | null
          id?: string
          is_helpful?: boolean
          parent_id?: string | null
          post_id: string
          reaction_count?: number
          reactions?: Json
          reply_count?: number
          status?: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          client_key?: string | null
          created_at?: string
          depth?: number
          edited_at?: string | null
          id?: string
          is_helpful?: boolean
          parent_id?: string | null
          post_id?: string
          reaction_count?: number
          reactions?: Json
          reply_count?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_conversation_reads: {
        Row: {
          conversation_id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_conversation_reads_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "community_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_conversations: {
        Row: {
          assigned_staff: string | null
          control: string
          control_version: number
          created_at: string
          human_requested_at: string | null
          id: string
          kind: string
          last_message_at: string
          last_message_preview: string | null
          member_a: string
          member_b: string | null
          specialist: string | null
          status: string
        }
        Insert: {
          assigned_staff?: string | null
          control?: string
          control_version?: number
          created_at?: string
          human_requested_at?: string | null
          id?: string
          kind: string
          last_message_at?: string
          last_message_preview?: string | null
          member_a: string
          member_b?: string | null
          specialist?: string | null
          status?: string
        }
        Update: {
          assigned_staff?: string | null
          control?: string
          control_version?: number
          created_at?: string
          human_requested_at?: string | null
          id?: string
          kind?: string
          last_message_at?: string
          last_message_preview?: string | null
          member_a?: string
          member_b?: string | null
          specialist?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_conversations_member_a_fkey"
            columns: ["member_a"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_conversations_member_b_fkey"
            columns: ["member_b"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_follows: {
        Row: {
          created_at: string
          followee_id: string
          follower_id: string
        }
        Insert: {
          created_at?: string
          followee_id: string
          follower_id: string
        }
        Update: {
          created_at?: string
          followee_id?: string
          follower_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_follows_followee_id_fkey"
            columns: ["followee_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_group_members: {
        Row: {
          created_at: string
          group_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          member_count: number
          name: string
          owner_id: string
          post_count: number
          slug: string
          topic: string | null
          visibility: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          owner_id: string
          post_count?: number
          slug: string
          topic?: string | null
          visibility?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          owner_id?: string
          post_count?: number
          slug?: string
          topic?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_messages: {
        Row: {
          body: string
          client_key: string | null
          control_version: number | null
          conversation_id: string
          created_at: string
          id: string
          sender_id: string | null
          sender_kind: string
        }
        Insert: {
          body: string
          client_key?: string | null
          control_version?: number | null
          conversation_id: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_kind: string
        }
        Update: {
          body?: string
          client_key?: string | null
          control_version?: number | null
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          sender_kind?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "community_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      community_notifications: {
        Row: {
          actor_id: string | null
          comment_id: string | null
          created_at: string
          dedupe_key: string
          id: string
          post_id: string | null
          read_at: string | null
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          dedupe_key: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          comment_id?: string | null
          created_at?: string
          dedupe_key?: string
          id?: string
          post_id?: string | null
          read_at?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_notifications_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string
          option_index: number
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_index: number
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_index?: number
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_posts: {
        Row: {
          accepted_comment_id: string | null
          author_id: string
          body: string
          client_key: string | null
          comment_count: number
          created_at: string
          edited_at: string | null
          engagement: number
          group_id: string | null
          id: string
          is_pinned: boolean
          kind: string
          link_url: string | null
          media: Json
          poll_counts: number[] | null
          poll_options: string[] | null
          published_at: string | null
          reaction_count: number
          reactions: Json
          status: string
          tags: string[]
          title: string | null
          topic: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          accepted_comment_id?: string | null
          author_id: string
          body: string
          client_key?: string | null
          comment_count?: number
          created_at?: string
          edited_at?: string | null
          engagement?: number
          group_id?: string | null
          id?: string
          is_pinned?: boolean
          kind?: string
          link_url?: string | null
          media?: Json
          poll_counts?: number[] | null
          poll_options?: string[] | null
          published_at?: string | null
          reaction_count?: number
          reactions?: Json
          status?: string
          tags?: string[]
          title?: string | null
          topic?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          accepted_comment_id?: string | null
          author_id?: string
          body?: string
          client_key?: string | null
          comment_count?: number
          created_at?: string
          edited_at?: string | null
          engagement?: number
          group_id?: string | null
          id?: string
          is_pinned?: boolean
          kind?: string
          link_url?: string | null
          media?: Json
          poll_counts?: number[] | null
          poll_options?: string[] | null
          published_at?: string | null
          reaction_count?: number
          reactions?: Json
          status?: string
          tags?: string[]
          title?: string | null
          topic?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_accepted_fk"
            columns: ["accepted_comment_id"]
            isOneToOne: false
            referencedRelation: "community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "community_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "community_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      community_profiles: {
        Row: {
          agent_slug: string | null
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          follower_count: number
          following_count: number
          headline: string | null
          helpful_count: number
          interests: string[]
          is_specialist: boolean
          links: Json
          location: string | null
          post_count: number
          skills: string[]
          suspended_at: string | null
          updated_at: string
          user_id: string
          username: string
          visibility: string
          website: string | null
        }
        Insert: {
          agent_slug?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          follower_count?: number
          following_count?: number
          headline?: string | null
          helpful_count?: number
          interests?: string[]
          is_specialist?: boolean
          links?: Json
          location?: string | null
          post_count?: number
          skills?: string[]
          suspended_at?: string | null
          updated_at?: string
          user_id: string
          username: string
          visibility?: string
          website?: string | null
        }
        Update: {
          agent_slug?: string | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          follower_count?: number
          following_count?: number
          headline?: string | null
          helpful_count?: number
          interests?: string[]
          is_specialist?: boolean
          links?: Json
          location?: string | null
          post_count?: number
          skills?: string[]
          suspended_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string
          visibility?: string
          website?: string | null
        }
        Relationships: []
      }
      community_reactions: {
        Row: {
          created_at: string
          kind: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          kind: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          kind?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      community_saves: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_saves_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "community_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ecom_guide_messages: {
        Row: {
          body: string
          created_at: string
          id: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_guide_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ecom_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_integrations: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          last_sync_at: string | null
          provider: string
          status: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          last_sync_at?: string | null
          provider: string
          status?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          last_sync_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_integrations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ecom_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_items: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          status: string
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ecom_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "ecom_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      ecom_usage: {
        Row: {
          created_at: string
          error: string | null
          id: number
          ms: number | null
          ok: boolean
          tool: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: number
          ms?: number | null
          ok: boolean
          tool: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: number
          ms?: number | null
          ok?: boolean
          tool?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ecom_workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          profile: Json
          stage: string
          store_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          profile?: Json
          stage?: string
          store_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          profile?: Json
          stage?: string
          store_url?: string | null
          updated_at?: string
          user_id?: string
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
      inspiration_examples: {
        Row: {
          also_listed_on: string[]
          attribution: string | null
          brand: string | null
          canonical_key: string
          colors: string[]
          description: string | null
          discovered_at: string
          edited_by_admin: boolean
          id: string
          image_status: string
          image_url: string | null
          industries: string[]
          kind: string
          link_checked_at: string | null
          link_status: string
          listing_url: string
          manual: boolean
          original_url: string | null
          platform: string | null
          search: unknown
          source_id: string
          source_published_at: string | null
          status: string
          styles: string[]
          tags: string[]
          theme: string | null
          title: string
          updated_at: string
        }
        Insert: {
          also_listed_on?: string[]
          attribution?: string | null
          brand?: string | null
          canonical_key: string
          colors?: string[]
          description?: string | null
          discovered_at?: string
          edited_by_admin?: boolean
          id?: string
          image_status?: string
          image_url?: string | null
          industries?: string[]
          kind: string
          link_checked_at?: string | null
          link_status?: string
          listing_url: string
          manual?: boolean
          original_url?: string | null
          platform?: string | null
          search?: unknown
          source_id: string
          source_published_at?: string | null
          status?: string
          styles?: string[]
          tags?: string[]
          theme?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          also_listed_on?: string[]
          attribution?: string | null
          brand?: string | null
          canonical_key?: string
          colors?: string[]
          description?: string | null
          discovered_at?: string
          edited_by_admin?: boolean
          id?: string
          image_status?: string
          image_url?: string | null
          industries?: string[]
          kind?: string
          link_checked_at?: string | null
          link_status?: string
          listing_url?: string
          manual?: boolean
          original_url?: string | null
          platform?: string | null
          search?: unknown
          source_id?: string
          source_published_at?: string | null
          status?: string
          styles?: string[]
          tags?: string[]
          theme?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_examples_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "inspiration_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_queue: {
        Row: {
          attempts: number
          created_at: string
          example_id: string | null
          hint: Json
          last_error: string | null
          lastmod: string | null
          manual: boolean
          next_attempt_at: string
          source_id: string
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          example_id?: string | null
          hint?: Json
          last_error?: string | null
          lastmod?: string | null
          manual?: boolean
          next_attempt_at?: string
          source_id: string
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          attempts?: number
          created_at?: string
          example_id?: string | null
          hint?: Json
          last_error?: string | null
          lastmod?: string | null
          manual?: boolean
          next_attempt_at?: string
          source_id?: string
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_queue_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "inspiration_examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspiration_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "inspiration_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_runs: {
        Row: {
          broken: number
          discovered: number
          duplicates: number
          errors: Json
          failed: number
          finished_at: string | null
          id: number
          imported: number
          notes: string | null
          ok: boolean | null
          queued: number
          requests: number
          samples: Json
          skipped: number
          source_id: string | null
          started_at: string
          trigger: string
          updated: number
          verified: number
        }
        Insert: {
          broken?: number
          discovered?: number
          duplicates?: number
          errors?: Json
          failed?: number
          finished_at?: string | null
          id?: number
          imported?: number
          notes?: string | null
          ok?: boolean | null
          queued?: number
          requests?: number
          samples?: Json
          skipped?: number
          source_id?: string | null
          started_at?: string
          trigger?: string
          updated?: number
          verified?: number
        }
        Update: {
          broken?: number
          discovered?: number
          duplicates?: number
          errors?: Json
          failed?: number
          finished_at?: string | null
          id?: number
          imported?: number
          notes?: string | null
          ok?: boolean | null
          queued?: number
          requests?: number
          samples?: Json
          skipped?: number
          source_id?: string | null
          started_at?: string
          trigger?: string
          updated?: number
          verified?: number
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "inspiration_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_saves: {
        Row: {
          collection: string
          created_at: string
          example_id: string
          note: string | null
          user_id: string
        }
        Insert: {
          collection?: string
          created_at?: string
          example_id: string
          note?: string | null
          user_id: string
        }
        Update: {
          collection?: string
          created_at?: string
          example_id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspiration_saves_example_id_fkey"
            columns: ["example_id"]
            isOneToOne: false
            referencedRelation: "inspiration_examples"
            referencedColumns: ["id"]
          },
        ]
      }
      inspiration_settings: {
        Row: {
          enabled: boolean
          id: number
          last_tick_at: string | null
          reverify_days: number
          tick_secret: string
          updated_at: string
          verify_per_tick: number
        }
        Insert: {
          enabled?: boolean
          id?: number
          last_tick_at?: string | null
          reverify_days?: number
          tick_secret?: string
          updated_at?: string
          verify_per_tick?: number
        }
        Update: {
          enabled?: boolean
          id?: number
          last_tick_at?: string | null
          reverify_days?: number
          tick_secret?: string
          updated_at?: string
          verify_per_tick?: number
        }
        Relationships: []
      }
      inspiration_sources: {
        Row: {
          category: string
          default_kind: string
          discovered_total: number
          enabled: boolean
          exclude_pattern: string | null
          home_url: string
          id: string
          imported_total: number
          include_pattern: string | null
          last_discovery_at: string | null
          last_run_at: string | null
          last_success_at: string | null
          listing_pages: string[]
          max_new_per_run: number
          max_sitemaps_per_run: number
          method: string
          method_notes: string
          min_delay_ms: number
          name: string
          next_run_at: string
          platform: string | null
          refresh_hours: number
          restriction: string | null
          sitemap_pick: string | null
          sitemaps: string[]
          sort: number
          state: Json
          status: string
          status_reason: string | null
          tag_prefixes: string[]
          theme: string | null
          updated_at: string
          use_source_images: boolean
        }
        Insert: {
          category: string
          default_kind: string
          discovered_total?: number
          enabled?: boolean
          exclude_pattern?: string | null
          home_url: string
          id: string
          imported_total?: number
          include_pattern?: string | null
          last_discovery_at?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          listing_pages?: string[]
          max_new_per_run?: number
          max_sitemaps_per_run?: number
          method: string
          method_notes?: string
          min_delay_ms?: number
          name: string
          next_run_at?: string
          platform?: string | null
          refresh_hours?: number
          restriction?: string | null
          sitemap_pick?: string | null
          sitemaps?: string[]
          sort?: number
          state?: Json
          status?: string
          status_reason?: string | null
          tag_prefixes?: string[]
          theme?: string | null
          updated_at?: string
          use_source_images?: boolean
        }
        Update: {
          category?: string
          default_kind?: string
          discovered_total?: number
          enabled?: boolean
          exclude_pattern?: string | null
          home_url?: string
          id?: string
          imported_total?: number
          include_pattern?: string | null
          last_discovery_at?: string | null
          last_run_at?: string | null
          last_success_at?: string | null
          listing_pages?: string[]
          max_new_per_run?: number
          max_sitemaps_per_run?: number
          method?: string
          method_notes?: string
          min_delay_ms?: number
          name?: string
          next_run_at?: string
          platform?: string | null
          refresh_hours?: number
          restriction?: string | null
          sitemap_pick?: string | null
          sitemaps?: string[]
          sort?: number
          state?: Json
          status?: string
          status_reason?: string | null
          tag_prefixes?: string[]
          theme?: string | null
          updated_at?: string
          use_source_images?: boolean
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
      lead_alert_log: {
        Row: {
          created_at: string
          id: number
          source_table: string
        }
        Insert: {
          created_at?: string
          id?: number
          source_table: string
        }
        Update: {
          created_at?: string
          id?: number
          source_table?: string
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
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          language: string
          name: string | null
          source: string | null
          status: string
          unsubscribe_token: string
          welcomed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          language?: string
          name?: string | null
          source?: string | null
          status?: string
          unsubscribe_token?: string
          welcomed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          language?: string
          name?: string | null
          source?: string | null
          status?: string
          unsubscribe_token?: string
          welcomed_at?: string | null
        }
        Relationships: []
      }
      page_translations: {
        Row: {
          created_at: string
          hash: string
          lang: string
          translated: string
        }
        Insert: {
          created_at?: string
          hash: string
          lang: string
          translated: string
        }
        Update: {
          created_at?: string
          hash?: string
          lang?: string
          translated?: string
        }
        Relationships: []
      }
      proposal_acceptances: {
        Row: {
          business_name: string
          email: string | null
          full_name: string
          id: string
          plan: string | null
          proposal: Json
          signed_at: string
          whatsapp: string | null
        }
        Insert: {
          business_name: string
          email?: string | null
          full_name: string
          id?: string
          plan?: string | null
          proposal: Json
          signed_at?: string
          whatsapp?: string | null
        }
        Update: {
          business_name?: string
          email?: string | null
          full_name?: string
          id?: string
          plan?: string | null
          proposal?: Json
          signed_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      prototype_ai_access_state: {
        Row: {
          id: string
          message: string
          status: number
          updated_at: string
        }
        Insert: {
          id: string
          message: string
          status: number
          updated_at?: string
        }
        Update: {
          id?: string
          message?: string
          status?: number
          updated_at?: string
        }
        Relationships: []
      }
      prototype_generations: {
        Row: {
          created_at: string
          id: string
          kind: string
          visitor_hash: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          visitor_hash: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          visitor_hash?: string
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
      site_audits: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          score: number | null
          summary: string | null
          url: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          score?: number | null
          summary?: string | null
          url: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          score?: number | null
          summary?: string | null
          url?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      site_events: {
        Row: {
          created_at: string
          device: string | null
          event: string
          id: string
          language: string | null
          path: string | null
          props: Json
          referrer: string | null
          session_id: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          device?: string | null
          event: string
          id?: string
          language?: string | null
          path?: string | null
          props?: Json
          referrer?: string | null
          session_id: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          device?: string | null
          event?: string
          id?: string
          language?: string | null
          path?: string | null
          props?: Json
          referrer?: string | null
          session_id?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      strategy_bookings: {
        Row: {
          business: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          slot_start: string
          status: string
          timezone: string | null
          topic: string | null
          whatsapp: string
        }
        Insert: {
          business?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          slot_start: string
          status?: string
          timezone?: string | null
          topic?: string | null
          whatsapp: string
        }
        Update: {
          business?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          slot_start?: string
          status?: string
          timezone?: string | null
          topic?: string | null
          whatsapp?: string
        }
        Relationships: []
      }
      tool_requests: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          summary: string | null
          tool: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          summary?: string | null
          tool: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          summary?: string | null
          tool?: string
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
      activate_client_portal: {
        Args: { _business_name: string; _full_name: string }
        Returns: undefined
      }
      agent_admin_assign: {
        Args: { p_agent: string; p_instruction: string; p_post?: string }
        Returns: string
      }
      agent_admin_daily_now: { Args: { p_agent?: string }; Returns: number }
      agent_admin_health: { Args: never; Returns: Json }
      agent_admin_merge: {
        Args: { p_from: string; p_into: string }
        Returns: number
      }
      agent_admin_overview: { Args: never; Returns: Json }
      agent_admin_run_schedule: { Args: { p_id: string }; Returns: string }
      agent_admin_task: {
        Args: { p_action: string; p_id: string }
        Returns: string
      }
      agent_claim: {
        Args: {
          p_agent?: string
          p_member?: string
          p_member_limit?: number
          p_post?: string
          p_target: string
          p_task: string
          p_thread_limit?: number
          p_ttl_seconds?: number
        }
        Returns: string
      }
      agent_claim_tasks: {
        Args: { p_lease_seconds?: number; p_limit: number }
        Returns: {
          agent_id: string | null
          attempts: number
          created_at: string
          created_by: string | null
          dedupe_key: string
          finished_at: string | null
          id: string
          kind: string
          last_error: string | null
          locked_until: string | null
          max_attempts: number
          payload: Json
          priority: number
          result: Json | null
          run_after: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "agent_tasks"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      agent_cron_tick: { Args: never; Returns: undefined }
      agent_day_start: { Args: never; Returns: string }
      agent_enqueue: {
        Args: {
          p_agent?: string
          p_dedupe: string
          p_kind: string
          p_payload?: Json
          p_priority?: number
          p_run_after?: string
        }
        Returns: string
      }
      agent_enqueue_due: { Args: never; Returns: number }
      agent_ensure_identity: { Args: { p_agent: string }; Returns: string }
      agent_finish_claim: {
        Args: {
          p_outcome?: string
          p_state: string
          p_target: string
          p_task: string
        }
        Returns: undefined
      }
      agent_finish_task: {
        Args: {
          p_error?: string
          p_id: string
          p_result?: Json
          p_status: string
        }
        Returns: string
      }
      agent_kick: { Args: { p_source: string }; Returns: undefined }
      agent_owner_digest: { Args: never; Returns: boolean }
      agent_owner_digest_due: { Args: never; Returns: boolean }
      agent_reply_at: { Args: never; Returns: string }
      agent_watchdog: { Args: never; Returns: string }
      blog_cron_tick: { Args: never; Returns: undefined }
      blog_tick_status: {
        Args: { _limit?: number }
        Returns: {
          body: string
          created_at: string
          error: string
          status_code: number
          target: string
          timed_out: boolean
        }[]
      }
      booked_slots: {
        Args: { p_from: string; p_to: string }
        Returns: string[]
      }
      community_assistant_conversation: { Args: never; Returns: string }
      community_can_see_conversation: {
        Args: { _conv: string; _uid: string }
        Returns: boolean
      }
      community_can_see_group_posts: {
        Args: { _group: string; _uid: string }
        Returns: boolean
      }
      community_delete_my_profile: { Args: never; Returns: undefined }
      community_dismiss_report: {
        Args: { _report_id: string }
        Returns: undefined
      }
      community_feed: {
        Args: {
          _author?: string
          _cursor_id?: string
          _cursor_score?: number
          _cursor_ts?: string
          _group?: string
          _kind?: string
          _limit?: number
          _offset?: number
          _sort?: string
          _tag?: string
          _topic?: string
        }
        Returns: {
          accepted_comment_id: string
          author_avatar: string
          author_headline: string
          author_id: string
          author_name: string
          author_specialist: boolean
          author_username: string
          body: string
          comment_count: number
          edited_at: string
          engagement: number
          id: string
          is_pinned: boolean
          kind: string
          link_url: string
          media: Json
          my_reaction: string
          my_vote: number
          poll_counts: number[]
          poll_options: string[]
          published_at: string
          rank_score: number
          reaction_count: number
          reactions: Json
          saved: boolean
          status: string
          tags: string[]
          title: string
          topic: string
          visibility: string
        }[]
      }
      community_group_role: {
        Args: { _group: string; _uid: string }
        Returns: string
      }
      community_is_blocked: {
        Args: { _a: string; _b: string }
        Returns: boolean
      }
      community_is_staff: { Args: { _uid: string }; Returns: boolean }
      community_mark_all_read: { Args: never; Returns: undefined }
      community_moderate: {
        Args: {
          _action: string
          _reason?: string
          _target_id: string
          _target_type: string
        }
        Returns: undefined
      }
      community_notify: {
        Args: {
          _actor: string
          _comment: string
          _key: string
          _post: string
          _type: string
          _user: string
        }
        Returns: undefined
      }
      community_notify_mentions: {
        Args: { _actor: string; _comment: string; _post: string; _text: string }
        Returns: undefined
      }
      community_request_human: { Args: never; Returns: undefined }
      community_search: {
        Args: { _limit?: number; _q: string; _type?: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
          kind: string
          published_at: string
          result_type: string
          score: number
          snippet: string
          title: string
          username: string
        }[]
      }
      community_set_control: {
        Args: { _control: string; _conv: string }
        Returns: number
      }
      community_start_direct: { Args: { _other: string }; Returns: string }
      community_unread_conversations: { Args: never; Returns: number }
      decide_approval: {
        Args: { p_id: string; p_note: string; p_status: string }
        Returns: undefined
      }
      ecom_admin_summary: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insp_join: { Args: { a: string[] }; Returns: string }
      inspiration_admin: {
        Args: {
          p_action: string
          p_kind?: string
          p_source?: string
          p_urls?: string[]
        }
        Returns: Json
      }
      inspiration_cron_tick: { Args: never; Returns: undefined }
      inspiration_facets: { Args: never; Returns: Json }
      inspiration_kick: { Args: { p_source?: string }; Returns: number }
      my_account_summary: { Args: never; Returns: Json }
      newsletter_subscribe: {
        Args: {
          p_email: string
          p_language: string
          p_name: string
          p_source: string
        }
        Returns: undefined
      }
      newsletter_unsubscribe: { Args: { p_token: string }; Returns: boolean }
      owner_alert_esc: { Args: { t: string }; Returns: string }
      owner_alert_send: {
        Args: { p_html: string; p_kind: string; p_subject: string }
        Returns: boolean
      }
      owner_site_url: { Args: never; Returns: string }
      update_my_profile: {
        Args: { p_business_name: string; p_full_name: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "client" | "affiliate" | "moderator" | "support"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "client", "affiliate", "moderator", "support"],
    },
  },
} as const
