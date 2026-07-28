import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { env } from "../server/_core/env";

const sqlite = new Database(env.DATABASE_URL);
const db = drizzle(sqlite);

migrate(db, { migrationsFolder: "./drizzle/migrations" });
console.log("✅ تم تطبيق الهجرات بنجاح على:", env.DATABASE_URL);
