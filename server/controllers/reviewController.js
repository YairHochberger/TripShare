const Review = require("../models/Review");
const Trip = require("../models/Trip");
const User = require("../models/User");

// Recalculates a user's average from scratch so the stored value can never drift.
async function recalculateRating(userId, direction) {
  const reviews = await Review.find({ reviewee: userId, direction });

  const count = reviews.length;
  const average = count
    ? reviews.reduce((sum, r) => sum + r.score, 0) / count
    : 0;

  // A review sent organizer -> participant rates that person AS a participant.
  const field =
    direction === "organizer_to_participant"
      ? "participantRating"
      : "organizerRating";

  await User.findByIdAndUpdate(userId, {
    [field]: { average: Math.round(average * 10) / 10, count },
  });
}

// CREATE A REVIEW (only on completed trips, only between trip-mates)
exports.createReview = async (req, res) => {
  const { reviewee, score, comment } = req.body;

  if (!reviewee) return res.status(400).json({ message: "reviewee is required" });
  if (!score || score < 1 || score > 5) {
    return res.status(400).json({ message: "score must be between 1 and 5" });
  }

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (trip.status !== "completed") {
    return res.status(400).json({ message: "You can only review a completed trip" });
  }

  if (String(reviewee) === String(req.user.id)) {
    return res.status(400).json({ message: "You cannot review yourself" });
  }

  const isOrganizer = String(trip.organizer) === String(req.user.id);
  const isMember = trip.members.some((m) => String(m) === String(req.user.id));

  if (!isOrganizer && !isMember) {
    return res.status(403).json({ message: "You were not part of this trip" });
  }

  // The reviewer's role on this trip decides the direction, and the
  // reviewee must hold the opposite role.
  let direction;
  if (isOrganizer) {
    const revieweeIsMember = trip.members.some((m) => String(m) === String(reviewee));
    if (!revieweeIsMember) {
      return res.status(400).json({ message: "That user was not a participant on this trip" });
    }
    direction = "organizer_to_participant";
  } else {
    if (String(trip.organizer) !== String(reviewee)) {
      return res.status(400).json({ message: "Participants can only review the organizer" });
    }
    direction = "participant_to_organizer";
  }

  const existing = await Review.findOne({
    trip: trip._id,
    reviewer: req.user.id,
    reviewee,
  });
  if (existing) {
    return res.status(400).json({ message: "You already reviewed this person for this trip" });
  }

  const review = await Review.create({
    trip: trip._id,
    reviewer: req.user.id,
    reviewee,
    direction,
    score,
    comment,
  });

  await recalculateRating(reviewee, direction);

  res.json(review);
};

// LIST REVIEWS FOR A TRIP
exports.getTripReviews = async (req, res) => {
  const reviews = await Review.find({ trip: req.params.id })
    .populate("reviewer", "name")
    .populate("reviewee", "name")
    .sort({ createdAt: -1 });

  res.json(reviews);
};
