import { Router } from "express";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth.js";

import {
  retryJobController,
} from "../controllers/jobController.js";

const router = Router();

router.get(
  "/:id/retry",
  requireAuth,
  requireRole("admin", "owner"),
  retryJobController
);

export default router;