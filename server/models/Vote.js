const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    proposal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChangeProposal",
      required: true,
    },
    voter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // true = agrees with the change, false = objects to it.
    agree: { type: Boolean, required: true },
  },
  { timestamps: true }
);

// One vote per person per proposal; changing your mind updates it.
voteSchema.index({ proposal: 1, voter: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
