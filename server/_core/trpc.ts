// ==============================================================
// تهيئة tRPC - نقطة مركزية لتعريف أنواع الإجراءات (procedures)
// ==============================================================
import { initTRPC, TRPCError } from "@trpc/server";
import type { Context } from "./context";
import type { UserRole } from "../../shared/const";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

// إجراء عام: لا يتطلب تسجيل دخول (مثل: تسجيل حساب، عرض التخصصات)
export const publicProcedure = t.procedure;

// يتحقق من وجود جلسة صالحة
const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "يجب تسجيل الدخول أولاً" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

// يتحقق من الدور المسموح له بالوصول
export const roleProcedure = (...roles: UserRole[]) =>
  t.procedure.use(isAuthed).use(({ ctx, next }) => {
    if (!roles.includes(ctx.user!.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "ليست لديك صلاحية لهذا الإجراء" });
    }
    return next({ ctx });
  });
