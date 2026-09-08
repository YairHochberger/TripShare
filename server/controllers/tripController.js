const Trip = require("../models/Trip");
const JoinRequest = require("../models/JoinRequest");
const Review = require("../models/Review");
const User = require("../models/User");
const { notifyFollowersOfTrip } = require("./followController");

// Which status an organizer is allowed to move a trip to, from where.
// "full" is left out on purpose: the system sets it when capacity is reached.
const ALLOWED_STATUS_CHANGES = {
  open: ["locked", "completed", "cancelled"],
  locked: ["open", "completed", "cancelled"],
  full: ["locked", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

function withViewerInfo(trip, userId, pendingRequestTripIds) {
  const obj = trip.toObject();
  const isOrganizer = String(trip.organizer._id || trip.organizer) === String(userId);
  const isMember = trip.members.some(
    (m) => String(m._id || m) === String(userId)
  );

  obj.role = isOrganizer ? "organizer" : isMember ? "participant" : null;
  obj.hasPendingRequest = pendingRequestTripIds.has(String(trip._id));

  return obj;
}

// GET ALL TRIPS (browse/discover + trips the user is involved in)
// Private trips stay out of browse unless you're already on them - they
// are reached through their invite link instead.
exports.getTrips = async (req, res) => {
  const trips = await Trip.find({
    $or: [
      { isPrivate: { $ne: true } },
      { organizer: req.user.id },
      { members: req.user.id },
    ],
  })
    .sort({ createdAt: -1 })
    .populate("organizer", User.PUBLIC_FIELDS)
    .populate("members", User.PUBLIC_FIELDS);

  const myPendingRequests = await JoinRequest.find({
    requester: req.user.id,
    status: "pending",
  });
  const pendingRequestTripIds = new Set(
    myPendingRequests.map((r) => String(r.trip))
  );

  res.json(trips.map((trip) => withViewerInfo(trip, req.user.id, pendingRequestTripIds)));
};

// CREATE TRIP
exports.createTrip = async (req, res) => {
  const {
    title,
    description,
    type,
    startDate,
    endDate,
    meetingLocation,
    maxCapacity,
    estimatedCost,
    finalCostDueDate,
    costPerPerson,
    paymentDueDate,
    lodgingPlan,
    travelPlan,
    isPrivate,
  } = req.body;

  if (!title) {
    return res.status(400).json({ message: "Title is required" });
  }

  const trip = await Trip.create({
    title,
    description,
    type,
    startDate,
    endDate,
    meetingLocation,
    maxCapacity,
    estimatedCost,
    finalCostDueDate,
    costPerPerson,
    paymentDueDate,
    lodgingPlan,
    travelPlan,
    isPrivate: Boolean(isPrivate),
    organizer: req.user.id,
    members: [],
  });

  // Followers hear about public trips only - an invite-only trip stays
  // invite-only regardless of who follows the organizer.
  if (!trip.isPrivate) await notifyFollowersOfTrip(trip);

  res.json(trip);
};

// GET SINGLE TRIP
exports.getTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    // Email is needed to send the organizer a payment message, but only
    // people on the trip get it - it is stripped below for everyone else.
    .populate("organizer", `${User.PUBLIC_FIELDS} email`)
    .populate("members", User.PUBLIC_FIELDS);

  if (!trip) return res.status(404).json({ message: "Not found" });

  const isOrganizer = String(trip.organizer._id) === String(req.user.id);
  const isMember = trip.members.some((m) => String(m._id) === String(req.user.id));

  // A private trip opens to the people on it, or to whoever holds the
  // invite link the organizer shared.
  if (trip.isPrivate && !isOrganizer && !isMember) {
    if (req.query.invite !== trip.inviteToken) {
      return res.status(403).json({
        message: "This trip is private. Ask the organizer for the invite link.",
      });
    }
  }

  const myPendingRequests = await JoinRequest.find({
    requester: req.user.id,
    status: "pending",
  });
  const pendingRequestTripIds = new Set(
    myPendingRequests.map((r) => String(r.trip))
  );

  const result = withViewerInfo(trip, req.user.id, pendingRequestTripIds);

  if (!result.role) {
    delete result.organizer.email;
  }

  // Only the organizer needs the token - they're the one sharing it.
  if (!isOrganizer) delete result.inviteToken;

  // So an applicant can open their own thread with the organizer.
  const myRequest = myPendingRequests.find(
    (r) => String(r.trip) === String(trip._id)
  );
  result.myJoinRequestId = myRequest ? myRequest._id : null;

  if (isOrganizer) {
    result.joinRequests = await JoinRequest.find({
      trip: trip._id,
      status: "pending",
    }).populate("requester", User.PUBLIC_FIELDS);
  }

  // Who the viewer has already reviewed on this trip, so the UI
  // can hide the form for those people.
  const myReviews = await Review.find({ trip: trip._id, reviewer: req.user.id });
  result.reviewedUserIds = myReviews.map((r) => String(r.reviewee));

  res.json(result);
};

// REQUEST TO JOIN A TRIP
exports.requestJoin = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) === String(req.user.id)) {
    return res.status(400).json({ message: "You organize this trip" });
  }

  if (trip.members.some((m) => String(m) === String(req.user.id))) {
    return res.status(400).json({ message: "You already joined this trip" });
  }

  if (trip.status !== "open") {
    return res.status(400).json({ message: "This trip is not open for join requests" });
  }

  // Private trips accept requests only from people holding the invite.
  if (trip.isPrivate && req.body.invite !== trip.inviteToken) {
    return res
      .status(403)
      .json({ message: "This trip is private. You need the organizer's invite link." });
  }

  const existing = await JoinRequest.findOne({
    trip: trip._id,
    requester: req.user.id,
    status: "pending",
  });
  if (existing) {
    return res.status(400).json({ message: "You already requested to join this trip" });
  }

  const joinRequest = await JoinRequest.create({
    trip: trip._id,
    requester: req.user.id,
  });

  res.json(joinRequest);
};

// LIST PENDING JOIN REQUESTS FOR A TRIP (organizer only)
exports.listJoinRequests = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the organizer can view join requests" });
  }

  const requests = await JoinRequest.find({ trip: trip._id, status: "pending" }).populate(
    "requester",
    User.PUBLIC_FIELDS
  );

  res.json(requests);
};

// LEAVE A TRIP (participants only)
// Cancelling before the payment due date costs nothing; on or after it,
// the fee is still owed because the organizer may already have booked.
exports.leaveTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) === String(req.user.id)) {
    return res
      .status(400)
      .json({ message: "The organizer can't leave - cancel the trip instead" });
  }

  const isMember = trip.members.some((m) => String(m) === String(req.user.id));
  if (!isMember) {
    return res.status(400).json({ message: "You are not a participant on this trip" });
  }

  trip.members = trip.members.filter((m) => String(m) !== String(req.user.id));

  // A spot just opened up.
  if (trip.status === "full") trip.status = "open";
  await trip.save();

  const dueDate = trip.paymentDueDate ? new Date(trip.paymentDueDate) : null;
  const feeOwed = Boolean(trip.costPerPerson > 0 && dueDate && Date.now() >= dueDate.getTime());

  res.json({
    left: true,
    feeOwed,
    amountOwed: feeOwed ? trip.costPerPerson : 0,
    message: feeOwed
      ? "You left the trip. The payment due date has passed, so the fee is still owed to the organizer."
      : "You left the trip. Nothing is owed.",
  });
};

// CHANGE TRIP STATUS (organizer only)
exports.updateTripStatus = async (req, res) => {
  const { status } = req.body;

  const trip = await Trip.findById(req.params.id);
  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (String(trip.organizer) !== String(req.user.id)) {
    return res.status(403).json({ message: "Only the organizer can change the trip status" });
  }

  const allowed = ALLOWED_STATUS_CHANGES[trip.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: `Cannot change a ${trip.status} trip to ${status}`,
    });
  }

  trip.status = status;
  await trip.save();

  res.json(trip);
};
