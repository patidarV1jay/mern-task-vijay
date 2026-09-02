import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";

export const fileDlq = new Queue(
  "file-processing-dlq",
  {
    connection: redisConnection,

    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }
);