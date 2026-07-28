// ==============================================================
// اتصال قاعدة البيانات
// الافتراضي: SQLite محلي (بدون أي إعداد خارجي مطلوب)
// للإنتاج: غيّر DATABASE_DRIVER=mysql و DATABASE_URL في .env
// وسيتم استخدام mysql2 تلقائيًا بنفس الـ schema (drizzle-orm/mysql-core
// عند الحاجة الفعلية للهجرة - راجع drizzle/README.md)
// ==============================================================
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../drizzle/schema";
import { env } from "./_core/env";

const sqlite = new Database(env.DATABASE_URL);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export * as tables from "../drizzle/schema";
