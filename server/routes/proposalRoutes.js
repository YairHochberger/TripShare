const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  castVote,
  decideProposal,
} = require("../controllers/changeProposalController");

router.post("/:id/vote", auth, castVote);
router.patch("/:id", auth, decideProposal);

module.exports = router;
