const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const speakeasy = require("speakeasy");
const qrcode = require("qrcode");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const { sendResetEmail } = require("../services/emailService");
const activityController = require("./activityLogController");

// Registration API
exports.register = async (req, res) => {
  const { email, password, username, role } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      email,
      password: hashedPassword,
      username,
      role,
    });
    await newUser.save();

    await activityController.createActivityLog(
      newUser._id,
      `User registered with email ${newUser.email}`
    );

    return res
      .status(201)
      .json({ message: "User registered successfully", data: newUser });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const foundUser = await User.findOne({ email }).select("+password");
    if (!foundUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, foundUser.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: foundUser._id },
      process.env.JWT_SECRET, 
      { expiresIn: "1h" } 
    );
    if (foundUser.mfaEnabled && foundUser.mfaSecret) {
      return res.status(200).json({
        success: true,
        mfaEnabled: true,
        message: "MFA is required. Please verify with your MFA token.",
        mfaSecret: foundUser.mfaSecret,
        userId: foundUser._id,
        data: foundUser,
      });
    }

    const secret = speakeasy.generateSecret({ length: 4 }); 
    foundUser.mfaSecret = secret.base32.slice(0, 8); 
    foundUser.mfaEnabled = true;
    await foundUser.save();

    const otpauthURL = `otpauth://totp/${foundUser._id}?secret=${foundUser.mfaSecret}`;

    qrcode.toDataURL(otpauthURL, (err, dataUrl) => {
      if (err) {
        console.error("QR Code generation error:", err);
        return res.status(500).json({ message: "QR code generation failed" });
      }
      res.status(200).json({
        success: true,
        mfaEnabled: true,
        message: "MFA setup required. Scan the QR code.",
        mfaSecret: foundUser.mfaSecret,
        qrcode: dataUrl,
        userId: foundUser._id,
        data: foundUser,
        token,
      });
    });

    await activityController.createActivityLog(
      foundUser._id,
      `MFA enabled and QR code provided for user ${foundUser.email}`
    );
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify MFA Token API
exports.verifyMFA = async (req, res) => {
  const { userId, mfaToken } = req.body;

  try {
    const user = await User.findById(userId);
    // console.log("user", user);
    if (!user || !user.mfaEnabled) {
      return res
        .status(400)
        .json({ message: "MFA is not enabled for this user" });
    }

    const isTokenValid = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: mfaToken,
    });

    if (!isTokenValid) {
      return res.status(400).json({ message: "Invalid MFA token" });
    }

    const token = jwt.sign(
      { user: { id: user._id, email: user.email } },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    await activityController.createActivityLog(
      user._id,
      `MFA token verified for user ${user.email}`
    );

    return res.status(200).json({
      success: true,
      message: "MFA verified successfully",
      token,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 15 * 60 * 1000;
    await user.save();

    // Send reset email
    await sendResetEmail(user.email, resetToken);

    await activityController.createActivityLog(
      user._id,
      `Password reset requested for user ${user.email}`
    );
    return res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.resetTokenExpiration < Date.now()) {
      return res.status(400).json({ message: "Reset token has expired" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    await activityController.createActivityLog(
      user._id,
      `Password reset requested for user ${user.email}`
    );

    return res.json({ message: "Password successfully reset" });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      username: user.username,
      email: user.email,
      file: user.file,
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { userId } = req.params; 
  const { username, email } = req.body;
  let updatedFields = { username, email };

  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    updatedFields.file = result.secure_url;
    fs.unlinkSync(req.file.path);
  }

  try {
    const user = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
    });
    if (!user) return res.status(404).json({ message: "User not found" });

    await activityController.createActivityLog(
      user._id,
      `User profile updated`
    );
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.log("error", error);
    return res.status(500).json({ message: "Server error" });
  }
};
