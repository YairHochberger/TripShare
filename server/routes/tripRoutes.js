const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getTrips,
  createTrip,
  getTrip,
  requestJoin,
  listJoinRequests,
  updateTripStatus,
  leaveTrip,
} = require("../controllers/tripController");

const { createReview, getTripReviews } = require("../controllers/reviewController");
const {
  getTripMessages,
  sendTripMessage,
} = require("../controllers/messageController");
const {
  createProposal,
  getProposals,
} = require("../controllers/changeProposalController");

router.get("/", auth, getTrips);
router.post("/", auth, createTrip);
router.get("/:id", auth, getTrip);

router.post("/:id/join", auth, requestJoin);
router.get("/:id/join-requests", auth, listJoinRequests);
router.patch("/:id/status", auth, updateTripStatus);
router.post("/:id/leave", auth, leaveTrip);

router.post("/:id/reviews", auth, createReview);
router.get("/:id/reviews", auth, getTripReviews);

router.get("/:id/messages", auth, getTripMessages);
router.post("/:id/messages", auth, sendTripMessage);

router.get("/:id/proposals", auth, getProposals);
router.post("/:id/proposals", auth, createProposal);

module.exports = router;
