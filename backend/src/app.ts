import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { csrfProtection, csrfTokenMiddleware, CSRF_HEADER } from "./middleware/csrf.js";
import { securityHeaders, securityHeadersDev } from "./middleware/securityHeaders.js";
import { auditMiddleware } from "./middleware/audit.js";
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
import demoRoutes from "./routes/demo.js";
import adminRoutes from "./routes/admin.js";
import orgRoutes from "./routes/org.js";

export function createApp() {
  const app = express();

  // Behind Render/Cloudflare proxy — required for express-rate-limit + correct IPs
  app.set("trust proxy", 1);

  // Security headers (before helmet to avoid conflicts)
  if (env.nodeEnv === "production") {
    app.use(securityHeaders);
  } else {
    app.use(securityHeadersDev);
  }

  app.use(helmet({
    contentSecurityPolicy: false, // We handle CSP manually
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  }));
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  if (env.nodeEnv !== "test") app.use(morgan("dev"));

  // Audit middleware (captures request/response for authenticated routes)
  app.use(auditMiddleware);

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

  // Stricter rate limit for admin/sensitive endpoints
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? "unknown",
  });

  // Higher limit for read-heavy endpoints (dashboard, notifications polling)
  const readLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? "unknown",
  });

  app.get("/api/health", (_req, res) => res.json({ success: true, message: "ClientFlow API v0.2", time: new Date().toISOString() }));

  // Demo sandbox routes (no auth, no CSRF - for anonymous visitors)
  const demoLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip ?? "unknown",
  });
  app.use("/api/demo", demoLimiter, demoRoutes);

  app.use("/api/auth", authLimiter, authRoutes);
  app.post("/api/auth/login", loginLimiter);
  app.use("/api/portal", portalRoutes);
  app.use("/api/clients", adminLimiter, csrfProtection, clientRoutes);
  app.use("/api/projects", adminLimiter, csrfProtection, projectRoutes);
  app.use("/api/tasks", adminLimiter, csrfProtection, taskRoutes);
  app.use("/api/notes", adminLimiter, csrfProtection, noteRoutes);
  app.use("/api/activities", adminLimiter, csrfProtection, activityRoutes);
  app.use("/api/dashboard", readLimiter, csrfProtection, dashboardRoutes);
  app.use("/api/search", adminLimiter, csrfProtection, searchRoutes);
  app.use("/api/user", adminLimiter, csrfProtection, userRoutes);
  app.use("/api/requests", adminLimiter, csrfProtection, requestRoutes);
  app.use("/api/comments", adminLimiter, csrfProtection, commentRoutes);
  app.use("/api/notifications", readLimiter, csrfProtection, notificationRoutes);
  app.use("/api/automations", adminLimiter, csrfProtection, automationRoutes);
  app.use("/api/intelligence", adminLimiter, csrfProtection, intelligenceRoutes);

  // Admin routes (audit logs, etc.)
  app.use("/api/admin", adminLimiter, adminRoutes);
  app.use("/api/org", adminLimiter, csrfProtection, orgRoutes);

  // Expose CSRF header name for frontend
  app.get("/api/csrf-header", (_req, res) => res.json({ header: CSRF_HEADER }));

  app.use("/api", (_req, res) => res.status(404).json({ success: false, message: "Endpoint not found" }));

  app.use(errorHandler);
  return app;
}
