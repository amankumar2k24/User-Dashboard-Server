const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authMiddleware = require("../middlewares/authMiddleware");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

router.post("/register", userController.register);
router.post("/login", userController.login);
router.post("/verify-mfa", userController.verifyMFA);

router.post("/request-password-reset", userController.requestPasswordReset);
router.post("/reset-password/:token", userController.resetPassword);

router.get("/profile", authMiddleware, userController.getUserProfile);

router.put(
  "/profile/:userId",
  upload.single("file"),
  authMiddleware,
  userController.updateUserProfile
);

module.exports = router;
