import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export interface TokenPayload {
  userId: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ userId } satisfies TokenPayload, env.jwtSecret, { expiresIn: env.jwtExpiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

export const AUTH_COOKIE = "clientflow_token";

export function cookieOptions() {
  // Cross-site (Vercel frontend + Render backend) needs SameSite=None + Secure
  const crossSite = env.cookieSecure || env.nodeEnv === "production";
  return {
    httpOnly: true,
    sameSite: (crossSite ? "none" : "lax") as "none" | "lax",
    secure: crossSite ? true : env.cookieSecure,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
