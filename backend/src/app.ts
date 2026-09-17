import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.js";
import clientRoutes from "./routes/clients.js";
import projectRoutes from "./routes/projects.js";
import taskRoutes from "./routes/tasks.js";
import noteRoutes from "./routes/notes.js";
import activityRoutes from "./routes/activities.js";
import dashboardRoutes from "./routes/dashboard.js";
import searchRoutes from "./routes/search.js";
import userRoutes from "./routes/user.js";
import requestRoutes from "./routes/requests.js";
import commentRoutes from "./routes/comments.js";
import notificationRoutes from "./routes/notifications.js";
import automationRoutes from "./routes/automations.js";
import intelligenceRoutes from "./routes/intelligence.js";
import portalRoutes from "./routes/portal.js";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });

  app.get("/api/health", (_req, res) => res.json({ success: true, message: "ClientFlow API v0.2", time: new Date().toISOString() }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/portal", portalRoutes);
  app.use("/api/clients", clientRoutes);
  app.use("/api/projects", projectRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/notes", noteRoutes);
  app.use("/api/activities", activityRoutes);
  app.use("/api/dashboard", dashboardRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/requests", requestRoutes);
  app.use("/api/comments", commentRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/automations", automationRoutes);
  app.use("/api/intelligence", intelligenceRoutes);

  app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Endpoint not found" }));

  app.use(errorHandler);
  return app;
}
