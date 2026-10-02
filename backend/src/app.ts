import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { csrfProtection, csrfTokenMiddleware, CSRF_HEADER } from "./middleware/csrf.js";
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

  // Behind Render/Cloudflare proxy — required for express-rate-limit + correct IPs
  app.set("trust proxy", 1);

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

  // CSRF token cookie for all requests
  app.use(csrfTokenMiddleware);

  // IP-based rate limit for unauthenticated endpoints
  const authLimiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 60, 
    standardHeaders: true, 
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? "unknown",
  });

  // Per-email rate limit for login attempts (prevents credential stuffing)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `login:${req.body?.email?.toLowerCase() ?? req.ip ?? "unknown"}`,
    skipSuccessfulRequests: true,
  });

  app.get("/api/health", (_req, res) => res.json({ success: true, message: "ClientFlow API v0.2", time: new Date().toISOString() }));

  app.use("/api/auth", authLimiter, authRoutes);
  app.post("/api/auth/login", loginLimiter);
  app.use("/api/portal", portalRoutes);
  app.use("/api/clients", csrfProtection, clientRoutes);
  app.use("/api/projects", csrfProtection, projectRoutes);
  app.use("/api/tasks", csrfProtection, taskRoutes);
  app.use("/api/notes", csrfProtection, noteRoutes);
  app.use("/api/activities", csrfProtection, activityRoutes);
  app.use("/api/dashboard", csrfProtection, dashboardRoutes);
  app.use("/api/search", csrfProtection, searchRoutes);
  app.use("/api/user", csrfProtection, userRoutes);
  app.use("/api/requests", csrfProtection, requestRoutes);
  app.use("/api/comments", csrfProtection, commentRoutes);
  app.use("/api/notifications", csrfProtection, notificationRoutes);
  app.use("/api/automations", csrfProtection, automationRoutes);
  app.use("/api/intelligence", csrfProtection, intelligenceRoutes);

  // Expose CSRF header name for frontend
  app.get("/api/csrf-header", (_req, res) => res.json({ header: CSRF_HEADER }));

  app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Endpoint not found" }));

  app.use(errorHandler);
  return app;
}
