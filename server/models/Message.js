const mongoose = require("mongoose");

// One structure covers both conversations in the app:
//  - trip_group:   everyone on the trip
//  - join_request: private thread between an applicant and the organizer
const TYPES = ["trip_group", "join_request"];

const messageSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TYPES, required: true },

    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },

    // Only set on join_request messages.
    joinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },

    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

messageSchema.index({ trip: 1, type: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
Message.TYPES = TYPES;

module.exports = Message;
