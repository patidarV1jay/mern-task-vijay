import path from "path";
import fs from "fs/promises";
import { FileModel } from "../models/File.js";
import { uploadToS3 } from "../services/s3-storage.service.js";
import { fileQueue } from "../queue/file.queue.js";
import { fileDlq } from "../queue/file-dlq.queue.js";
import { createDownloadUrl } from "../services/s3-storage.service.js";
import { fileDeleteQueue } from "../queue/file-delete.queue.js";
import mongoose from "mongoose";

export const uploadFileController = async (req, res) => {
  let tempPath;

  try {
    const uploadedFile = req.file;

    if (!uploadedFile) {
      return res.status(422).json({
        success: false,
        message: "File is required.",
      });
    }

    tempPath = uploadedFile.path;

    const tenantId = req.user.tenantId;
    const uploadedBy = req.user._id;

    const fileId = new FileModel()._id;

    const extension = path
      .extname(uploadedFile.originalname)
      .toLowerCase();

    const storageKey =
      `tenants/${tenantId}/${fileId}${extension}`;

    await uploadToS3({
      filePath: tempPath,
      storageKey,
      contentType: uploadedFile.mimetype,
    });

    const file = await FileModel.create({
      _id: fileId,
      tenantId,
      name: uploadedFile.originalname,
      size: uploadedFile.size,
      type: uploadedFile.mimetype,
      storageKey,
      uploadedBy,
      status: "pending",
    });

    await fileQueue.add(
      "process-file",
      {
        fileId: file._id.toString(),
        tenantId: tenantId.toString(),
      }
    );

    await fs.unlink(tempPath).catch(() => {});

    tempPath = null;

    return res.status(202).json({
      success: true,

      message:
        "File uploaded successfully and queued for processing.",

      data: {
        fileId: file._id,

        name: file.name,

        status: file.status,
      },
    });

  } catch (error) {
    // -----------------------------------------
    // Cleanup Multer temporary file if needed
    // -----------------------------------------

    if (tempPath) {
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup failure
      }
    }

    console.error(
      "File upload error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to upload file.",
    });
  }
};

export const getFileStatusController = async (req, res) => {
  try {
    const { id } = req.params;

    const file = await FileModel.findOne({
      _id: id,
      tenantId: req.user.tenantId,
    }).select("_id status");

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        fileId: file._id,
        status: file.status,
      },
    });
  } catch (error) {
    console.error(
      "Get file status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to get file status.",
    });
  }
};

export const retryFailedFileController =
  async (req, res) => {
    try {
      const { jobId } = req.params;

      /*
       * Find the failed job in the DLQ.
       */
      const dlqJob =
        await fileDlq.getJob(jobId);

      if (!dlqJob) {
        return res.status(404).json({
          success: false,
          message:
            "Dead-letter job not found.",
        });
      }

      const {
        fileId,
        tenantId,
      } = dlqJob.data;

      /*
       * Make sure the file still exists.
       */
      const file =
        await FileModel.findOne({
          _id: fileId,
          tenantId,
        });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found.",
        });
      }

      /*
       * Reset file status.
       */
      await FileModel.updateOne(
        {
          _id: fileId,
          tenantId,
        },
        {
          $set: {
            status: "pending",
          },
        }
      );

      /*
       * Add the job back to the main queue.
       */
      const newJob =
        await fileQueue.add(
          "process-file",
          {
            fileId,
            tenantId,
          }
        );

      /*
       * Remove the job from DLQ.
       */
      await dlqJob.remove();

      return res.status(202).json({
        success: true,
        message:
          "File processing retry queued.",
        data: {
          fileId,
          jobId: newJob.id,
          status: "pending",
        },
      });
    } catch (error) {
      console.error(
        "Retry failed file error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retry failed file.",
      });
    }
  };

  export const downloadFileController =
  async (req, res) => {
    try {
      const { id } = req.params;
      const file =
        await FileModel.findOne({
          _id: id,
          tenantId: req.user.tenantId,
        }).select(
          "_id name type storageKey status"
        );

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found.",
        });
      }

      if (file.status !== "processed") {
        return res.status(409).json({
          success: false,
          message:
            "File is not ready for download.",
          data: {
            status: file.status,
          },
        });
      }
      const downloadUrl =
        await createDownloadUrl({
          storageKey: file.storageKey,
          expiresIn: 300,
        });

      return res.status(200).json({
        success: true,
        data: {
          fileId: file._id,
          name: file.name,
          type: file.type,
          status: file.status,
          expiresIn: 300,
          downloadUrl,
        },
      });
    } catch (error) {
      console.error(
        "Create download URL error:",
        error
      );
      return res.status(500).json({
        success: false,
        message:
          "Unable to create download URL.",
      });
    }
  };
  
  export const getFilesController = async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        type,
        uploadedBy,
      } = req.query;
  
      const pageNumber = Math.max(Number(page), 1);
      const limitNumber = Math.min(
        Math.max(Number(limit), 1),
        100
      );
  
      const skip = (pageNumber - 1) * limitNumber;
  
      const filter = {
        tenantId: req.user.tenantId,
        deletedAt: null,
      };
  
      if (status) {
        const allowedStatuses = [
          "pending",
          "processing",
          "processed",
          "failed",
        ];
  
        if (!allowedStatuses.includes(status)) {
          return res.status(422).json({
            success: false,
            message: "Invalid status filter.",
          });
        }
  
        filter.status = status;
      }
  
      if (type) {
        filter.type = type;
      }
  
      // Filter by uploader
      if (uploadedBy) {
        if (!mongoose.Types.ObjectId.isValid(uploadedBy)) {
          return res.status(422).json({
            success: false,
            message: "Invalid uploadedBy.",
          });
        }
  
        filter.uploadedBy = uploadedBy;
      }
  
      const [files, total] = await Promise.all([
        FileModel.find(filter)
          .select(
            "_id name size type storageKey uploadedBy status thumbnailKey metadata createdAt updatedAt"
          )
          .populate(
            "uploadedBy",
            "_id fullName email"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber)
          .lean(),
  
        FileModel.countDocuments(filter),
      ]);
  
      return res.status(200).json({
        success: true,
        data: files,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total,
          totalPages: Math.ceil(total / limitNumber),
          hasNextPage: pageNumber < Math.ceil(total / limitNumber),
          hasPreviousPage: pageNumber > 1,
        },
      });
    } catch (error) {
      console.error("Get files error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Unable to get files.",
      });
    }
  };

  export const deleteFileController = async (req, res) => {
    try {
      const { id } = req.params;
  
      const file = await FileModel.findOne({
        _id: id,
        tenantId: req.user.tenantId,
        deletedAt: null,
      });
  
      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found.",
        });
      }
  
      // Soft delete
      file.deletedAt = new Date();
      await file.save();
  
      // Schedule asynchronous S3 deletion
      const job = await fileDeleteQueue.add(
        "delete-file",
        {
          fileId: file._id.toString(),
          tenantId: file.tenantId.toString(),
          storageKey: file.storageKey,
          thumbnailKey: file.thumbnailKey || null,
        }
      );
  
      return res.status(202).json({
        success: true,
        message: "File deleted successfully. Storage cleanup has been queued.",
        data: {
          fileId: file._id,
          status: "deleted",
          deletionJobId: job.id,
        },
      });
    } catch (error) {
      console.error("Delete file error:", error);
  
      return res.status(500).json({
        success: false,
        message: "Unable to delete file.",
      });
    }
  };
