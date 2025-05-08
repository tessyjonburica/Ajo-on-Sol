import { createClient } from "@supabase/supabase-js"
import type { Database } from "./schema"

// Create a Supabase client for client-side usage
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
)

// Create a Supabase client for server-side usage with service role
export function createServerSupabaseClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "")
}
