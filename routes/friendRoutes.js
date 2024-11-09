const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware");
const friendController = require("../controllers/friendController");

router.post(
  "/send-request",
  authMiddleware,
  friendController.sendFriendRequest
);

router.post(
  "/accept-friend-request/:requestId",
  authMiddleware,
  friendController.acceptFriendRequest
);

router.get('/list/:userId', authMiddleware, friendController.getFriends);

module.exports = router;
