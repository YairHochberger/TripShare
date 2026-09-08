const mongoose = require("mongoose");

// One structure covers every conversation in the app:
//  - trip_group:   everyone on the trip
//  - join_request: private thread between an applicant and the organizer
//  - direct:       private thread between the organizer and one participant
const TYPES = ["trip_group", "join_request", "direct"];

const messageSchema = new mongoose.Schema(
  {
    type: { type: String, enum: TYPES, required: true },

    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },

    // Only set on join_request messages.
    joinRequest: { type: mongoose.Schema.Types.ObjectId, ref: "JoinRequest" },

    // Only set on direct messages: the participant whose thread this is.
    // The other side is always the trip's organizer.
    participant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

messageSchema.index({ trip: 1, type: 1, createdAt: 1 });
messageSchema.index({ trip: 1, participant: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
Message.TYPES = TYPES;

module.exports = Message;
