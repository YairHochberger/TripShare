const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getNotifications,
  markNotificationsRead,
} = require("../controllers/followController");

router.get("/", auth, getNotifications);
router.patch("/read", auth, markNotificationsRead);

module.exports = router;
