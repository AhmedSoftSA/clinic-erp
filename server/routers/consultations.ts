import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, roleProcedure } from "../_core/trpc";
import { db, tables } from "../db";

export const consultationsRouter = router({
  // 5. الطبيب يسجل الفحص والتشخيص (يبدأ الاستشارة من موعد قائم)
  start: roleProcedure("doctor")
    .input(
      z.object({
        appointmentId: z.string(),
        symptoms: z.string().optional(),
        diagnosis: z.string().optional(),
        notes: z.string().optional(),
        vitals: z
          .object({
            bloodPressure: z.string().optional(),
            temperature: z.number().optional(),
            pulse: z.number().optional(),
            weight: z.number().optional(),
            height: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const appointment = await db.query.appointments.findFirst({
        where: eq(tables.appointments.id, input.appointmentId),
      });
      if (!appointment) throw new TRPCError({ code: "NOT_FOUND", message: "الموعد غير موجود" });

      const doctor = await db.query.doctors.findFirst({ where: eq(tables.doctors.userId, ctx.user!.id) });
      if (!doctor) throw new TRPCError({ code: "FORBIDDEN", message: "لا يوجد ملف طبيب مرتبط بحسابك" });

      const [consultation] = await db
        .insert(tables.consultations)
        .values({
          appointmentId: input.appointmentId,
          doctorId: doctor.id,
          patientId: appointment.patientId,
          symptoms: input.symptoms,
          diagnosis: input.diagnosis,
          notes: input.notes,
          vitals: input.vitals ? JSON.stringify(input.vitals) : null,
        })
        .returning();

      await db
        .update(tables.appointments)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(tables.appointments.id, input.appointmentId));

      return consultation;
    }),

  // 6. إنشاء وصفة طبية
  addPrescription: roleProcedure("doctor")
    .input(
      z.object({
        consultationId: z.string(),
        medications: z.array(
          z.object({
            name: z.string(),
            dosage: z.string(),
            frequency: z.string(),
            duration: z.string(),
          })
        ),
        instructions: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const [prescription] = await db
        .insert(tables.prescriptions)
        .values({
          consultationId: input.consultationId,
          medications: JSON.stringify(input.medications),
          instructions: input.instructions,
        })
        .returning();
      return prescription;
    }),

  // 7. إنشاء تقرير طبي
  createReport: roleProcedure("doctor")
    .input(
      z.object({
        consultationId: z.string(),
        title: z.string(),
        content: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const consultation = await db.query.consultations.findFirst({
        where: eq(tables.consultations.id, input.consultationId),
      });
      if (!consultation) throw new TRPCError({ code: "NOT_FOUND", message: "الاستشارة غير موجودة" });

      const [report] = await db
        .insert(tables.medicalReports)
        .values({
          consultationId: input.consultationId,
          patientId: consultation.patientId,
          title: input.title,
          content: input.content,
        })
        .returning();
      return report;
    }),

  // 8-9. توقيع التقرير -> إغلاق الاستشارة وإتمام الموعد -> إشعار المريض بالتقرير
  signReport: roleProcedure("doctor")
    .input(z.object({ reportId: z.string() }))
    .mutation(async ({ input }) => {
      const report = await db.query.medicalReports.findFirst({
        where: eq(tables.medicalReports.id, input.reportId),
      });
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "التقرير غير موجود" });

      const [signed] = await db
        .update(tables.medicalReports)
        .set({ isSigned: true, updatedAt: new Date() })
        .where(eq(tables.medicalReports.id, input.reportId))
        .returning();

      await db
        .update(tables.consultations)
        .set({ isSigned: true, signedAt: new Date(), updatedAt: new Date() })
        .where(eq(tables.consultations.id, report.consultationId));

      // إتمام الموعد المرتبط بالاستشارة
      const consultation = await db.query.consultations.findFirst({
        where: eq(tables.consultations.id, report.consultationId),
      });
      if (consultation) {
        await db
          .update(tables.appointments)
          .set({ status: "completed", updatedAt: new Date() })
          .where(eq(tables.appointments.id, consultation.appointmentId));

        const patient = await db.query.patients.findFirst({ where: eq(tables.patients.id, report.patientId) });
        if (patient) {
          await db.insert(tables.notifications).values({
            userId: patient.userId,
            type: "report_ready",
            title: "تقريرك الطبي جاهز",
            body: `تم توقيع التقرير: ${report.title}`,
          });
        }
      }

      return signed;
    }),

  // الحصول على استشارة كاملة (مع الوصفات والتقارير)
  getById: roleProcedure("doctor", "admin", "staff")
    .input(z.object({ consultationId: z.string() }))
    .query(async ({ input }) => {
      return db.query.consultations.findFirst({
        where: eq(tables.consultations.id, input.consultationId),
        with: { prescriptions: true, reports: true },
      });
    }),
});
