import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function getDevUser(): Promise<User | null> {
  const openId = "dev-user-local";
  let user = await db.getUserByOpenId(openId);
  if (!user) {
    await db.upsertUser({
      openId,
      name: "开发测试用户",
      email: "dev@localhost",
      role: process.env.DEV_ADMIN === "true" ? "admin" : "user",
      loginMethod: "local",
      lastSignedIn: new Date(),
    });
    user = await db.getUserByOpenId(openId);
  }
  return user ?? null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // In local development without OAuth, use an explicitly non-admin test user
  // by default. Set DEV_ADMIN=true only when an admin flow is being tested.
  const isLocalDevelopment =
    !ENV.isProduction && process.env.VERCEL !== "1" && !ENV.oAuthServerUrl;
  if (isLocalDevelopment) {
    user = await getDevUser();
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
