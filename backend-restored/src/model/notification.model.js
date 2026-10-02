import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      maxlength: 180,
    },
    message: {
      type: String,
      trim: true,
      required: true,
      maxlength: 600,
    },
    type: {
      type: String,
      trim: true,
      default: "system",
      maxlength: 60,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const NotificationModel = mongoose.models.notifications || mongoose.model("notifications", notificationSchema);

export default NotificationModel;
