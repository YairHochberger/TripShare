const ChangeProposal = require("../models/ChangeProposal");
const Vote = require("../models/Vote");
const Trip = require("../models/Trip");

const FIELDS = ChangeProposal.FIELDS;

function displayValue(field, value) {
  if (value === undefined || value === null || value === "") return "";
  if (["startDate", "endDate", "paymentDueDate"].includes(field)) {
    return new Date(value).toISOString().slice(0, 10);
  }
  return String(value);
}

// Tallies a proposal per the trip rules: everyone on the trip except the
// organizer gets a say, not voting counts as agreeing, and a tie is left
// for the organizer to break.
async function tally(proposal, trip) {
  const votes = await Vote.find({ proposal: proposal._id });

  const voters = trip.members.map(String);
  const objections = votes.filter(
    (v) => !v.agree && voters.includes(String(v.voter))
  ).length;
  const explicitAgrees = votes.filter(
    (v) => v.agree && voters.includes(String(v.voter))
  ).length;

  // Silence is agreement.
  const agrees = voters.length - objections;

  return {
    eligible: voters.length,
    objections,
    explicitAgrees,
    agrees,
    silent: voters.length - objections - explicitAgrees,
  };
}

// Voting windows close on their own; rather than run a scheduler we settle
// any expired proposal the next time someone looks at it.
async function settleIfClosed(proposal, trip) {
  if (proposal.status !== "pending") return proposal;
  if (Date.now() < new Date(proposal.closesAt).getTime()) return proposal;

  const counts = await tally(proposal, trip);

  if (counts.objections > counts.agrees) {
    proposal.status = "rejected";
  } else if (counts.objections === counts.agrees) {
    proposal.status = "tied";
  } else {
    proposal.status = "approved";
    await applyProposal(proposal, trip);
  }

  await proposal.save();
  return proposal;
}

async function applyProposal(proposal, trip) {
  // Approving a destination adds it to the travel plan, so it appears on
  // the map for everyone.
  if (proposal.field === "addDestination") {
    const p = proposal.payload || {};
    trip.travelPlan.push({
      location: p.location,
      description: p.description,
      mode: p.mode || "independent",
      lat: p.lat,
      lng: p.lng,
    });
    await trip.save();
    return;
  }

  const config = FIELDS[proposal.field];
  // "other" is described in words - the organizer applies it themselves.
  if (!config || !config.cast) return;

  trip[proposal.field] = config.cast(proposal.newValue);
  await trip.save();
}

function isOnTrip(trip, userId) {
  return (
    String(trip.organizer) === String(userId) ||
    trip.members.some((m) => String(m) === String(userId))
  );
}

// CREATE A PROPOSAL (organizer only)
exports.createProposal = async (req, res) => {
  const { field, newValue, note, votingDays, payload } = req.body;

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the organizer can propose changes" });
  }

  if (["completed", "cancelled"].includes(trip.status)) {
    return res.status(400).json({ message: `You can't change a ${trip.status} trip` });
  }

  if (!FIELDS[field]) {
    return res.status(400).json({ message: "Unknown field" });
  }

  const freeform = field === "other" || field === "addDestination";

  if (field === "other" && !note?.trim()) {
    return res.status(400).json({ message: "Describe the change you want to make" });
  }

  if (field === "addDestination") {
    if (!payload?.location?.trim()) {
      return res.status(400).json({ message: "Give the destination a name" });
    }
    if (typeof payload.lat !== "number" || typeof payload.lng !== "number") {
      return res.status(400).json({ message: "Place the destination on the map" });
    }
  }

  if (!freeform && (newValue === undefined || newValue === "")) {
    return res.status(400).json({ message: "A new value is required" });
  }

  const days = Number(votingDays) > 0 ? Number(votingDays) : 3;

  const proposal = await ChangeProposal.create({
    trip: trip._id,
    proposedBy: req.user.id,
    field,
    oldValue: freeform ? "" : displayValue(field, trip[field]),
    newValue: freeform ? "" : displayValue(field, newValue),
    note: note || "",
    payload: field === "addDestination" ? payload : undefined,
    closesAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
  });

  res.json(proposal);
};

// LIST PROPOSALS FOR A TRIP
exports.getProposals = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (!isOnTrip(trip, req.user.id)) {
    return res
      .status(403)
      .json({ message: "Only people on this trip can see proposed changes" });
  }

  const proposals = await ChangeProposal.find({ trip: trip._id }).sort({
    createdAt: -1,
  });

  const result = [];
  for (const proposal of proposals) {
    await settleIfClosed(proposal, trip);

    const counts = await tally(proposal, trip);
    const myVote = await Vote.findOne({ proposal: proposal._id, voter: req.user.id });

    result.push({
      ...proposal.toObject(),
      fieldLabel: FIELDS[proposal.field]?.label || proposal.field,
      counts,
      myVote: myVote ? myVote.agree : null,
    });
  }

  res.json(result);
};

// VOTE ON A PROPOSAL (participants only - the organizer breaks ties instead)
exports.castVote = async (req, res) => {
  const { agree } = req.body;
  if (typeof agree !== "boolean") {
    return res.status(400).json({ message: "agree must be true or false" });
  }

  const proposal = await ChangeProposal.findById(req.params.id);
  if (!proposal) return res.status(404).json({ message: "Proposal not found" });

  const trip = await Trip.findById(proposal.trip);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) === String(req.user.id)) {
    return res
      .status(403)
      .json({ message: "The organizer doesn't vote - you decide if it ties" });
  }

  if (!trip.members.some((m) => String(m) === String(req.user.id))) {
    return res.status(403).json({ message: "Only participants can vote" });
  }

  await settleIfClosed(proposal, trip);
  if (proposal.status !== "pending") {
    return res.status(400).json({ message: "Voting on this proposal has closed" });
  }

  await Vote.findOneAndUpdate(
    { proposal: proposal._id, voter: req.user.id },
    { agree },
    { upsert: true, new: true }
  );

  res.json({ ok: true, agree });
};

// ORGANIZER RESOLVES A TIE, OR WITHDRAWS A PROPOSAL
exports.decideProposal = async (req, res) => {
  const { decision } = req.body;
  if (!["approved", "cancelled"].includes(decision)) {
    return res
      .status(400)
      .json({ message: "decision must be 'approved' or 'cancelled'" });
  }

  const proposal = await ChangeProposal.findById(req.params.id);
  if (!proposal) return res.status(404).json({ message: "Proposal not found" });

  const trip = await Trip.findById(proposal.trip);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the organizer can do that" });
  }

  // Approving is only the organizer's call when the group has tied.
  if (decision === "approved" && proposal.status !== "tied") {
    return res
      .status(400)
      .json({ message: "You can only decide a proposal the group tied on" });
  }

  if (decision === "cancelled" && !["pending", "tied"].includes(proposal.status)) {
    return res.status(400).json({ message: "This proposal is already settled" });
  }

  proposal.status = decision;
  if (decision === "approved") await applyProposal(proposal, trip);
  await proposal.save();

  res.json(proposal);
};
