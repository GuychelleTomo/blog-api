const express = require("express");

const {
  registerUser,
  verifyEmail,
  loginUser,
  getMe,
  refreshToken,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const {
  validateUserRegistration,
  validateVerifyEmail,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateRefreshToken,
} = require("../middlewares/validators/authValidator");
const { protect } = require("../middlewares/auth");
const router = express.Router();

router.route("/register").post(validateUserRegistration, registerUser);
router.route("/verify-email").post(validateVerifyEmail, verifyEmail);
router.route("/login").post(validateLogin, loginUser);
router.route("/forgot-password").post(validateForgotPassword, forgotPassword);
router.route("/reset-password").post(validateResetPassword, resetPassword);
router.route("/me").get(protect, getMe);
router.post("/refresh-token", validateRefreshToken, refreshToken);

module.exports = router;
