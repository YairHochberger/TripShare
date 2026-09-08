const mongoose = require("mongoose");

const DIRECTIONS = ["organizer_to_participant", "participant_to_organizer"];

const reviewSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reviewee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    direction: { type: String, enum: DIRECTIONS, required: true },
    score: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

// One review per reviewer -> reviewee per trip.
reviewSchema.index({ trip: 1, reviewer: 1, reviewee: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
Review.DIRECTIONS = DIRECTIONS;

module.exports = Review;
