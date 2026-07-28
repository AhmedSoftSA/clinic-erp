import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, roleProcedure } from "../_core/trpc";
import { db, tables } from "../db";

type InvoiceItem = { description: string; quantity: number; unitPrice: number };

function calcTotals(items: InvoiceItem[], discount = 0, taxRate = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const tax = (subtotal - discount) * taxRate;
  const total = subtotal - discount + tax;
  return { subtotal, tax, total };
}

export const invoicesRouter = router({
  // 2. نظام الفاتورة ينشئ فاتورة تلقائية بعد إتمام الفحص
  createFromConsultation: roleProcedure("doctor", "staff", "admin")
    .input(
      z.object({
        appointmentId: z.string(),
        patientId: z.string(),
        items: z
          .array(z.object({ description: z.string(), quantity: z.number().default(1), unitPrice: z.number() }))
          .min(1),
        discount: z.number().default(0),
        taxRate: z.number().default(0),
      })
    )
    .mutation(async ({ input }) => {
      const { subtotal, tax, total } = calcTotals(input.items, input.discount, input.taxRate);

      const [invoice] = await db
        .insert(tables.invoices)
        .values({
          patientId: input.patientId,
          appointmentId: input.appointmentId,
          items: JSON.stringify(input.items),
          subtotal,
          discount: input.discount,
          tax,
          total,
          status: "unpaid",
        })
        .returning();

      const patient = await db.query.patients.findFirst({ where: eq(tables.patients.id, input.patientId) });
      if (patient) {
        await db.insert(tables.notifications).values({
          userId: patient.userId,
          type: "invoice_created",
          title: "فاتورة جديدة",
          body: `تم إصدار فاتورة بقيمة ${total.toFixed(2)} ر.س`,
        });
      }

      return invoice;
    }),

  // 3-4. الموظف يستقبل الدفع ويسجله -> 6. تحديث حالة الفاتورة
  recordPayment: roleProcedure("staff", "admin")
    .input(
      z.object({
        invoiceId: z.string(),
        amount: z.number().positive(),
        method: z.enum(["cash", "card", "bank_transfer", "insurance"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const invoice = await db.query.invoices.findFirst({ where: eq(tables.invoices.id, input.invoiceId) });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });

      await db.insert(tables.payments).values({
        invoiceId: input.invoiceId,
        amount: input.amount,
        method: input.method,
        receivedByUserId: ctx.user!.id,
      });

      const existingPayments = await db.query.payments.findMany({
        where: eq(tables.payments.invoiceId, input.invoiceId),
      });
      const totalPaid = existingPayments.reduce((s, p) => s + p.amount, 0) + input.amount;

      const newStatus = totalPaid >= invoice.total ? "paid" : "partially_paid";

      const [updated] = await db
        .update(tables.invoices)
        .set({ status: newStatus, updatedAt: new Date() })
        .where(eq(tables.invoices.id, input.invoiceId))
        .returning();

      return updated;
    }),

  listMine: roleProcedure("patient").query(async ({ ctx }) => {
    const patient = await db.query.patients.findFirst({ where: eq(tables.patients.userId, ctx.user!.id) });
    if (!patient) return [];
    return db.query.invoices.findMany({
      where: eq(tables.invoices.patientId, patient.id),
      with: { payments: true },
      orderBy: (i, { desc }) => desc(i.createdAt),
    });
  }),

  listAll: roleProcedure("staff", "admin").query(async () => {
    return db.query.invoices.findMany({
      with: { patient: { with: { user: true } }, payments: true },
      orderBy: (i, { desc }) => desc(i.createdAt),
    });
  }),

  getById: roleProcedure("staff", "admin", "patient")
    .input(z.object({ invoiceId: z.string() }))
    .query(async ({ input }) => {
      const invoice = await db.query.invoices.findFirst({
        where: eq(tables.invoices.id, input.invoiceId),
        with: { payments: true, patient: { with: { user: true } } },
      });
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "الفاتورة غير موجودة" });
      return invoice;
    }),
});
