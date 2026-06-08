const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getTrips,
  createTrip,
  getTrip,
} = require("../controllers/tripController");

router.get("/", auth, getTrips);
router.post("/", auth, createTrip);
router.get("/:id", auth, getTrip);

module.exports = router;