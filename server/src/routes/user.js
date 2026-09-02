import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { listUsers, inviteUser, updateUserRole } from '../controllers/userController.js';

const router = express.Router();

router.get("/", requireAuth, requireRole('admin','owner'), listUsers)
router.post(
    "/invite",
    requireAuth,
    requireRole('admin','owner'),
    inviteUser
  );
  router.patch(
    "/:id/role",
    requireAuth,
    requireRole('owner'),
    updateUserRole
  );
  export default router