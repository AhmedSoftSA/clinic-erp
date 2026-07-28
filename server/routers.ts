import { router } from "./_core/trpc";
import { authRouter } from "./routers/auth";
import { appointmentsRouter } from "./routers/appointments";
import { patientsRouter } from "./routers/patients";
import { consultationsRouter } from "./routers/consultations";
import { invoicesRouter } from "./routers/invoices";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  auth: authRouter,
  appointments: appointmentsRouter,
  patients: patientsRouter,
  consultations: consultationsRouter,
  invoices: invoicesRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
