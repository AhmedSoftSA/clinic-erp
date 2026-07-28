import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure, roleProcedure } from "../_core/trpc";
import { db, tables } from "../db";

// إعداد فترة زمنية بداية/نهاية اليوم لفحص التعارض
function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export const appointmentsRouter = router({
  // 1. المريض يختار التخصص -> يعرض الأطباء المتاحين
  listDoctorsBySpecialty: publicProcedure
    .input(z.object({ specialty: z.string().optional() }))
    .query(async ({ input }) => {
      const rows = await db.query.doctors.findMany({
        where: input.specialty ? eq(tables.doctors.specialty, input.specialty) : undefined,
        with: { user: true, schedules: true },
      });
      return rows;
    }),

  // 2. عرض الفترات المتاحة ليوم معين عند طبيب معين
  getAvailableSlots: publicProcedure
    .input(z.object({ doctorId: z.string(), date: z.string() /* ISO date */ }))
    .query(async ({ input }) => {
      const date = new Date(input.date);
      const dayOfWeek = date.getDay();

      const schedule = await db.query.doctorSchedules.findFirst({
        where: and(
          eq(tables.doctorSchedules.doctorId, input.doctorId),
          eq(tables.doctorSchedules.dayOfWeek, dayOfWeek),
          eq(tables.doctorSchedules.isActive, true)
        ),
      });
      if (!schedule) return [];

      const { start, end } = dayBounds(date);
      const bookedAppointments = await db.query.appointments.findMany({
        where: and(
          eq(tables.appointments.doctorId, input.doctorId),
          gte(tables.appointments.scheduledAt, start),
          lt(tables.appointments.scheduledAt, end)
        ),
      });
      const bookedTimes = new Set(bookedAppointments.map((a) => a.scheduledAt.getTime()));

      // توليد كل الفترات بين بداية ونهاية الدوام حسب مدة الفترة
      const slots: string[] = [];
      const [startH, startM] = schedule.startTime.split(":").map(Number);
      const [endH, endM] = schedule.endTime.split(":").map(Number);
      const cursor = new Date(date);
      cursor.setHours(startH, startM, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(endH, endM, 0, 0);

      while (cursor < endTime) {
        if (!bookedTimes.has(cursor.getTime()) && cursor.getTime() > Date.now()) {
          slots.push(cursor.toISOString());
        }
        cursor.setMinutes(cursor.getMinutes() + schedule.slotDurationMinutes);
      }
      return slots;
    }),

  // 3-7. المريض يرسل طلب الحجز -> تحقق من التوفر -> إنشاء الموعد -> إشعار للمريض والطبيب
  book: roleProcedure("patient")
    .input(
      z.object({
        doctorId: z.string(),
        scheduledAt: z.string(), // ISO datetime
        reasonForVisit: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const patient = await db.query.patients.findFirst({ where: eq(tables.patients.userId, ctx.user!.id) });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الملف الشخصي للمريض" });

      const scheduledAt = new Date(input.scheduledAt);

      // 4. التحقق من توفر الفترة (لا يوجد حجز آخر لنفس الطبيب في نفس الوقت)
      const conflict = await db.query.appointments.findFirst({
        where: and(
          eq(tables.appointments.doctorId, input.doctorId),
          eq(tables.appointments.scheduledAt, scheduledAt)
        ),
      });
      if (conflict) {
        throw new TRPCError({ code: "CONFLICT", message: "هذه الفترة تم حجزها للتو، الرجاء اختيار فترة أخرى" });
      }

      // 5. إنشاء سجل الموعد
      const [appointment] = await db
        .insert(tables.appointments)
        .values({
          patientId: patient.id,
          doctorId: input.doctorId,
          scheduledAt,
          reasonForVisit: input.reasonForVisit,
          status: "confirmed",
        })
        .returning();

      const doctor = await db.query.doctors.findFirst({
        where: eq(tables.doctors.id, input.doctorId),
      });

      // 6. إشعار تأكيد للمريض
      await db.insert(tables.notifications).values({
        userId: ctx.user!.id,
        type: "appointment_confirmed",
        title: "تم تأكيد موعدك",
        body: `موعدك يوم ${scheduledAt.toLocaleString("ar-SA")} تم تأكيده.`,
      });

      // 7. إشعار للطبيب
      if (doctor) {
        await db.insert(tables.notifications).values({
          userId: doctor.userId,
          type: "appointment_confirmed",
          title: "موعد جديد",
          body: `لديك موعد جديد بتاريخ ${scheduledAt.toLocaleString("ar-SA")}.`,
        });
      }

      return appointment;
    }),

  // مواعيد المريض الحالي
  listMine: roleProcedure("patient").query(async ({ ctx }) => {
    const patient = await db.query.patients.findFirst({ where: eq(tables.patients.userId, ctx.user!.id) });
    if (!patient) return [];
    return db.query.appointments.findMany({
      where: eq(tables.appointments.patientId, patient.id),
      with: { doctor: { with: { user: true } } },
      orderBy: (a, { desc }) => desc(a.scheduledAt),
    });
  }),

  // مواعيد طبيب معين (للوحة التحكم)
  listForDoctor: roleProcedure("doctor", "admin", "staff")
    .input(z.object({ doctorId: z.string().optional(), date: z.string().optional() }))
    .query(async ({ input }) => {
      return db.query.appointments.findMany({
        where: input.doctorId ? eq(tables.appointments.doctorId, input.doctorId) : undefined,
        with: { patient: { with: { user: true } }, doctor: { with: { user: true } } },
        orderBy: (a, { asc }) => asc(a.scheduledAt),
      });
    }),

  // تحديث حالة الموعد (تسجيل وصول / إلغاء / بدء الفحص ...)
  updateStatus: roleProcedure("doctor", "admin", "staff")
    .input(
      z.object({
        appointmentId: z.string(),
        status: z.enum([
          "pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show",
        ]),
      })
    )
    .mutation(async ({ input }) => {
      const values: Record<string, unknown> = { status: input.status, updatedAt: new Date() };
      if (input.status === "checked_in") values.checkedInAt = new Date();

      const [updated] = await db
        .update(tables.appointments)
        .set(values)
        .where(eq(tables.appointments.id, input.appointmentId))
        .returning();
      return updated;
    }),

  // المريض يلغي موعده الخاص فقط
  cancelMine: roleProcedure("patient")
    .input(z.object({ appointmentId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const patient = await db.query.patients.findFirst({ where: eq(tables.patients.userId, ctx.user!.id) });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الملف الشخصي" });

      const appointment = await db.query.appointments.findFirst({
        where: eq(tables.appointments.id, input.appointmentId),
      });
      if (!appointment || appointment.patientId !== patient.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "لا يمكنك إلغاء موعد لا يخصك" });
      }
      if (!["pending", "confirmed"].includes(appointment.status)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "لا يمكن إلغاء هذا الموعد في حالته الحالية" });
      }

      const [updated] = await db
        .update(tables.appointments)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(tables.appointments.id, input.appointmentId))
        .returning();
      return updated;
    }),

  // المريض يطّلع على موقعه في طابور اليوم (إن كان بالطابور)
  getMyQueueStatus: roleProcedure("patient").query(async ({ ctx }) => {
    const patient = await db.query.patients.findFirst({ where: eq(tables.patients.userId, ctx.user!.id) });
    if (!patient) return null;

    const { start, end } = dayBounds(new Date());
    const todays = await db.query.appointments.findMany({
      where: and(
        eq(tables.appointments.patientId, patient.id),
        gte(tables.appointments.scheduledAt, start),
        lt(tables.appointments.scheduledAt, end)
      ),
      with: { doctor: { with: { user: true } } },
    });

    const mine = todays.find((a) => a.status === "checked_in" || a.status === "in_progress");
    if (!mine) return null;

    const doctorQueue = await db.query.appointments.findMany({
      where: and(
        eq(tables.appointments.doctorId, mine.doctorId),
        eq(tables.appointments.status, "checked_in"),
        gte(tables.appointments.scheduledAt, start),
        lt(tables.appointments.scheduledAt, end)
      ),
    });

    const ahead = doctorQueue.filter((a) => (a.queuePosition ?? 0) < (mine.queuePosition ?? 0)).length;

    return {
      appointmentId: mine.id,
      doctorName: mine.doctor?.user?.fullName,
      status: mine.status,
      queuePosition: mine.queuePosition,
      peopleAhead: ahead,
    };
  }),
});
