import type { Response, Request } from "express";
import { env } from "./env";

const isProd = env.NODE_ENV === "production";

export function setSessionCookie(res: Response, token: string) {
  res.cookie(env.COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  res.clearCookie(env.COOKIE_NAME, { path: "/" });
}

export function readSessionCookie(req: Request): string | undefined {
  return req.cookies?.[env.COOKIE_NAME];
}
