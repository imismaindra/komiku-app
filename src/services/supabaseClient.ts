import { createClient } from '@supabase/supabase-js';

// Read configuration from environment variables.
// In Expo, EXPO_PUBLIC_* variables are exposed to the client bundle.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey;

// Only initialize if we have the variables, otherwise we will run in Simulation Mode.
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase credentials not found. Notifications will run in Simulation Mode.\n' +
    'To use a live Supabase DB, add these to your .env file:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key'
  );
}
