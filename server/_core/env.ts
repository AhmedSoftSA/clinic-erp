// ==============================================================
// متغيرات البيئة - نقطة مركزية واحدة لقراءتها والتحقق منها
// ==============================================================
import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`متغير البيئة المطلوب غير موجود: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 4000),

  // قاعدة البيانات: SQLite افتراضيًا في التطوير، MySQL/TiDB في الإنتاج
  DATABASE_DRIVER: (process.env.DATABASE_DRIVER as "sqlite" | "mysql") ?? "sqlite",
  DATABASE_URL: process.env.DATABASE_URL ?? "./drizzle/clinic.db",

  // المصادقة
  JWT_SECRET: required("JWT_SECRET", "dev-only-secret-change-me"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  COOKIE_NAME: "clinic_session",

  // OAuth (اختياري - يعمل النظام محليًا بدونه عبر بريد/كلمة مرور)
  OAUTH_ENABLED: process.env.OAUTH_ENABLED === "true",
  OAUTH_CLIENT_ID: process.env.OAUTH_CLIENT_ID ?? "",
  OAUTH_CLIENT_SECRET: process.env.OAUTH_CLIENT_SECRET ?? "",
  OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI ?? "",

  // تخزين الملفات (اختياري - يستخدم تخزين محلي إن لم تتوفر مفاتيح S3)
  STORAGE_DRIVER: (process.env.STORAGE_DRIVER as "local" | "s3") ?? "local",
  S3_BUCKET: process.env.S3_BUCKET ?? "",
  S3_REGION: process.env.S3_REGION ?? "",
  S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID ?? "",
  S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ?? "",

  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
};
