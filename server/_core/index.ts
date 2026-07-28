import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { env } from "./env";

const app = express();

app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(env.PORT, () => {
  console.log(`✅ الخادم يعمل على http://localhost:${env.PORT}`);
});
