import mongoose from "mongoose";

import { FileModel } from "../models/File.js";
import { User } from "../models/User.js";
import { fileQueue } from "../queue/file.queue.js";

export const getReportSummaryController = async (req, res) => {
  try {
    const tenantId = new mongoose.Types.ObjectId(
      req.user.tenantId
    );

    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    const [fileStats] = await FileModel.aggregate([
      {
        $match: {
          tenantId,
          deletedAt: null,
        },
      },
      {
        $group: {
          _id: null,

          totalFiles: {
            $sum: 1,
          },

          storageUsed: {
            $sum: "$size",
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalFiles: 1,
          storageUsed: 1,
        },
      },
    ]);

    const uploads = await FileModel.aggregate([
      {
        $match: {
          tenantId,
          deletedAt: null,

          createdAt: {
            $gte: startDate,
            $lte: today,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]);

    const uploadsMap = new Map(
      uploads.map((item) => [
        item._id,
        item.count,
      ])
    );

    const uploadsPerDay = [];

    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);

      date.setDate(
        startDate.getDate() + i
      );

      const year = date.getFullYear();

      const month = String(
        date.getMonth() + 1
      ).padStart(2, "0");

      const day = String(
        date.getDate()
      ).padStart(2, "0");

      const key = `${year}-${month}-${day}`;

      uploadsPerDay.push({
        date: date.toLocaleDateString(
          "en-US",
          {
            month: "short",
            day: "numeric",
          }
        ),

        count: uploadsMap.get(key) || 0,
      });
    }

    const activeUsers = await User.countDocuments({
      tenantId,
      isActive: true,
    });

    const jobCounts = await fileQueue.getJobCounts(
      "waiting",
      "active",
      "delayed",
      "prioritized"
    );

    const jobsQueued =
      (jobCounts.waiting || 0) +
      (jobCounts.active || 0) +
      (jobCounts.delayed || 0) +
      (jobCounts.prioritized || 0);

    return res.status(200).json({
      success: true,

      data: {
        totalFiles:
          fileStats?.totalFiles || 0,

        storageUsed:
          fileStats?.storageUsed || 0,

        activeUsers,

        jobsQueued,

        uploadsPerDay,
      },
    });
  } catch (error) {
    console.error(
      "Get dashboard summary error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load dashboard summary.",
    });
  }
};