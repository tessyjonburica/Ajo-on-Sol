// This file defines the Supabase database schema types

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          privy_id: string
          wallet_address: string
          display_name: string | null
          email: string | null
          avatar_url: string | null
          is_premium: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          privy_id: string
          wallet_address: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          is_premium?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          privy_id?: string
          wallet_address?: string
          display_name?: string | null
          email?: string | null
          avatar_url?: string | null
          is_premium?: boolean
        }
      }
      pools: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          name: string
          description: string
          creator_id: string
          contribution_amount: number
          contribution_token: string
          contribution_token_symbol: string
          frequency: "daily" | "weekly" | "biweekly" | "monthly"
          total_members: number
          current_members: number
          start_date: string
          end_date: string
          next_payout_date: string
          next_payout_member_id: string | null
          total_contributed: number
          yield_enabled: boolean
          current_yield: number | null
          status: "pending" | "active" | "completed" | "cancelled"
          slug: string
          is_premium: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          name: string
          description: string
          creator_id: string
          contribution_amount: number
          contribution_token: string
          contribution_token_symbol: string
          frequency: "daily" | "weekly" | "biweekly" | "monthly"
          total_members: number
          current_members?: number
          start_date: string
          end_date: string
          next_payout_date?: string
          next_payout_member_id?: string | null
          total_contributed?: number
          yield_enabled?: boolean
          current_yield?: number | null
          status?: "pending" | "active" | "completed" | "cancelled"
          slug: string
          is_premium?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          name?: string
          description?: string
          creator_id?: string
          contribution_amount?: number
          contribution_token?: string
          contribution_token_symbol?: string
          frequency?: "daily" | "weekly" | "biweekly" | "monthly"
          total_members?: number
          current_members?: number
          start_date?: string
          end_date?: string
          next_payout_date?: string
          next_payout_member_id?: string | null
          total_contributed?: number
          yield_enabled?: boolean
          current_yield?: number | null
          status?: "pending" | "active" | "completed" | "cancelled"
          slug?: string
          is_premium?: boolean
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
          status: "active" | "removed" | "left"
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          pool_id: string
          user_id: string
          position?: number
          has_received_payout?: boolean
          total_contributed?: number
          last_contribution_date?: string | null
          status?: "active" | "removed" | "left"
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
          status?: "active" | "removed" | "left"
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
      proposals: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          pool_id: string
          proposer_id: string
          title: string
          description: string
          type: "payout_order" | "emergency_withdrawal" | "extend_pool" | "change_rules" | "remove_member"
          status: "active" | "passed" | "rejected" | "executed"
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
          type: "payout_order" | "emergency_withdrawal" | "extend_pool" | "change_rules" | "remove_member"
          status?: "active" | "passed" | "rejected" | "executed"
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
          type?: "payout_order" | "emergency_withdrawal" | "extend_pool" | "change_rules" | "remove_member"
          status?: "active" | "passed" | "rejected" | "executed"
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
          transaction_signature: string | null
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
          transaction_signature?: string | null
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
          transaction_signature?: string | null
        }
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
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"]
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"]
