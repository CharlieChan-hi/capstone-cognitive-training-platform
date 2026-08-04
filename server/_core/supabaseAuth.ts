import { createClient } from "@supabase/supabase-js";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

const supabase =
  ENV.supabaseUrl && ENV.supabaseServiceRoleKey
    ? createClient(ENV.supabaseUrl, ENV.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

function getBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice("Bearer ".length).trim();
  return token || null;
}

/** Resolve a Supabase Auth user and sync the app-owned profile row. */
export async function authenticateSupabaseRequest(req: Request): Promise<User | null> {
  if (!supabase) return null;

  const token = getBearerToken(req);
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;

  const authUser = data.user;
  const metadata = authUser.user_metadata ?? {};
  await db.upsertUser({
    openId: authUser.id,
    name:
      (typeof metadata.full_name === "string" && metadata.full_name) ||
      (typeof metadata.name === "string" && metadata.name) ||
      authUser.email ||
      authUser.id,
    email: authUser.email ?? null,
    loginMethod: "supabase",
    lastSignedIn: new Date(),
  });

  return (await db.getUserByOpenId(authUser.id)) ?? null;
}
