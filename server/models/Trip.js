const mongoose = require("mongoose");
const crypto = require("crypto");

const TRIP_TYPES = ["relaxed", "trek", "climbing", "other"];
const TRIP_STATUSES = ["open", "full", "locked", "completed", "cancelled"];
const LODGING_TYPES = ["tent", "cabin", "hostel", "host_home", "other"];
const TRAVEL_MODES = ["independent", "shared", "other"];

const lodgingNightSchema = new mongoose.Schema(
  {
    date: Date,
    type: { type: String, enum: LODGING_TYPES, default: "other" },
    location: String,
    description: String,

    // Where the organizer actually booked it, so participants can open
    // the listing and see what they're signing up for.
    bookingUrl: String,
  },
  { _id: false }
);

const travelStepSchema = new mongoose.Schema(
  {
    description: String,
    mode: { type: String, enum: TRAVEL_MODES, default: "independent" },
    location: String,

    // Set by the organizer clicking the map. Optional: a step can be
    // described in words without being pinned to a point.
    lat: Number,
    lng: Number,
  },
  { _id: false }
);

const tripSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: TRIP_TYPES, default: "other" },

    startDate: Date,
    endDate: Date,
    meetingLocation: String,
    maxCapacity: { type: Number, default: 0 },

    // Simulated payment: no real gateway. The organizer sets a cost and a
    // due date; paying opens a pre-filled email to the organizer.
    //
    // estimatedCost is the rough figure given when the trip is created.
    // costPerPerson is the exact figure, confirmed later - by
    // finalCostDueDate at the latest, so nobody is surprised late on.
    estimatedCost: { type: Number, default: 0 },
    finalCostDueDate: Date,
    costPerPerson: { type: Number, default: 0 },
    paymentDueDate: Date,

    lodgingPlan: [lodgingNightSchema],
    travelPlan: [travelStepSchema],

    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status: { type: String, enum: TRIP_STATUSES, default: "open" },

    // A private trip is kept out of browse and search. The organizer
    // shares the invite token instead; anyone holding it can view the
    // trip and ask to join.
    isPrivate: { type: Boolean, default: false },
    inviteToken: {
      type: String,
      default: () => crypto.randomBytes(12).toString("hex"),
      index: true,
    },
  },
  { timestamps: true }
);

const Trip = mongoose.model("Trip", tripSchema);
Trip.TYPES = TRIP_TYPES;
Trip.STATUSES = TRIP_STATUSES;
Trip.LODGING_TYPES = LODGING_TYPES;
Trip.TRAVEL_MODES = TRAVEL_MODES;

module.exports = Trip;
