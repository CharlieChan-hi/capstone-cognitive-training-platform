import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const publicAppUrl = import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/$/, "");

export const isSupabaseAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function warmSupabaseConnection(url: string | undefined) {
  if (typeof document === "undefined" || !url) return;

  try {
    const origin = new URL(url).origin;
    const hasPreconnect = Array.from(
      document.head.querySelectorAll('link[rel="preconnect"]')
    ).some((link) => link.getAttribute("href") === origin);

    if (!hasPreconnect) {
      const preconnect = document.createElement("link");
      preconnect.rel = "preconnect";
      preconnect.href = origin;
      preconnect.crossOrigin = "anonymous";
      document.head.appendChild(preconnect);
    }
  } catch {
    // An invalid or absent public URL is handled by the normal auth error UI.
  }
}

warmSupabaseConnection(supabaseUrl);

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
