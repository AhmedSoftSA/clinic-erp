// ==============================
// ثوابت مشتركة بين الخادم والواجهات
// ==============================

export const USER_ROLES = ["admin", "doctor", "staff", "patient"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const APPOINTMENT_STATUS = [
  "pending",      // بانتظار التأكيد
  "confirmed",    // مؤكد
  "checked_in",   // وصل العيادة (في الطابور)
  "in_progress",  // جاري الفحص
  "completed",    // انتهى
  "cancelled",    // ملغي
  "no_show",      // لم يحضر
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

export const INVOICE_STATUS = [
  "unpaid",
  "paid",
  "partially_paid",
  "refunded",
  "cancelled",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

export const PAYMENT_METHOD = ["cash", "card", "bank_transfer", "insurance"] as const;
export type PaymentMethod = (typeof PAYMENT_METHOD)[number];

export const NOTIFICATION_TYPE = [
  "appointment_confirmed",
  "appointment_reminder",
  "appointment_cancelled",
  "report_ready",
  "invoice_created",
  "queue_update",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPE)[number];

// أدوار وصلاحيات كل شاشة (يُستخدم في الـ middleware وعلى الواجهة لإخفاء/إظهار العناصر)
export const PERMISSIONS: Record<UserRole, string[]> = {
  admin: ["*"],
  doctor: [
    "appointments:read", "appointments:update",
    "patients:read",
    "consultations:read", "consultations:write",
    "prescriptions:write",
    "reports:write", "reports:sign",
    "queue:read", "queue:update",
  ],
  staff: [
    "appointments:read", "appointments:write",
    "patients:read", "patients:write",
    "invoices:read", "invoices:write",
    "queue:read", "queue:update",
  ],
  patient: [
    "appointments:own", "reports:own", "invoices:own", "queue:own",
  ],
};

export const DEFAULT_PAGE_SIZE = 20;
