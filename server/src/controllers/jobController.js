import { fileDlq } from "../queue/file-dlq.queue.js";
import { fileQueue } from "../queue/file.queue.js";
import { FileModel } from "../models/File.js";

export const retryJobController = async (req, res) => {
  try {
    const { id } = req.params;

    const failedJob = await fileDlq.getJob(id);

    if (!failedJob) {
      return res.status(404).json({
        success: false,
        message: "Failed job not found.",
      });
    }

    const {
      fileId,
      tenantId,
    } = failedJob.data;

    // Extra tenant protection
    if (
      tenantId.toString() !==
      req.user.tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Forbidden.",
      });
    }

    // Make sure the file still exists
    const file = await FileModel.findOne({
      _id: fileId,
      tenantId: req.user.tenantId,
      deletedAt: null,
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found.",
      });
    }

    // Reset status before retrying
    await FileModel.updateOne(
      {
        _id: fileId,
        tenantId: req.user.tenantId,
      },
      {
        $set: {
          status: "pending",
        },
      }
    );

    // Create a fresh processing job
    const newJob = await fileQueue.add(
      "process-file",
      {
        fileId: fileId.toString(),
        tenantId: tenantId.toString(),
      }
    );

    // Remove the job from DLQ
    await failedJob.remove();

    return res.status(202).json({
      success: true,
      message: "Failed job re-queued successfully.",
      data: {
        oldJobId: failedJob.id,
        newJobId: newJob.id,
        fileId,
        status: "pending",
      },
    });
  } catch (error) {
    console.error("Retry job error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retry failed job.",
    });
  }
};