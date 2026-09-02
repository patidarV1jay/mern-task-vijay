import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const fileQueue = new Queue(
  'file-processing',
  {
    connection: redisConnection,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: 'exponential',
        delay: 2000,
      },

      removeOnComplete: 100,
      removeOnFail: 500,
    },
  }
);