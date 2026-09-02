import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    storageKey: { type: String, required: true },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "processed", "failed"],
      default: "pending",
    },
    thumbnailKey: String,
    metadata: { pageCount: Number, width: Number, height: Number },
    deletedAt: Date,
  },
  { timestamps: true },
);
schema.index({ tenantId: 1, createdAt: -1 });
schema.index({ tenantId: 1, status: 1 });
schema.index({ tenantId: 1, type: 1 });
schema.index({ tenantId: 1, uploadedBy: 1 });
export const FileModel = mongoose.model("File", schema);
