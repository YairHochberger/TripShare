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
const {
  getRecap,
  addPhoto,
  deletePhoto,
} = require("../controllers/recapController");
const { upload } = require("../middleware/uploadMiddleware");

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

router.get("/:id/recap", auth, getRecap);
router.post("/:id/photos", auth, upload.single("photo"), addPhoto);
router.delete("/:id/photos/:photoId", auth, deletePhoto);

module.exports = router;
