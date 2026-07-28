import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { setSessionCookie, clearSessionCookie } from "../_core/cookies";
import { env } from "../_core/env";
import { db, tables } from "../db";
import { eq } from "drizzle-orm";

const DEMO_PASSWORD = "admin12345";
const DEMO_ACCOUNTS = {
  admin: { fullName: "مدير النظام", email: "admin@clinic.com", phone: "0501000001" },
  doctor: { fullName: "د. سارة الأحمد", email: "doctor@clinic.com", phone: "0501000002" },
  staff: { fullName: "موظف الاستقبال", email: "staff@clinic.com", phone: "0501000003" },
  patient: { fullName: "محمد المريض", email: "patient@clinic.com", phone: "0501000004" },
} as const;

function signToken(user: { id: string; role: string; email: string; fullName: string }) {
  return jwt.sign(user, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
}

async function ensureDemoUser(role: keyof typeof DEMO_ACCOUNTS) {
  const account = DEMO_ACCOUNTS[role];
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const existing = await db.query.users.findFirst({ where: eq(tables.users.email, account.email) });

  if (existing) {
    const [user] = await db
      .update(tables.users)
      .set({
        fullName: account.fullName,
        phone: account.phone,
        passwordHash,
        role,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(tables.users.id, existing.id))
      .returning();
    return user;
  }

  const [user] = await db
    .insert(tables.users)
    .values({
      fullName: account.fullName,
      email: account.email,
      phone: account.phone,
      passwordHash,
      role,
      isActive: true,
    })
    .returning();

  if (role === "patient") {
    await db.insert(tables.patients).values({
      userId: user.id,
      nationalId: "1000000001",
      gender: "male",
      bloodType: "O+",
      allergies: JSON.stringify(["حساسية موسمية"]),
      chronicConditions: JSON.stringify(["ضغط خفيف"]),
      emergencyContactName: "جهة اتصال تجريبية",
      emergencyContactPhone: "0500000000",
    });
  }

  if (role === "doctor") {
    const [doctor] = await db.insert(tables.doctors).values({
      userId: user.id,
      specialty: "طب عام",
      licenseNumber: "LIC-DEMO-001",
      bio: "طبيبة تجريبية لاختبار المواعيد والملف الطبي.",
      consultationFee: 150,
    }).returning();

    for (const dayOfWeek of [0, 1, 2, 3, 4]) {
      await db.insert(tables.doctorSchedules).values({
        doctorId: doctor.id,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
        slotDurationMinutes: 30,
      });
    }
  }

  return user;
}

export const authRouter = router({
  // تسجيل مريض جديد عبر تطبيق المريض
  registerPatient: publicProcedure
    .input(
      z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().min(8),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await db.query.users.findFirst({ where: eq(tables.users.email, input.email) });
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "البريد الإلكتروني مستخدم مسبقًا" });
      }

      const passwordHash = await bcrypt.hash(input.password, 10);
      const [user] = await db
        .insert(tables.users)
        .values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: "patient",
        })
        .returning();

      await db.insert(tables.patients).values({ userId: user.id });

      const token = signToken({ id: user.id, role: user.role, email: user.email, fullName: user.fullName });
      setSessionCookie(ctx.res, token);

      return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
    }),

  // دخول موحّد لكل الأدوار (مريض / طبيب / موظف / أدمن)
  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const user = await db.query.users.findFirst({ where: eq(tables.users.email, input.email) });
      if (!user || !user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" });
      }
      if (!user.isActive) {
        throw new TRPCError({ code: "FORBIDDEN", message: "الحساب غير مفعّل، تواصل مع الإدارة" });
      }

      const token = signToken({ id: user.id, role: user.role, email: user.email, fullName: user.fullName });
      setSessionCookie(ctx.res, token);

      return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
    }),

  demoLogin: publicProcedure
    .input(z.object({ role: z.enum(["admin", "doctor", "staff", "patient"]) }))
    .mutation(async ({ input, ctx }) => {
      const user = await ensureDemoUser(input.role);
      const token = signToken({ id: user.id, role: user.role, email: user.email, fullName: user.fullName });
      setSessionCookie(ctx.res, token);
      return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
    }),

  logout: protectedProcedure.mutation(({ ctx }) => {
    clearSessionCookie(ctx.res);
    return { success: true };
  }),

  me: publicProcedure.query(({ ctx }) => {
    return ctx.user; // null إذا لم يكن مسجّل الدخول
  }),
});
