const mongoose = require("mongoose");

const STATUSES = ["pending", "approved", "rejected"];

const joinRequestSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: STATUSES, default: "pending" },
  },
  { timestamps: true }
);

const JoinRequest = mongoose.model("JoinRequest", joinRequestSchema);
JoinRequest.STATUSES = STATUSES;

module.exports = JoinRequest;
