// src/routes/file.routes.js

import express from 'express';

import { uploadFile } from '../middleware/upload.js'

import {
  uploadFileController,
  getFileStatusController,
  retryFailedFileController,
  downloadFileController,
  getFilesController,
  deleteFileController,
} from '../controllers/fileController.js'
import { requireAuth, requireRole } from '../middleware/auth.js';

const router =
  express.Router();

router.post(
  '/upload',
  requireAuth,
  requireRole('admin','owner','editor'),
  uploadFile,
  uploadFileController 
);

router.get(
  "/:id/status",
  requireAuth,
  getFileStatusController
);

router.post(
  "/admin/jobs/:jobId/retry",
  requireAuth,
  requireRole('admin'),
  retryFailedFileController
);

router.get(
  "/:id/download",
  requireAuth,
  downloadFileController
);

router.get(
  "/",
  requireAuth,
  getFilesController
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("admin", "owner"),
  deleteFileController
);


export default router;