import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import jwt from "jsonwebtoken";
import { env } from "./env";
import { readSessionCookie } from "./cookies";
import type { UserRole } from "../../shared/const";

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  fullName: string;
}

export function createContext({ req, res }: CreateExpressContextOptions) {
  let user: AuthUser | null = null;

  const token = readSessionCookie(req);
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser;
      user = payload;
    } catch {
      // توكن غير صالح أو منتهي - نتعامل معه كزائر غير مسجل
      user = null;
    }
  }

  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
