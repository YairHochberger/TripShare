const Message = require("../models/Message");
const Trip = require("../models/Trip");
const JoinRequest = require("../models/JoinRequest");
const User = require("../models/User");

// Being on the trip IS the group-chat membership - approving a join
// request therefore adds that person to the chat with no extra step.
function isOnTrip(trip, userId) {
  return (
    String(trip.organizer) === String(userId) ||
    trip.members.some((m) => String(m) === String(userId))
  );
}

function validText(req, res) {
  const text = (req.body.text || "").trim();
  if (!text) {
    res.status(400).json({ message: "Message text is required" });
    return null;
  }
  return text;
}

// ---- Trip group chat ----

exports.getTripMessages = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (!isOnTrip(trip, req.user.id)) {
    return res
      .status(403)
      .json({ message: "Only people on this trip can read its group chat" });
  }

  const messages = await Message.find({ trip: trip._id, type: "trip_group" })
    .sort({ createdAt: 1 })
    .populate("sender", "name");

  res.json(messages);
};

exports.sendTripMessage = async (req, res) => {
  const text = validText(req, res);
  if (text === null) return;

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (!isOnTrip(trip, req.user.id)) {
    return res
      .status(403)
      .json({ message: "Only people on this trip can post in its group chat" });
  }

  const message = await Message.create({
    type: "trip_group",
    trip: trip._id,
    sender: req.user.id,
    text,
  });

  res.json(await message.populate("sender", "name"));
};

// ---- Direct chat (organizer <-> one participant) ----

// Only the two people in the thread may touch it: the trip's organizer,
// and the participant it belongs to.
async function loadDirectThread(req, res) {
  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    res.status(404).json({ message: "Trip not found" });
    return null;
  }

  const participantId = req.params.userId;
  const isOrganizer = String(trip.organizer) === String(req.user.id);
  const isThisParticipant = String(req.user.id) === String(participantId);

  if (!isOrganizer && !isThisParticipant) {
    res.status(403).json({ message: "This conversation isn't yours" });
    return null;
  }

  const onTrip = trip.members.some((m) => String(m) === String(participantId));
  if (!onTrip) {
    res.status(400).json({ message: "That person isn't on this trip" });
    return null;
  }

  return { trip, participantId };
}

exports.getDirectMessages = async (req, res) => {
  const thread = await loadDirectThread(req, res);
  if (!thread) return;

  const messages = await Message.find({
    type: "direct",
    trip: thread.trip._id,
    participant: thread.participantId,
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name");

  res.json(messages);
};

exports.sendDirectMessage = async (req, res) => {
  const text = validText(req, res);
  if (text === null) return;

  const thread = await loadDirectThread(req, res);
  if (!thread) return;

  const message = await Message.create({
    type: "direct",
    trip: thread.trip._id,
    participant: thread.participantId,
    sender: req.user.id,
    text,
  });

  res.json(await message.populate("sender", "name"));
};

// ---- Join request chat (applicant <-> organizer) ----

async function loadJoinRequestThread(req, res) {
  const joinRequest = await JoinRequest.findById(req.params.id);
  if (!joinRequest) {
    res.status(404).json({ message: "Join request not found" });
    return null;
  }

  const trip = await Trip.findById(joinRequest.trip);
  if (!trip) {
    res.status(404).json({ message: "Trip not found" });
    return null;
  }

  const isRequester = String(joinRequest.requester) === String(req.user.id);
  const isOrganizer = String(trip.organizer) === String(req.user.id);

  if (!isRequester && !isOrganizer) {
    res.status(403).json({ message: "This conversation isn't yours" });
    return null;
  }

  return { joinRequest, trip };
}

exports.getJoinRequestMessages = async (req, res) => {
  const thread = await loadJoinRequestThread(req, res);
  if (!thread) return;

  const messages = await Message.find({
    type: "join_request",
    joinRequest: thread.joinRequest._id,
  })
    .sort({ createdAt: 1 })
    .populate("sender", "name");

  res.json(messages);
};

exports.sendJoinRequestMessage = async (req, res) => {
  const text = validText(req, res);
  if (text === null) return;

  const thread = await loadJoinRequestThread(req, res);
  if (!thread) return;

  const message = await Message.create({
    type: "join_request",
    trip: thread.trip._id,
    joinRequest: thread.joinRequest._id,
    sender: req.user.id,
    text,
  });

  res.json(await message.populate("sender", "name"));
};
