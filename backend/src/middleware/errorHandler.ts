import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: err.issues[0]?.message ?? "Invalid input",
      errors: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  console.error("[api:error]", err);
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
}

export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
