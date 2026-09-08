const mongoose = require("mongoose");

const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"];

const ratingSchema = new mongoose.Schema(
  {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,

    bio: { type: String, default: "" },
    experienceLevel: {
      type: String,
      enum: EXPERIENCE_LEVELS,
      default: "beginner",
    },

    // Entered once on the profile and reused across every trip.
    // Deliberately kept out of PUBLIC_FIELDS - only the owner sees it.
    emergencyContact: {
      name: { type: String, default: "" },
      phone: { type: String, default: "" },
    },

    // A private profile is hidden from search and from strangers. People
    // who share a trip with them can still see it, so the group can vet
    // each other.
    isPrivate: { type: Boolean, default: false },

    // Kept separately so the same person can be trusted differently
    // as an organizer than as a participant.
    organizerRating: { type: ratingSchema, default: () => ({}) },
    participantRating: { type: ratingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
User.EXPERIENCE_LEVELS = EXPERIENCE_LEVELS;
User.PUBLIC_FIELDS = "name bio experienceLevel organizerRating participantRating";

module.exports = User;
