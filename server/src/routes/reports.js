import { Router } from "express";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

import {
  getReportSummaryController,
} from "../controllers/reportController.js";

const router = Router();

router.get(
  "/summary",
  requireAuth,
  requireRole("admin", "owner"),
  getReportSummaryController
);

export default router;