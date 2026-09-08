const fs = require("fs");
const path = require("path");

const Trip = require("../models/Trip");
const TripPhoto = require("../models/TripPhoto");
const Review = require("../models/Review");
const User = require("../models/User");
const { UPLOAD_DIR } = require("../middleware/uploadMiddleware");

function isOnTrip(trip, userId) {
  return (
    String(trip.organizer._id || trip.organizer) === String(userId) ||
    trip.members.some((m) => String(m._id || m) === String(userId))
  );
}

// Everything the recap needs, assembled from what the trip already knows -
// nothing here is written by hand after the fact.
exports.getRecap = async (req, res) => {
  const trip = await Trip.findById(req.params.id)
    .populate("organizer", User.PUBLIC_FIELDS)
    .populate("members", User.PUBLIC_FIELDS);

  if (!trip) return res.status(404).json({ message: "Trip not found" });

  if (trip.status !== "completed") {
    return res
      .status(400)
      .json({ message: "The recap appears once the trip is marked completed" });
  }

  if (!isOnTrip(trip, req.user.id)) {
    return res
      .status(403)
      .json({ message: "Only people who went on this trip can see the recap" });
  }

  const [photos, reviews] = await Promise.all([
    TripPhoto.find({ trip: trip._id })
      .sort({ createdAt: 1 })
      .populate("uploader", "name"),
    Review.find({ trip: trip._id })
      .populate("reviewer", "name")
      .populate("reviewee", "name"),
  ]);

  const nights =
    trip.startDate && trip.endDate
      ? Math.max(
          0,
          Math.round(
            (new Date(trip.endDate) - new Date(trip.startDate)) / 86400000
          )
        )
      : null;

  const scores = reviews.map((r) => r.score);
  const averageScore = scores.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : null;

  res.json({
    trip: {
      _id: trip._id,
      title: trip.title,
      description: trip.description,
      type: trip.type,
      startDate: trip.startDate,
      endDate: trip.endDate,
      meetingLocation: trip.meetingLocation,
      costPerPerson: trip.costPerPerson,
      lodgingPlan: trip.lodgingPlan,
      travelPlan: trip.travelPlan,
      organizer: trip.organizer,
      members: trip.members,
    },
    stats: {
      nights,
      people: trip.members.length + 1,
      stops: (trip.travelPlan || []).length,
      lodgingNights: (trip.lodgingPlan || []).length,
      photos: photos.length,
      reviews: reviews.length,
      averageScore,
    },
    photos: photos.map((p) => ({
      _id: p._id,
      url: `/uploads/${p.filename}`,
      caption: p.caption,
      uploader: p.uploader,
      createdAt: p.createdAt,
      isMine: String(p.uploader._id) === String(req.user.id),
    })),
    reviews,
  });
};

exports.addPhoto = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "Choose an image first" });

  const removeFile = () =>
    fs.promises.unlink(path.join(UPLOAD_DIR, req.file.filename)).catch(() => {});

  const trip = await Trip.findById(req.params.id);
  if (!trip) {
    await removeFile();
    return res.status(404).json({ message: "Trip not found" });
  }

  if (!isOnTrip(trip, req.user.id)) {
    await removeFile();
    return res
      .status(403)
      .json({ message: "Only people who went on this trip can add photos" });
  }

  const photo = await TripPhoto.create({
    trip: trip._id,
    uploader: req.user.id,
    filename: req.file.filename,
    caption: (req.body.caption || "").slice(0, 200),
  });

  res.json(await photo.populate("uploader", "name"));
};

// Your own photo, or any photo if you organized the trip.
exports.deletePhoto = async (req, res) => {
  const photo = await TripPhoto.findById(req.params.photoId);
  if (!photo) return res.status(404).json({ message: "Photo not found" });

  const trip = await Trip.findById(photo.trip);
  const isOrganizer = trip && String(trip.organizer) === String(req.user.id);
  const isMine = String(photo.uploader) === String(req.user.id);

  if (!isMine && !isOrganizer) {
    return res.status(403).json({ message: "That isn't your photo" });
  }

  await fs.promises
    .unlink(path.join(UPLOAD_DIR, photo.filename))
    .catch(() => {});
  await photo.deleteOne();

  res.json({ ok: true });
};
