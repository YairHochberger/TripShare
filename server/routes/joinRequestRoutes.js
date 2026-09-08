const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { decideJoinRequest } = require("../controllers/joinRequestController");
const {
  getJoinRequestMessages,
  sendJoinRequestMessage,
} = require("../controllers/messageController");

router.patch("/:id", auth, decideJoinRequest);

router.get("/:id/messages", auth, getJoinRequestMessages);
router.post("/:id/messages", auth, sendJoinRequestMessage);

module.exports = router;
