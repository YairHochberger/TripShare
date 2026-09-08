const JoinRequest = require("../models/JoinRequest");
const Trip = require("../models/Trip");

// APPROVE OR REJECT A JOIN REQUEST (organizer only)
exports.decideJoinRequest = async (req, res) => {
  const { decision } = req.body;

  if (!["approved", "rejected"].includes(decision)) {
    return res.status(400).json({ message: "decision must be 'approved' or 'rejected'" });
  }

  const joinRequest = await JoinRequest.findById(req.params.id);
  if (!joinRequest) return res.status(404).json({ message: "Join request not found" });

  const trip = await Trip.findById(joinRequest.trip);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the organizer can decide join requests" });
  }

  if (joinRequest.status !== "pending") {
    return res.status(400).json({ message: "This request was already decided" });
  }

  joinRequest.status = decision;
  await joinRequest.save();

  if (decision === "approved") {
    trip.members.push(joinRequest.requester);
    if (trip.maxCapacity && trip.members.length >= trip.maxCapacity) {
      trip.status = "full";
    }
    await trip.save();
  }

  res.json(joinRequest);
};
