const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authMiddleware = require("../middlewares/authMiddleware");

router.post("/send", authMiddleware, chatController.sendMessage);
router.get("/messages", authMiddleware, chatController.getMessages);

module.exports = router;
