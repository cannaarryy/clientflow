import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.post(
  "/test",
  asyncHandler(async (req, res) => {
    const x = 1;
    return res.json({ x });
  })
);

export default router;