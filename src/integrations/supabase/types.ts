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
          flagged_reason: string | null
          id: string
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
          flagged_reason?: string | null
          id?: string
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
          flagged_reason?: string | null
          id?: string
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
      dao_treasury: {
        Row: {
          balance: number
          id: string
          last_update: string
          total_distributed: number
          total_received: number
        }
        Insert: {
          balance?: number
          id?: string
          last_update?: string
          total_distributed?: number
          total_received?: number
        }
        Update: {
          balance?: number
          id?: string
          last_update?: string
          total_distributed?: number
          total_received?: number
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
