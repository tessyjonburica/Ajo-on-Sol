export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      pools: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string | null
          slug: string
          creator_id: string
          start_date: string
          end_date: string | null
          frequency: "weekly" | "biweekly" | "monthly"
          contribution_amount: number
          contribution_token: string
          contribution_token_symbol: string
          total_members: number
          current_members: number
          total_contributed: number
          next_payout_date: string
          next_payout_member_id: string | null
          yield_enabled: boolean
          status: "pending" | "active" | "completed" | "cancelled"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description?: string | null
          slug?: string
          creator_id: string
          start_date: string
          end_date?: string | null
          frequency: "weekly" | "biweekly" | "monthly"
          contribution_amount: number
          contribution_token: string
          contribution_token_symbol: string
          total_members: number
          current_members?: number
          total_contributed?: number
          next_payout_date?: string
          next_payout_member_id?: string | null
          yield_enabled?: boolean
          status?: "pending" | "active" | "completed" | "cancelled"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string | null
          slug?: string
          creator_id?: string
          start_date?: string
          end_date?: string | null
          frequency?: "weekly" | "biweekly" | "monthly"
          contribution_amount?: number
          contribution_token?: string
          contribution_token_symbol?: string
          total_members?: number
          current_members?: number
          total_contributed?: number
          next_payout_date?: string
          next_payout_member_id?: string | null
          yield_enabled?: boolean
          status?: "pending" | "active" | "completed" | "cancelled"
        }
      }
      pool_members: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          user_id: string
          position: number
          has_received_payout: boolean
          total_contributed: number
          last_contribution_date: string | null
          status: "pending" | "active" | "removed"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          user_id: string
          position: number
          has_received_payout?: boolean
          total_contributed?: number
          last_contribution_date?: string | null
          status?: "pending" | "active" | "removed"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          user_id?: string
          position?: number
          has_received_payout?: boolean
          total_contributed?: number
          last_contribution_date?: string | null
          status?: "pending" | "active" | "removed"
        }
      }
      contributions: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          user_id: string
          amount: number
          token: string
          token_symbol: string
          transaction_signature: string
          status: "pending" | "confirmed" | "failed"
          is_late: boolean
          penalty_amount: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          user_id: string
          amount: number
          token: string
          token_symbol: string
          transaction_signature: string
          status?: "pending" | "confirmed" | "failed"
          is_late?: boolean
          penalty_amount?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          user_id?: string
          amount?: number
          token?: string
          token_symbol?: string
          transaction_signature?: string
          status?: "pending" | "confirmed" | "failed"
          is_late?: boolean
          penalty_amount?: number | null
        }
      }
      payouts: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          recipient_id: string
          amount: number
          token: string
          token_symbol: string
          transaction_signature: string
          status: "pending" | "confirmed" | "failed"
          payout_date: string
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          recipient_id: string
          amount: number
          token: string
          token_symbol: string
          transaction_signature: string
          status?: "pending" | "confirmed" | "failed"
          payout_date: string
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          recipient_id?: string
          amount?: number
          token?: string
          token_symbol?: string
          transaction_signature?: string
          status?: "pending" | "confirmed" | "failed"
          payout_date?: string
        }
      }
      penalties: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          user_id: string
          amount: number
          token: string
          token_symbol: string
          reason: "late_contribution" | "missed_contribution" | "other"
          status: "pending" | "paid" | "waived"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          user_id: string
          amount: number
          token: string
          token_symbol: string
          reason: "late_contribution" | "missed_contribution" | "other"
          status?: "pending" | "paid" | "waived"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          user_id?: string
          amount?: number
          token?: string
          token_symbol?: string
          reason?: "late_contribution" | "missed_contribution" | "other"
          status?: "pending" | "paid" | "waived"
        }
      }
      proposals: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          proposer_id: string
          title: string
          description: string
          type: "payout_order" | "emergency_withdrawal" | "extend_pool" | "remove_member" | "change_rules"
          status: "active" | "executed" | "rejected" | "cancelled"
          ends_at: string
          execution_data: Json | null
          target_user_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          proposer_id: string
          title: string
          description: string
          type: "payout_order" | "emergency_withdrawal" | "extend_pool" | "remove_member" | "change_rules"
          status?: "active" | "executed" | "rejected" | "cancelled"
          ends_at: string
          execution_data?: Json | null
          target_user_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id?: string
          proposer_id?: string
          title?: string
          description?: string
          type?: "payout_order" | "emergency_withdrawal" | "extend_pool" | "remove_member" | "change_rules"
          status?: "active" | "executed" | "rejected" | "cancelled"
          ends_at?: string
          execution_data?: Json | null
          target_user_id?: string | null
        }
      }
      votes: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          proposal_id: string
          user_id: string
          vote: "yes" | "no" | "abstain"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          proposal_id: string
          user_id: string
          vote: "yes" | "no" | "abstain"
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          proposal_id?: string
          user_id?: string
          vote?: "yes" | "no" | "abstain"
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          privy_id: string
          display_name: string | null
          wallet_address: string | null
          avatar_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          privy_id: string
          display_name?: string | null
          wallet_address?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          privy_id?: string
          display_name?: string | null
          wallet_address?: string | null
          avatar_url?: string | null
        }
      }
    }
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
