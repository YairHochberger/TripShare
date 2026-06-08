const Trip = require("../models/Trip");

// GET ALL TRIPS (user-specific)
exports.getTrips = async (req, res) => {
  const trips = await Trip.find({
    members: req.user.id,
  });

  res.json(trips);
};

// CREATE TRIP
exports.createTrip = async (req, res) => {
  const { title, destination } = req.body;

  const trip = await Trip.create({
    title,
    destination,
    owner: req.user.id,
    members: [req.user.id],
  });

  res.json(trip);
};

// GET SINGLE TRIP
exports.getTrip = async (req, res) => {
  const trip = await Trip.findById(req.params.id);

  if (!trip) return res.status(404).json({ message: "Not found" });

  res.json(trip);
};