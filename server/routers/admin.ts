import { z } from "zod";
import { TRPCError } from "@trpc/server";
import bcrypt from "bcryptjs";
import { and, eq, gte, lt } from "drizzle-orm";
import { router, roleProcedure } from "../_core/trpc";
import { db, tables } from "../db";

export const adminRouter = router({
  // الطبيب يجلب ملفه الشخصي (لمعرفة doctorId الخاص به من الواجهة)
  getMyDoctorProfile: roleProcedure("doctor").query(async ({ ctx }) => {
    const doctor = await db.query.doctors.findFirst({ where: eq(tables.doctors.userId, ctx.user!.id) });
    if (!doctor) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد ملف طبيب مرتبط بحسابك" });
    return doctor;
  }),

  // قائمة كل الأطباء (لعرضهم في الفلاتر والإعدادات)
  listDoctors: roleProcedure("admin", "staff").query(async () => {
    return db.query.doctors.findMany({ with: { user: true, schedules: true } });
  }),

  // إنشاء حساب طبيب أو موظف من لوحة تحكم الأدمن
  createStaffAccount: roleProcedure("admin")
    .input(
      z.object({
        fullName: z.string().min(2),
        email: z.string().email(),
        phone: z.string().optional(),
        password: z.string().min(8),
        role: z.enum(["doctor", "staff", "admin"]),
        specialty: z.string().optional(), // مطلوب فقط للطبيب
        consultationFee: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const existing = await db.query.users.findFirst({ where: eq(tables.users.email, input.email) });
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "البريد الإلكتروني مستخدم مسبقًا" });

      const passwordHash = await bcrypt.hash(input.password, 10);
      const [user] = await db
        .insert(tables.users)
        .values({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone,
          passwordHash,
          role: input.role,
        })
        .returning();

      if (input.role === "doctor") {
        if (!input.specialty) throw new TRPCError({ code: "BAD_REQUEST", message: "التخصص مطلوب للطبيب" });
        await db.insert(tables.doctors).values({
          userId: user.id,
          specialty: input.specialty,
          consultationFee: input.consultationFee ?? 0,
        });
      }

      return { id: user.id, fullName: user.fullName, email: user.email, role: user.role };
    }),

  // تعريف جدول دوام الطبيب (أيام وأوقات العمل)
  setDoctorSchedule: roleProcedure("admin", "doctor")
    .input(
      z.object({
        doctorId: z.string(),
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        slotDurationMinutes: z.number().default(20),
      })
    )
    .mutation(async ({ input }) => {
      const [schedule] = await db
        .insert(tables.doctorSchedules)
        .values({
          doctorId: input.doctorId,
          dayOfWeek: input.dayOfWeek,
          startTime: input.startTime,
          endTime: input.endTime,
          slotDurationMinutes: input.slotDurationMinutes,
        })
        .returning();
      return schedule;
    }),

  listUsers: roleProcedure("admin").query(async () => {
    return db.query.users.findMany({ orderBy: (u, { desc }) => desc(u.createdAt) });
  }),

  updateUserStatus: roleProcedure("admin")
    .input(z.object({ userId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user!.id === input.userId && !input.isActive) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن تعطيل حسابك الحالي" });
      }

      const [updated] = await db
        .update(tables.users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(eq(tables.users.id, input.userId))
        .returning();

      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });
      return updated;
    }),

  // طابور اليوم لطبيب معيّن: كل من تم تسجيل وصوله وينتظر دوره
  getTodayQueue: roleProcedure("doctor", "staff", "admin")
    .input(z.object({ doctorId: z.string() }))
    .query(async ({ input }) => {
      const now = new Date();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);

      return db.query.appointments.findMany({
        where: and(
          eq(tables.appointments.doctorId, input.doctorId),
          gte(tables.appointments.scheduledAt, start),
          lt(tables.appointments.scheduledAt, end)
        ),
        with: { patient: { with: { user: true } } },
        orderBy: (a, { asc }) => asc(a.queuePosition),
      });
    }),

  // تسجيل وصول المريض للعيادة -> يدخل الطابور بترتيب تلقائي
  checkIn: roleProcedure("staff", "admin")
    .input(z.object({ appointmentId: z.string() }))
    .mutation(async ({ input }) => {
      const appointment = await db.query.appointments.findFirst({
        where: eq(tables.appointments.id, input.appointmentId),
      });
      if (!appointment) throw new TRPCError({ code: "NOT_FOUND", message: "الموعد غير موجود" });

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const alreadyCheckedIn = await db.query.appointments.findMany({
        where: and(
          eq(tables.appointments.doctorId, appointment.doctorId),
          eq(tables.appointments.status, "checked_in"),
          gte(tables.appointments.scheduledAt, start),
          lt(tables.appointments.scheduledAt, end)
        ),
      });

      const [updated] = await db
        .update(tables.appointments)
        .set({
          status: "checked_in",
          checkedInAt: new Date(),
          queuePosition: alreadyCheckedIn.length + 1,
          updatedAt: new Date(),
        })
        .where(eq(tables.appointments.id, input.appointmentId))
        .returning();

      return updated;
    }),
});
