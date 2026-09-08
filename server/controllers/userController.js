const User = require("../models/User");
const Trip = require("../models/Trip");
const Review = require("../models/Review");

// The signed-in user's own profile, including private fields.
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

exports.updateMe = async (req, res) => {
  const { name, bio, experienceLevel, emergencyContact } = req.body;

  if (experienceLevel && !User.EXPERIENCE_LEVELS.includes(experienceLevel)) {
    return res.status(400).json({ message: "Invalid experience level" });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (bio !== undefined) updates.bio = bio;
  if (experienceLevel !== undefined) updates.experienceLevel = experienceLevel;
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

// Anyone else's profile - public fields only, so an emergency
// contact is never exposed to other users.
exports.getUser = async (req, res) => {
  const user = await User.findById(req.params.id).select(User.PUBLIC_FIELDS);
  if (!user) return res.status(404).json({ message: "User not found" });

  res.json(user);
};

// Their trip history, so you can see what someone has actually done
// before deciding to travel with them.
exports.getUserTrips = async (req, res) => {
  const userId = req.params.id;

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
  const reviews = await Review.find({ reviewee: req.params.id })
    .sort({ createdAt: -1 })
    .populate("reviewer", "name")
    .populate("trip", "title");

  res.json(reviews);
};
