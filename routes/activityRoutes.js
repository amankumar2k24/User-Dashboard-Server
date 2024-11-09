const express = require("express");
const router = express.Router();
const activityController = require("../controllers/activityLogController");
const authMiddleware = require("../middlewares/authMiddleware");

router.get("/logs", authMiddleware, activityController.getUserActivity);

module.exports = router;
