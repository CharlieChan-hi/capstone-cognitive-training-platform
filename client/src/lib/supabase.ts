import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "");

export const isSupabaseAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const getAuthRedirectUrl = () =>
  `${publicAppUrl || window.location.origin}/login`;

export const supabase = isSupabaseAuthConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
