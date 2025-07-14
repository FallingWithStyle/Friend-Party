import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

// Declare a global variable to hold the client instance.
// This is to ensure that the client is a singleton.
declare global {
  var supabase_client: SupabaseClient | undefined;
}

let supabase_client: SupabaseClient | undefined = global.supabase_client;

if (!supabase_client) {
  supabase_client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  global.supabase_client = supabase_client;
}

export const supabase = supabase_client;

// This function is kept for compatibility but now it will return the singleton.
export function createClient() {
  return supabase;
}