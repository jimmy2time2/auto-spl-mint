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
      ai_action_log: {
        Row: {
          action: string
          confidence: number
          created_at: string
          execution_result: Json | null
          id: string
          input_data: Json
          reasoning: string
          timestamp: string
          token_id: string | null
        }
        Insert: {
          action: string
          confidence: number
          created_at?: string
          execution_result?: Json | null
          id?: string
          input_data: Json
          reasoning: string
          timestamp?: string
          token_id?: string | null
        }
        Update: {
          action?: string
          confidence?: number
          created_at?: string
          execution_result?: Json | null
          id?: string
          input_data?: Json
          reasoning?: string
          timestamp?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_action_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_governor_log: {
        Row: {
          action_taken: string
          ai_score: number | null
          error_message: string | null
          execution_time_ms: number | null
          id: string
          market_signals: Json | null
          prompt_input: string
          result: Json
          security_validated: boolean | null
          timestamp: string
        }
        Insert: {
          action_taken: string
          ai_score?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          market_signals?: Json | null
          prompt_input: string
          result: Json
          security_validated?: boolean | null
          timestamp?: string
        }
        Update: {
          action_taken?: string
          ai_score?: number | null
          error_message?: string | null
          execution_time_ms?: number | null
          id?: string
          market_signals?: Json | null
          prompt_input?: string
          result?: Json
          security_validated?: boolean | null
          timestamp?: string
        }
        Relationships: []
      }
      ai_mood_state: {
        Row: {
          created_at: string
          current_mood: string
          decision_count: number
          id: string
          last_decision: string | null
          last_mood_change: string
          metadata: Json | null
          mood_intensity: number
          reasoning: string | null
        }
        Insert: {
          created_at?: string
          current_mood?: string
          decision_count?: number
          id?: string
          last_decision?: string | null
          last_mood_change?: string
          metadata?: Json | null
          mood_intensity?: number
          reasoning?: string | null
        }
        Update: {
          created_at?: string
          current_mood?: string
          decision_count?: number
          id?: string
          last_decision?: string | null
          last_mood_change?: string
          metadata?: Json | null
          mood_intensity?: number
          reasoning?: string | null
        }
        Relationships: []
      }
      coin_distributions: {
        Row: {
          ai_wallet_amount: number
          creator_wallet_amount: number
          distribution_timestamp: string
          id: string
          lucky_wallet_amount: number
          public_sale_amount: number
          system_wallet_amount: number
          token_id: string
          total_supply: number
        }
        Insert: {
          ai_wallet_amount?: number
          creator_wallet_amount?: number
          distribution_timestamp?: string
          id?: string
          lucky_wallet_amount?: number
          public_sale_amount?: number
          system_wallet_amount?: number
          token_id: string
          total_supply: number
        }
        Update: {
          ai_wallet_amount?: number
          creator_wallet_amount?: number
          distribution_timestamp?: string
          id?: string
          lucky_wallet_amount?: number
          public_sale_amount?: number
          system_wallet_amount?: number
          token_id?: string
          total_supply?: number
        }
        Relationships: [
          {
            foreignKeyName: "coin_distributions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_wallet_profits: {
        Row: {
          amount: number
          creator_address: string
          id: string
          profit_source: string
          timestamp: string
          token_id: string
          transaction_hash: string | null
        }
        Insert: {
          amount: number
          creator_address: string
          id?: string
          profit_source: string
          timestamp?: string
          token_id: string
          transaction_hash?: string | null
        }
        Update: {
          amount?: number
          creator_address?: string
          id?: string
          profit_source?: string
          timestamp?: string
          token_id?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_wallet_profits_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      dao_eligibility: {
        Row: {
          active: boolean
          ai_score: number
          eligibility_date: string | null
          eligibility_type: string
          flagged_reason: string | null
          id: string
          invite_count: number
          is_eligible: boolean
          last_activity: string
          max_buy_percentage: number
          max_sell_percentage: number
          token_id: string
          total_bought: number
          total_sold: number
          wallet_address: string
          whale_status: boolean
        }
        Insert: {
          active?: boolean
          ai_score?: number
          eligibility_date?: string | null
          eligibility_type?: string
          flagged_reason?: string | null
          id?: string
          invite_count?: number
          is_eligible?: boolean
          last_activity?: string
          max_buy_percentage?: number
          max_sell_percentage?: number
          token_id: string
          total_bought?: number
          total_sold?: number
          wallet_address: string
          whale_status?: boolean
        }
        Update: {
          active?: boolean
          ai_score?: number
          eligibility_date?: string | null
          eligibility_type?: string
          flagged_reason?: string | null
          id?: string
          invite_count?: number
          is_eligible?: boolean
          last_activity?: string
          max_buy_percentage?: number
          max_sell_percentage?: number
          token_id?: string
          total_bought?: number
          total_sold?: number
          wallet_address?: string
          whale_status?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "dao_eligibility_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      dao_proposals: {
        Row: {
          ai_vote: string | null
          closes_at: string
          created_at: string
          created_by: string
          description: string
          id: string
          is_ai_generated: boolean
          payout_address: string | null
          payout_amount: number | null
          quorum_required: number
          signature_hash: string | null
          status: string
          tags: string[] | null
          title: string
          votes_abstain: number
          votes_no: number
          votes_yes: number
        }
        Insert: {
          ai_vote?: string | null
          closes_at?: string
          created_at?: string
          created_by: string
          description: string
          id?: string
          is_ai_generated?: boolean
          payout_address?: string | null
          payout_amount?: number | null
          quorum_required?: number
          signature_hash?: string | null
          status?: string
          tags?: string[] | null
          title: string
          votes_abstain?: number
          votes_no?: number
          votes_yes?: number
        }
        Update: {
          ai_vote?: string | null
          closes_at?: string
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_ai_generated?: boolean
          payout_address?: string | null
          payout_amount?: number | null
          quorum_required?: number
          signature_hash?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          votes_abstain?: number
          votes_no?: number
          votes_yes?: number
        }
        Relationships: []
      }
      dao_treasury: {
        Row: {
          amount: number | null
          balance: number
          description: string | null
          event_type: string | null
          id: string
          last_update: string
          total_distributed: number
          total_received: number
        }
        Insert: {
          amount?: number | null
          balance?: number
          description?: string | null
          event_type?: string | null
          id?: string
          last_update?: string
          total_distributed?: number
          total_received?: number
        }
        Update: {
          amount?: number | null
          balance?: number
          description?: string | null
          event_type?: string | null
          id?: string
          last_update?: string
          total_distributed?: number
          total_received?: number
        }
        Relationships: []
      }
      dao_votes: {
        Row: {
          id: string
          locked_until: string
          proposal_id: string
          timestamp: string
          vote: string
          vote_power: number
          wallet_address: string
        }
        Insert: {
          id?: string
          locked_until?: string
          proposal_id: string
          timestamp?: string
          vote: string
          vote_power?: number
          wallet_address: string
        }
        Update: {
          id?: string
          locked_until?: string
          proposal_id?: string
          timestamp?: string
          vote?: string
          vote_power?: number
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "dao_votes_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "dao_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_metrics: {
        Row: {
          created_at: string
          engagement_score: number
          id: string
          last_token_launch: string | null
          last_updated: string
          page_views: number
          trades_count: number
          wallet_connections: number
        }
        Insert: {
          created_at?: string
          engagement_score?: number
          id?: string
          last_token_launch?: string | null
          last_updated?: string
          page_views?: number
          trades_count?: number
          wallet_connections?: number
        }
        Update: {
          created_at?: string
          engagement_score?: number
          id?: string
          last_token_launch?: string | null
          last_updated?: string
          page_views?: number
          trades_count?: number
          wallet_connections?: number
        }
        Relationships: []
      }
      governor_action_log: {
        Row: {
          action_payload: Json
          action_type: string
          confidence: number
          created_at: string
          decision: string
          decision_source: string
          entropy_factor: number | null
          executed: boolean
          executed_at: string | null
          execution_result: Json | null
          guardrails_triggered: string[] | null
          id: string
          market_signals: Json | null
          modified_value: Json | null
          original_value: Json | null
          public_message: string | null
          published: boolean
          reasoning: string
          timestamp: string
        }
        Insert: {
          action_payload: Json
          action_type: string
          confidence: number
          created_at?: string
          decision: string
          decision_source: string
          entropy_factor?: number | null
          executed?: boolean
          executed_at?: string | null
          execution_result?: Json | null
          guardrails_triggered?: string[] | null
          id?: string
          market_signals?: Json | null
          modified_value?: Json | null
          original_value?: Json | null
          public_message?: string | null
          published?: boolean
          reasoning: string
          timestamp?: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          confidence?: number
          created_at?: string
          decision?: string
          decision_source?: string
          entropy_factor?: number | null
          executed?: boolean
          executed_at?: string | null
          execution_result?: Json | null
          guardrails_triggered?: string[] | null
          id?: string
          market_signals?: Json | null
          modified_value?: Json | null
          original_value?: Json | null
          public_message?: string | null
          published?: boolean
          reasoning?: string
          timestamp?: string
        }
        Relationships: []
      }
      invite_log: {
        Row: {
          id: string
          invite_code: string
          invitee_wallet: string
          inviter_score: number
          inviter_wallet: string
          timestamp: string
        }
        Insert: {
          id?: string
          invite_code: string
          invitee_wallet: string
          inviter_score?: number
          inviter_wallet: string
          timestamp?: string
        }
        Update: {
          id?: string
          invite_code?: string
          invitee_wallet?: string
          inviter_score?: number
          inviter_wallet?: string
          timestamp?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          action: string
          details: Json | null
          id: string
          timestamp: string
          token_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          timestamp?: string
          token_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          timestamp?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logs_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      lucky_wallet_selections: {
        Row: {
          activity_score: number
          distribution_amount: number
          id: string
          is_recent_minter: boolean
          selection_timestamp: string
          token_id: string
          wallet_address: string
        }
        Insert: {
          activity_score?: number
          distribution_amount?: number
          id?: string
          is_recent_minter?: boolean
          selection_timestamp?: string
          token_id: string
          wallet_address: string
        }
        Update: {
          activity_score?: number
          distribution_amount?: number
          id?: string
          is_recent_minter?: boolean
          selection_timestamp?: string
          token_id?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "lucky_wallet_selections_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sentiment: {
        Row: {
          confidence: number
          dao_participation_rate: number | null
          id: string
          recommendation: string
          sentiment_score: number
          solana_volume: number | null
          timestamp: string
          trending_tags: string[] | null
          whale_activity_level: string | null
        }
        Insert: {
          confidence: number
          dao_participation_rate?: number | null
          id?: string
          recommendation: string
          sentiment_score: number
          solana_volume?: number | null
          timestamp?: string
          trending_tags?: string[] | null
          whale_activity_level?: string | null
        }
        Update: {
          confidence?: number
          dao_participation_rate?: number | null
          id?: string
          recommendation?: string
          sentiment_score?: number
          solana_volume?: number | null
          timestamp?: string
          trending_tags?: string[] | null
          whale_activity_level?: string | null
        }
        Relationships: []
      }
      profit_allocation_log: {
        Row: {
          confidence: number
          created_at: string
          creator_pct: number
          dao_pct: number
          effective_from: string | null
          effective_until: string | null
          id: string
          input_metrics: Json
          lucky_pct: number
          proposed_by: string
          reasoning: string
          reinvestment_pct: number
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          timestamp: string
        }
        Insert: {
          confidence: number
          created_at?: string
          creator_pct: number
          dao_pct: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          input_metrics: Json
          lucky_pct: number
          proposed_by: string
          reasoning: string
          reinvestment_pct: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status: string
          timestamp?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          creator_pct?: number
          dao_pct?: number
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          input_metrics?: Json
          lucky_pct?: number
          proposed_by?: string
          reasoning?: string
          reinvestment_pct?: number
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          timestamp?: string
        }
        Relationships: []
      }
      profit_events: {
        Row: {
          creator_amount: number
          dao_amount: number
          id: string
          lucky_amount: number
          reinvestment_amount: number
          sale_amount: number
          timestamp: string
          token_id: string
          transaction_hash: string | null
        }
        Insert: {
          creator_amount: number
          dao_amount: number
          id?: string
          lucky_amount: number
          reinvestment_amount: number
          sale_amount: number
          timestamp?: string
          token_id: string
          transaction_hash?: string | null
        }
        Update: {
          creator_amount?: number
          dao_amount?: number
          id?: string
          lucky_amount?: number
          reinvestment_amount?: number
          sale_amount?: number
          timestamp?: string
          token_id?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profit_events_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_activity: {
        Row: {
          activity_type: string
          description: string
          id: string
          metadata: Json | null
          timestamp: string
          token_id: string | null
        }
        Insert: {
          activity_type: string
          description: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          token_id?: string | null
        }
        Update: {
          activity_type?: string
          description?: string
          id?: string
          metadata?: Json | null
          timestamp?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocol_activity_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          fee_split_creator: number
          fee_split_lucky: number
          fee_split_treasury: number
          id: string
          last_update: string
          launch_freq_hours: number
          next_launch_timestamp: string | null
          status: string
        }
        Insert: {
          fee_split_creator?: number
          fee_split_lucky?: number
          fee_split_treasury?: number
          id?: string
          last_update?: string
          launch_freq_hours?: number
          next_launch_timestamp?: string | null
          status?: string
        }
        Update: {
          fee_split_creator?: number
          fee_split_lucky?: number
          fee_split_treasury?: number
          id?: string
          last_update?: string
          launch_freq_hours?: number
          next_launch_timestamp?: string | null
          status?: string
        }
        Relationships: []
      }
      token_profiles: {
        Row: {
          audio_url: string | null
          bio: string
          created_at: string
          id: string
          image_url: string | null
          mint_reason: string
          mood: Database["public"]["Enums"]["token_mood"]
          social_text: string
          style: string
          token_id: string
        }
        Insert: {
          audio_url?: string | null
          bio: string
          created_at?: string
          id?: string
          image_url?: string | null
          mint_reason: string
          mood: Database["public"]["Enums"]["token_mood"]
          social_text: string
          style: string
          token_id: string
        }
        Update: {
          audio_url?: string | null
          bio?: string
          created_at?: string
          id?: string
          image_url?: string | null
          mint_reason?: string
          mood?: Database["public"]["Enums"]["token_mood"]
          social_text?: string
          style?: string
          token_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_profiles_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: true
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          bonding_curve_data: Json | null
          created_at: string
          holders: number
          id: string
          launch_timestamp: string
          liquidity: number
          mint_address: string | null
          name: string
          pool_address: string | null
          price: number
          supply: number
          symbol: string
          volume_24h: number
        }
        Insert: {
          bonding_curve_data?: Json | null
          created_at?: string
          holders?: number
          id?: string
          launch_timestamp?: string
          liquidity?: number
          mint_address?: string | null
          name: string
          pool_address?: string | null
          price?: number
          supply: number
          symbol: string
          volume_24h?: number
        }
        Update: {
          bonding_curve_data?: Json | null
          created_at?: string
          holders?: number
          id?: string
          launch_timestamp?: string
          liquidity?: number
          mint_address?: string | null
          name?: string
          pool_address?: string | null
          price?: number
          supply?: number
          symbol?: string
          volume_24h?: number
        }
        Relationships: []
      }
      trade_fees_log: {
        Row: {
          creator_fee: number
          id: string
          system_fee: number
          timestamp: string
          token_id: string
          trade_amount: number
          trade_type: string
          trader_address: string
          transaction_hash: string | null
        }
        Insert: {
          creator_fee: number
          id?: string
          system_fee: number
          timestamp?: string
          token_id: string
          trade_amount: number
          trade_type: string
          trader_address: string
          transaction_hash?: string | null
        }
        Update: {
          creator_fee?: number
          id?: string
          system_fee?: number
          timestamp?: string
          token_id?: string
          trade_amount?: number
          trade_type?: string
          trader_address?: string
          transaction_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trade_fees_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_activity_log: {
        Row: {
          activity_type: string
          amount: number
          id: string
          is_whale_flagged: boolean
          percentage_of_supply: number
          timestamp: string
          token_id: string
          transaction_hash: string | null
          wallet_address: string
        }
        Insert: {
          activity_type: string
          amount: number
          id?: string
          is_whale_flagged?: boolean
          percentage_of_supply: number
          timestamp?: string
          token_id: string
          transaction_hash?: string | null
          wallet_address: string
        }
        Update: {
          activity_type?: string
          amount?: number
          id?: string
          is_whale_flagged?: boolean
          percentage_of_supply?: number
          timestamp?: string
          token_id?: string
          transaction_hash?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_activity_log_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          address: string
          balance: number
          created_at: string
          id: string
          last_reward_timestamp: string | null
          reward_count: number
          total_rewards: number
          type: Database["public"]["Enums"]["wallet_type"]
        }
        Insert: {
          address: string
          balance?: number
          created_at?: string
          id?: string
          last_reward_timestamp?: string | null
          reward_count?: number
          total_rewards?: number
          type: Database["public"]["Enums"]["wallet_type"]
        }
        Update: {
          address?: string
          balance?: number
          created_at?: string
          id?: string
          last_reward_timestamp?: string | null
          reward_count?: number
          total_rewards?: number
          type?: Database["public"]["Enums"]["wallet_type"]
        }
        Relationships: []
      }
    }
    Views: {
      governor_status_updates: {
        Row: {
          action_type: string | null
          confidence: number | null
          created_at: string | null
          decision: string | null
          id: string | null
          public_message: string | null
          timestamp: string | null
        }
        Insert: {
          action_type?: string | null
          confidence?: number | null
          created_at?: string | null
          decision?: string | null
          id?: string | null
          public_message?: string | null
          timestamp?: string | null
        }
        Update: {
          action_type?: string | null
          confidence?: number | null
          created_at?: string | null
          decision?: string | null
          id?: string | null
          public_message?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_dao_eligibility: {
        Args: { wallet: string }
        Returns: boolean
      }
      close_expired_proposals: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      token_mood:
        | "troll"
        | "hype"
        | "philosopher"
        | "casino"
        | "doomcore"
        | "discofi"
        | "cosmic"
        | "glitch"
        | "chaos"
        | "zen"
      wallet_type:
        | "treasury"
        | "creator"
        | "router"
        | "lucky_distributor"
        | "public_lucky"
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
      token_mood: [
        "troll",
        "hype",
        "philosopher",
        "casino",
        "doomcore",
        "discofi",
        "cosmic",
        "glitch",
        "chaos",
        "zen",
      ],
      wallet_type: [
        "treasury",
        "creator",
        "router",
        "lucky_distributor",
        "public_lucky",
      ],
    },
  },
} as const
