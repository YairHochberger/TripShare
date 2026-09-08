const mongoose = require("mongoose");

const TYPES = ["new_trip"];

// Raised when someone you follow posts a public trip. Kept deliberately
// small: a type, who it is about, and what to open.
const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: TYPES, required: true },

    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip" },

    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);
Notification.TYPES = TYPES;

module.exports = Notification;
