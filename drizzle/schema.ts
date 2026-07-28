// ==============================================================
// مخطط قاعدة البيانات - نظام ERP العيادات
// مبني بحيث يعمل على SQLite في بيئة التطوير، وقابل للهجرة
// إلى MySQL/TiDB في الإنتاج بأقل تعديل (نفس أسماء الأعمدة والعلاقات)
// ==============================================================

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
};

// -------------------- المستخدمون (حساب موحد لكل الأدوار) --------------------
export const users = sqliteTable("users", {
  id: id(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash"), // فارغ إذا الدخول عبر OAuth
  role: text("role", { enum: ["admin", "doctor", "staff", "patient"] }).notNull(),
  avatarUrl: text("avatar_url"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  ...timestamps,
});

// -------------------- الملف الطبي/التعريفي للمريض --------------------
export const patients = sqliteTable("patients", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  nationalId: text("national_id"),
  dateOfBirth: integer("date_of_birth", { mode: "timestamp" }),
  gender: text("gender", { enum: ["male", "female"] }),
  bloodType: text("blood_type"),
  allergies: text("allergies"), // JSON string array
  chronicConditions: text("chronic_conditions"), // JSON string array
  emergencyContactName: text("emergency_contact_name"),
  emergencyContactPhone: text("emergency_contact_phone"),
  ...timestamps,
});

// -------------------- بيانات الطبيب --------------------
export const doctors = sqliteTable("doctors", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  specialty: text("specialty").notNull(),
  licenseNumber: text("license_number"),
  bio: text("bio"),
  consultationFee: real("consultation_fee").notNull().default(0),
  ...timestamps,
});

// -------------------- جدول أوقات دوام الطبيب --------------------
export const doctorSchedules = sqliteTable("doctor_schedules", {
  id: id(),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0=الأحد ... 6=السبت
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(),     // "17:00"
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(20),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// -------------------- المواعيد --------------------
export const appointments = sqliteTable("appointments", {
  id: id(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" }).notNull(),
  status: text("status", {
    enum: ["pending", "confirmed", "checked_in", "in_progress", "completed", "cancelled", "no_show"],
  }).notNull().default("pending"),
  reasonForVisit: text("reason_for_visit"),
  queuePosition: integer("queue_position"),
  checkedInAt: integer("checked_in_at", { mode: "timestamp" }),
  ...timestamps,
});

// -------------------- الفحص/الاستشارة الطبية --------------------
export const consultations = sqliteTable("consultations", {
  id: id(),
  appointmentId: text("appointment_id").notNull().references(() => appointments.id),
  doctorId: text("doctor_id").notNull().references(() => doctors.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  symptoms: text("symptoms"),
  diagnosis: text("diagnosis"),
  notes: text("notes"),
  vitals: text("vitals"), // JSON: { bp, temp, pulse, weight, height }
  isSigned: integer("is_signed", { mode: "boolean" }).notNull().default(false),
  signedAt: integer("signed_at", { mode: "timestamp" }),
  ...timestamps,
});

// -------------------- الوصفات الطبية --------------------
export const prescriptions = sqliteTable("prescriptions", {
  id: id(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id),
  medications: text("medications").notNull(), // JSON array: [{name, dosage, frequency, duration}]
  instructions: text("instructions"),
  ...timestamps,
});

// -------------------- التقارير الطبية --------------------
export const medicalReports = sqliteTable("medical_reports", {
  id: id(),
  consultationId: text("consultation_id").notNull().references(() => consultations.id),
  patientId: text("patient_id").notNull().references(() => patients.id),
  title: text("title").notNull(),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  isSigned: integer("is_signed", { mode: "boolean" }).notNull().default(false),
  ...timestamps,
});

// -------------------- الفواتير --------------------
export const invoices = sqliteTable("invoices", {
  id: id(),
  patientId: text("patient_id").notNull().references(() => patients.id),
  appointmentId: text("appointment_id").references(() => appointments.id),
  items: text("items").notNull(), // JSON array: [{description, quantity, unitPrice}]
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  tax: real("tax").notNull().default(0),
  total: real("total").notNull().default(0),
  status: text("status", {
    enum: ["unpaid", "paid", "partially_paid", "refunded", "cancelled"],
  }).notNull().default("unpaid"),
  ...timestamps,
});

// -------------------- المدفوعات --------------------
export const payments = sqliteTable("payments", {
  id: id(),
  invoiceId: text("invoice_id").notNull().references(() => invoices.id),
  amount: real("amount").notNull(),
  method: text("method", { enum: ["cash", "card", "bank_transfer", "insurance"] }).notNull(),
  receivedByUserId: text("received_by_user_id").notNull().references(() => users.id),
  paidAt: integer("paid_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// -------------------- الإشعارات --------------------
export const notifications = sqliteTable("notifications", {
  id: id(),
  userId: text("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// -------------------- سجل التدقيق (Audit Log) --------------------
export const auditLogs = sqliteTable("audit_logs", {
  id: id(),
  userId: text("user_id").references(() => users.id),
  action: text("action").notNull(),      // e.g. "invoice.update"
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: text("metadata"), // JSON
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// ==================== العلاقات ====================
export const usersRelations = relations(users, ({ one }) => ({
  patientProfile: one(patients, { fields: [users.id], references: [patients.userId] }),
  doctorProfile: one(doctors, { fields: [users.id], references: [doctors.userId] }),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, { fields: [patients.userId], references: [users.id] }),
  appointments: many(appointments),
  invoices: many(invoices),
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
  user: one(users, { fields: [doctors.userId], references: [users.id] }),
  schedules: many(doctorSchedules),
  appointments: many(appointments),
}));

export const appointmentsRelations = relations(appointments, ({ one }) => ({
  patient: one(patients, { fields: [appointments.patientId], references: [patients.id] }),
  doctor: one(doctors, { fields: [appointments.doctorId], references: [doctors.id] }),
}));

export const consultationsRelations = relations(consultations, ({ one, many }) => ({
  appointment: one(appointments, { fields: [consultations.appointmentId], references: [appointments.id] }),
  doctor: one(doctors, { fields: [consultations.doctorId], references: [doctors.id] }),
  patient: one(patients, { fields: [consultations.patientId], references: [patients.id] }),
  prescriptions: many(prescriptions),
  reports: many(medicalReports),
}));

export const prescriptionsRelations = relations(prescriptions, ({ one }) => ({
  consultation: one(consultations, { fields: [prescriptions.consultationId], references: [consultations.id] }),
}));

export const medicalReportsRelations = relations(medicalReports, ({ one }) => ({
  consultation: one(consultations, { fields: [medicalReports.consultationId], references: [consultations.id] }),
  patient: one(patients, { fields: [medicalReports.patientId], references: [patients.id] }),
}));

export const doctorSchedulesRelations = relations(doctorSchedules, ({ one }) => ({
  doctor: one(doctors, { fields: [doctorSchedules.doctorId], references: [doctors.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  patient: one(patients, { fields: [invoices.patientId], references: [patients.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, { fields: [payments.invoiceId], references: [invoices.id] }),
}));
