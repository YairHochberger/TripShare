const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getMe,
  updateMe,
  searchUsers,
  getUser,
  getUserTrips,
  getUserReviews,
} = require("../controllers/userController");

// Declared before "/:id" so neither path is swallowed by the other.
router.get("/", auth, searchUsers);
router.get("/me", auth, getMe);
router.patch("/me", auth, updateMe);

router.get("/:id", auth, getUser);
router.get("/:id/trips", auth, getUserTrips);
router.get("/:id/reviews", auth, getUserReviews);

module.exports = router;
