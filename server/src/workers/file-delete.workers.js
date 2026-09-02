import { Worker } from "bullmq";

import { redisConnection } from "../config/redis.js";
import { FileModel } from "../models/File.js";
import { deleteFromS3 } from "../services/s3-storage.service.js";

const worker = new Worker(
  "file-deletion",
  async (job) => {
    const {
      fileId,
      tenantId,
      storageKey,
      thumbnailKey,
    } = job.data;

    console.log(
      `Deleting S3 objects for file ${fileId}`
    );

    // Delete original file
    await deleteFromS3({
      storageKey,
    });

    // Delete thumbnail if it exists
    if (thumbnailKey) {
      await deleteFromS3({
        storageKey: thumbnailKey,
      });
    }

    console.log(
      `S3 cleanup completed for file ${fileId}`
    );

    return {
      fileId,
      deleted: true,
    };
  },
  {
    connection: redisConnection,
  }
);

worker.on("completed", (job) => {
  console.log(
    `File deletion job ${job.id} completed`
  );
});

worker.on("failed", (job, error) => {
  console.error(
    `File deletion job ${job?.id} failed:`,
    error.message
  );
});

console.log("File deletion worker started");