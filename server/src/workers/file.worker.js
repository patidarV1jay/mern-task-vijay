import { Worker } from "bullmq";

import { redisConnection } from "../config/redis.js";
import { FileModel } from "../models/File.js";
import { processFile } from "../services/file-processing.js";

import {
  emitFileProcessing,
  emitFileProcessed,
  emitFileFailed,
} from "../socket/socket.js";

import { fileDlq } from "../queue/file-dlq.queue.js";

const worker = new Worker(
  "file-processing",

  async (job) => {
    const {
      fileId,
      tenantId,
    } = job.data;

    console.log("=================================");
    console.log("FILE JOB RECEIVED");
    console.log("Job ID:", job.id);
    console.log("File ID:", fileId);
    console.log("Tenant ID:", tenantId);
    console.log(
      "Attempt:",
      job.attemptsMade + 1
    );
    console.log("=================================");

    const file = await FileModel.findOne({
      _id: fileId,
      tenantId,
      deletedAt: null,
    });

    if (!file) {
      throw new Error(
        `File not found: ${fileId}`
      );
    }

    // --------------------------------
    // PROCESSING
    // --------------------------------

    await FileModel.updateOne(
      {
        _id: fileId,
        tenantId,
      },
      {
        $set: {
          status: "processing",
        },
      }
    );

    console.log(
      "File status changed to processing"
    );

    // Tell frontend
    emitFileProcessing(
      file.uploadedBy.toString(),
      {
        fileId: file._id.toString(),
        status: "processing",
      }
    );

    console.log(
      "Socket notification emitted: processing"
    );

    try {
      // --------------------------------
      // ACTUAL FILE PROCESSING
      // --------------------------------

      const result = await processFile({
        file,
      });

      console.log(
        "Processing result:",
        result
      );

      // --------------------------------
      // PROCESSED
      // --------------------------------

      await FileModel.updateOne(
        {
          _id: fileId,
          tenantId,
        },
        {
          $set: {
            status: "processed",
            metadata: result.metadata,
            thumbnailKey:
              result.thumbnailKey,
          },
        }
      );

      console.log(
        "File status changed to processed"
      );

      // Tell frontend
      emitFileProcessed(
        file.uploadedBy.toString(),
        {
          fileId: file._id.toString(),
          status: "processed",
          metadata: result.metadata,
          thumbnailKey:
            result.thumbnailKey,
        }
      );

      console.log(
        "Socket notification emitted: processed"
      );

      return result;
    } catch (error) {
      console.error(
        "File processing failed:",
        error
      );

      throw error;
    }
  },

  {
    connection: redisConnection,
  }
);


worker.on("ready", () => {
  console.log(
    "File processing worker is ready"
  );
});

worker.on(
  "completed",
  (job) => {
    console.log(
      `Job ${job.id} completed`
    );
  }
);

worker.on(
  "failed",
  async (job, error) => {
    if (!job) {
      return;
    }

    console.error(
      `Job ${job.id} failed:`,
      error.message
    );

    const maxAttempts =
      job.opts.attempts || 1;

    const attemptsMade =
      job.attemptsMade;

    console.log(
      `Attempts: ${attemptsMade}/${maxAttempts}`
    );


    if (attemptsMade < maxAttempts) {
      console.log(
        "Retry remaining. Not marking file as failed."
      );

      return;
    }

    try {
      console.log(
        "All attempts exhausted."
      );

      // Find file
      const file = await FileModel.findOne({
        _id: job.data.fileId,
        tenantId: job.data.tenantId,
      });

      if (!file) {
        console.error(
          `File not found: ${job.data.fileId}`
        );

        return;
      }

      await fileDlq.add(
        "dead-file",
        {
          originalJobId: job.id,

          fileId:
            job.data.fileId,

          tenantId:
            job.data.tenantId,

          originalJobName:
            job.name,

          attemptsMade,

          failedAt:
            new Date().toISOString(),

          error: {
            message:
              error.message,

            stack:
              error.stack,
          },
        }
      );

      console.log(
        `Job ${job.id} moved to DLQ`
      );

      await FileModel.updateOne(
        {
          _id: job.data.fileId,
          tenantId: job.data.tenantId,
        },
        {
          $set: {
            status: "failed",
          },
        }
      );

      console.log(
        "File status changed to failed"
      );

      emitFileFailed(
        file.uploadedBy.toString(),
        {
          fileId: file._id.toString(),
          status: "failed",
          message:
            "File processing failed after all retries.",
        }
      );

      console.log(
        "Socket notification emitted: failed"
      );

    } catch (dlqError) {
      console.error(
        "Failed to move job to DLQ:",
        dlqError
      );
    }
  }
);

worker.on(
  "error",
  (error) => {
    console.error(
      "Worker error:",
      error
    );
  }
);


console.log(
  "File processing worker started"
);

export default worker;