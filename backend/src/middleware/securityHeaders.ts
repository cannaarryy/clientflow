import type { NextFunction, Request, Response } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Content Security Policy
  // Note: Adjust based on your frontend needs (inline scripts, external resources, etc.)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Vite needs unsafe-inline/eval in dev
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https://clientflow-yrul.onrender.com wss://clientflow-yrul.onrender.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);

  // HSTS (Strict Transport Security) - 1 year, include subdomains, preload
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

  // X-Frame-Options - prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // X-Content-Type-Options - prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Permissions Policy (Feature Policy)
  res.setHeader("Permissions-Policy", [
    "accelerometer=()",
    "camera=()",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "usb=()",
  ].join(", "));

  // Cross-Origin policies
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  // Remove X-Powered-By (express default)
  res.removeHeader("X-Powered-By");

  next();
}

// Development-friendly CSP (less restrictive)
export function securityHeadersDev(req: Request, res: Response, next: NextFunction) {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: https:",
    "connect-src 'self' https://clientflow-yrul.onrender.com wss://clientflow-yrul.onrender.com ws://localhost:* http://localhost:*",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");

  next();
}