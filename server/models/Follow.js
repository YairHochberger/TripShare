const mongoose = require("mongoose");

// Someone following an organizer they had a good trip with.
const followSchema = new mongoose.Schema(
  {
    follower: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

followSchema.index({ follower: 1, organizer: 1 }, { unique: true });

module.exports = mongoose.model("Follow", followSchema);
