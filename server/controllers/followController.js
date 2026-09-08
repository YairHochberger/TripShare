const Follow = require("../models/Follow");
const Notification = require("../models/Notification");
const User = require("../models/User");

exports.followUser = async (req, res) => {
  const organizerId = req.params.id;

  if (String(organizerId) === String(req.user.id)) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  const organizer = await User.findById(organizerId).select("_id");
  if (!organizer) return res.status(404).json({ message: "User not found" });

  await Follow.findOneAndUpdate(
    { follower: req.user.id, organizer: organizerId },
    { follower: req.user.id, organizer: organizerId },
    { upsert: true }
  );

  res.json({ following: true });
};

exports.unfollowUser = async (req, res) => {
  await Follow.deleteOne({ follower: req.user.id, organizer: req.params.id });
  res.json({ following: false });
};

// Who the signed-in user follows, and how many follow them.
exports.getFollowState = async (req, res) => {
  const [following, followerCount] = await Promise.all([
    Follow.exists({ follower: req.user.id, organizer: req.params.id }),
    Follow.countDocuments({ organizer: req.params.id }),
  ]);

  res.json({ following: Boolean(following), followerCount });
};

// Called when a public trip is created: everyone following that
// organizer gets one notification.
exports.notifyFollowersOfTrip = async (trip) => {
  const followers = await Follow.find({ organizer: trip.organizer }).select("follower");
  if (followers.length === 0) return;

  await Notification.insertMany(
    followers.map((f) => ({
      user: f.follower,
      type: "new_trip",
      actor: trip.organizer,
      trip: trip._id,
    }))
  );
};

exports.getNotifications = async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(30)
    .populate("actor", "name")
    .populate("trip", "title type startDate meetingLocation");

  // A notification whose trip has since been deleted has nothing to open.
  res.json(notifications.filter((n) => n.trip));
};

exports.markNotificationsRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, readAt: { $exists: false } },
    { readAt: new Date() }
  );

  res.json({ ok: true });
};
