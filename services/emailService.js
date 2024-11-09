const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

const sendResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.BASE_URL}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Password Reset Request",
    text: `You requested a password reset. Click the link below to reset your password:\n\n${resetLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {
  sendResetEmail,
}