import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { env } from "./env";
import { db } from "../db";
import { main as seedDemoData } from "../../drizzle/seed";

async function start() {
    migrate(db, { migrationsFolder: "./drizzle/migrations" });
    await seedDemoData();

  const app = express();
    app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));
    app.use(cookieParser());
    app.use(express.json());
    app.get("/health", (_req, res) => res.json({ status: "ok" }));
    app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  const clientDist = path.join(path.dirname(fileURLToPath(import.meta.url)), "client");
    app.use(express.static(clientDist));
    app.get("*", (_req, res) => {
          res.sendFile(path.join(clientDist, "index.html"));
    });

  app.listen(env.PORT, () => {
        console.log("Server running on port " + env.PORT);
  });
}

start();
