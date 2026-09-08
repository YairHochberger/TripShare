const mongoose = require("mongoose");

// Fields the group can be asked to approve a change to. "other" covers
// anything not stored as a simple field (a lodging night, a travel step,
// adding or removing something) - it is described in words and applied by
// the organizer by hand once the group agrees.
const FIELDS = {
  title: { label: "Trip title", cast: (v) => String(v) },
  description: { label: "Description", cast: (v) => String(v) },
  meetingLocation: { label: "Meeting location", cast: (v) => String(v) },
  startDate: { label: "Start date", cast: (v) => new Date(v) },
  endDate: { label: "End date", cast: (v) => new Date(v) },
  maxCapacity: { label: "Max participants", cast: (v) => Number(v) },
  costPerPerson: { label: "Cost per person", cast: (v) => Number(v) },
  paymentDueDate: { label: "Payment due date", cast: (v) => new Date(v) },
  estimatedCost: { label: "Estimated cost", cast: (v) => Number(v) },
  finalCostDueDate: { label: "Final price confirmed by", cast: (v) => new Date(v) },

  // Structured: approving this appends a stop to the trip's travel plan,
  // so it shows up on the map for everyone.
  addDestination: { label: "Add a destination", cast: null, structured: true },

  other: { label: "Something else", cast: null },
};

const STATUSES = ["pending", "approved", "rejected", "tied", "cancelled"];

const changeProposalSchema = new mongoose.Schema(
  {
    trip: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true },
    proposedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    field: { type: String, enum: Object.keys(FIELDS), required: true },

    // Kept as text purely so the old and new values can be shown side by side.
    oldValue: { type: String, default: "" },
    newValue: { type: String, default: "" },

    // Why the change is being asked for (and, for "other", what it is).
    note: { type: String, default: "" },

    // Structured proposals (currently "addDestination") carry their data
    // here rather than squeezing it into newValue.
    payload: {
      location: String,
      description: String,
      mode: String,
      lat: Number,
      lng: Number,
    },

    closesAt: { type: Date, required: true },
    status: { type: String, enum: STATUSES, default: "pending" },
  },
  { timestamps: true }
);

const ChangeProposal = mongoose.model("ChangeProposal", changeProposalSchema);
ChangeProposal.FIELDS = FIELDS;
ChangeProposal.STATUSES = STATUSES;

module.exports = ChangeProposal;
