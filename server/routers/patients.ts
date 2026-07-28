import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, roleProcedure } from "../_core/trpc";
import { db, tables } from "../db";

export const patientsRouter = router({
  // قائمة كل المرضى (لطاقم العيادة)
  list: roleProcedure("admin", "staff", "doctor").query(async () => {
    return db.query.patients.findMany({ with: { user: true } });
  }),

  // 4. فتح ملف المريض الكامل (من عملية الفحص في الوثيقة)
  getFullFile: roleProcedure("admin", "staff", "doctor")
    .input(z.object({ patientId: z.string() }))
    .query(async ({ input }) => {
      const patient = await db.query.patients.findFirst({
        where: eq(tables.patients.id, input.patientId),
        with: { user: true },
      });
      if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "المريض غير موجود" });

      const [appointments, invoices] = await Promise.all([
        db.query.appointments.findMany({
          where: eq(tables.appointments.patientId, input.patientId),
          orderBy: (a, { desc }) => desc(a.scheduledAt),
        }),
        db.query.invoices.findMany({ where: eq(tables.invoices.patientId, input.patientId) }),
      ]);

      const consultations = await db.query.consultations.findMany({
        where: eq(tables.consultations.patientId, input.patientId),
        with: { prescriptions: true, reports: true },
        orderBy: (c, { desc }) => desc(c.createdAt),
      });

      return { patient, appointments, consultations, invoices };
    }),

  // ملفي الشخصي (للمريض نفسه)
  getMyProfile: roleProcedure("patient").query(async ({ ctx }) => {
    const patient = await db.query.patients.findFirst({
      where: eq(tables.patients.userId, ctx.user!.id),
      with: { user: true },
    });
    if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الملف" });
    return patient;
  }),

  // ملفي الطبي الكامل (للمريض نفسه: استشارات + وصفات + تقارير)
  getMyFullFile: roleProcedure("patient").query(async ({ ctx }) => {
    const patient = await db.query.patients.findFirst({
      where: eq(tables.patients.userId, ctx.user!.id),
      with: { user: true },
    });
    if (!patient) throw new TRPCError({ code: "NOT_FOUND", message: "لم يتم العثور على الملف" });

    const consultations = await db.query.consultations.findMany({
      where: eq(tables.consultations.patientId, patient.id),
      with: { prescriptions: true, reports: true },
      orderBy: (c, { desc }) => desc(c.createdAt),
    });

    return { patient, consultations };
  }),

  // تحديث البيانات الطبية الأساسية (حساسية / أمراض مزمنة ...)
  updateMedicalInfo: roleProcedure("patient", "doctor", "staff", "admin")
    .input(
      z.object({
        patientId: z.string(),
        bloodType: z.string().optional(),
        allergies: z.array(z.string()).optional(),
        chronicConditions: z.array(z.string()).optional(),
        emergencyContactName: z.string().optional(),
        emergencyContactPhone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { patientId, allergies, chronicConditions, ...rest } = input;
      const [updated] = await db
        .update(tables.patients)
        .set({
          ...rest,
          allergies: allergies ? JSON.stringify(allergies) : undefined,
          chronicConditions: chronicConditions ? JSON.stringify(chronicConditions) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(tables.patients.id, patientId))
        .returning();
      return updated;
    }),
});
