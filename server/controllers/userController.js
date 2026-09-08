const User = require("../models/User");
const Trip = require("../models/Trip");
const Review = require("../models/Review");

// Everyone the viewer shares a trip with - as organizer or participant,
// in either direction. A private profile opens up to exactly this set.
async function tripMatesOf(userId) {
  const trips = await Trip.find({
    $or: [{ organizer: userId }, { members: userId }],
  }).select("organizer members");

  const mates = new Set();
  for (const trip of trips) {
    mates.add(String(trip.organizer));
    trip.members.forEach((m) => mates.add(String(m)));
  }
  mates.delete(String(userId));

  return mates;
}

async function canSeeProfile(viewerId, target) {
  if (String(viewerId) === String(target._id)) return true;
  if (!target.isPrivate) return true;

  const mates = await tripMatesOf(viewerId);
  return mates.has(String(target._id));
}

// The signed-in user's own profile, including private fields.
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

exports.updateMe = async (req, res) => {
  const { name, bio, experienceLevel, emergencyContact, isPrivate } = req.body;

  if (experienceLevel && !User.EXPERIENCE_LEVELS.includes(experienceLevel)) {
    return res.status(400).json({ message: "Invalid experience level" });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (experienceLevel !== undefined) updates.experienceLevel = experienceLevel;
  if (isPrivate !== undefined) updates.isPrivate = Boolean(isPrivate);
  if (emergencyContact !== undefined) {
    updates.emergencyContact = {
      name: emergencyContact.name || "",
      phone: emergencyContact.phone || "",
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.json(user);
};

// Search people by name. Private profiles only surface to the people
// they already share a trip with.
exports.searchUsers = async (req, res) => {
  const term = (req.query.q || "").trim();
  if (term.length < 2) return res.json([]);

  // Escape it: a name is a search term, never a pattern.
  const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const matches = await User.find({ name: { $regex: safe, $options: "i" } })
    .select(`${User.PUBLIC_FIELDS} isPrivate`)
    .limit(40);

  const mates = await tripMatesOf(req.user.id);

  const visible = matches.filter(
    (u) =>
      !u.isPrivate ||
      String(u._id) === String(req.user.id) ||
      mates.has(String(u._id))
  );

  res.json(
    visible.map((u) => ({
      ...u.toObject(),
      isYou: String(u._id) === String(req.user.id),
    }))
  );
};

// Anyone else's profile - public fields only, so an emergency
// contact is never exposed to other users.
exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select(
    `${User.PUBLIC_FIELDS} isPrivate`
  );
  if (!user) return res.status(404).json({ message: "User not found" });

  if (!(await canSeeProfile(req.user.id, user))) {
    // Name still comes back: it appears on trips and join requests, and
    // hiding it there would break those screens.
    return res.json({
      _id: user._id,
      name: user.name,
      isPrivate: true,
      restricted: true,
    });
  }

  res.json(user);
};

// Their trip history, so you can see what someone has actually done
// before deciding to travel with them.
exports.getUserTrips = async (req, res) => {
  const userId = req.params.id;

  const target = await User.findById(userId).select("isPrivate");
  if (!target) return res.status(404).json({ message: "User not found" });

  if (!(await canSeeProfile(req.user.id, target))) {
    return res.status(403).json({ message: "This profile is private" });
  }

  const trips = await Trip.find({
    $or: [{ organizer: userId }, { members: userId }],
  })
    .sort({ startDate: -1, createdAt: -1 })
    .select("title type status startDate endDate meetingLocation organizer members");

  res.json(
    trips.map((t) => ({
      _id: t._id,
      title: t.title,
      type: t.type,
      status: t.status,
      startDate: t.startDate,
      endDate: t.endDate,
      meetingLocation: t.meetingLocation,
      role: String(t.organizer) === String(userId) ? "organizer" : "participant",
    }))
  );
};

// What other people said about them after a trip.
exports.getUserReviews = async (req, res) => {
  const target = await User.findById(req.params.id).select("isPrivate");
  if (!target) return res.status(404).json({ message: "User not found" });

  if (!(await canSeeProfile(req.user.id, target))) {
    return res.status(403).json({ message: "This profile is private" });
  }

  const reviews = await Review.find({ reviewee: req.params.id })
    .sort({ createdAt: -1 })
    .populate("reviewer", "name")
    .populate("trip", "title");

  res.json(reviews);
};
