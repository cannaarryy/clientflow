import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-change-me-please-32-chars-min",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  corsOrigin: (process.env.CORS_ORIGIN ?? "http://localhost:5173").split(",").map((s) => s.trim()),
  cookieSecure: process.env.COOKIE_SECURE === "true",
};

if (!process.env.DATABASE_URL) {
  console.warn("[env] DATABASE_URL is not set. Copy .env.example to .env and configure Postgres.");
}
