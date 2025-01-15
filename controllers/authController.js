const User = require("../models/userModel");
const asyncHandler = require("../middlewares/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { sendEmail } = require("../utils/emailService");
const crypto = require("crypto");

// @desc    register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.registerUser = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;
  let user = await User.findOne({ email });
  if (user) {
    return ApiResponse.error("User already exists", 400).send(res);
  }
  user = await User.create({ username, email, password });
  const emailVerificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  // Envoyer un email de verification
  try {
    await sendEmail({
      email: user.email,
      subject: "Email Verification",
      message: `Your verification code is ${emailVerificationToken}. This code will expire in 10 minutes.`,
    });

    return ApiResponse.success(
      "User registered successfully. Please verify your email"
    ).send(res);
  } catch (error) {
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return ApiResponse.error("Failed to send verification email", 500).send(
      res
    );
  }
});

// @desc    Verify email
// @route   POST /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const hashedToken = crypto.createHash("sha256").update(otp).digest("hex");

  const user = await User.findOne({
    email,
    emailVerificationToken: hashedToken,
    emailVerificationTokenExpire: { $gt: Date.now() },
  });

  if (!user) {
    return ApiResponse.error("Invalid or expired token", 404).send(res);
  }

  // update user
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationTokenExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.loginUser = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  // Vérifier si l'utilisateur existe
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return ApiResponse.error("Invalid credentials", 401).send(res);
  }
  // Vérifier si l'utilisateur est vérifié
  if (!user.isEmailVerified) {
    return ApiResponse.error("Please verify your email first", 401).send(res);
  }
  // Compare le mot de passe
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return ApiResponse.error("Invalid credentials", 401).send(res);
  }


  // générer refresh token et le sauvegarde
  const refreshToken = user.generateRefreshToken();
  await user.save()
  
  sendTokenResponse(user, 200, res,refreshToken);
});


//@desc current user
// @route POST/api/vi/auth/me
// @access Private

exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select(" -refreshTokens");
  ApiResponse.success("User fetched successfully", user).send(res);
})


// @desc    Refresh token
// @route   POST /api/v1/auth/refresh-token
// @access  Public

exports.refreshToken = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return ApiResponse.error("Refresh token is required", 400).send(res);
  }

  try{
    const user = await User.findOne({refreshTokens: refreshToken});
    if(!user || !user.verifyRefreshToken(refreshToken)){
      return ApiResponse.error("Invalid refresh token", 401).send(res)
  }
  // generer nouveaux tokens
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

// retirer l'ancien refresh token
  user.removeRefreshToken(refreshToken);
  await user.save();

  return ApiResponse.success("Tokens refreshed successfully",{
    accessToken,
    refreshToken: newRefreshToken
  }).send(res);
  }catch(error){
    return ApiResponse.error("Invalid refresh token", 401).send(res)
  }

})





// @desc   Forgot password
// @route  POST /api/v1/auth/forgot-password
// @access Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return ApiResponse.error("There is no user with that email", 404).send(res);
  }
  // Générer un token de réinitialisation de mot de passe
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });
  // Envoyer un email de réinitialisation de mot de passe
  try {
    await sendEmail({
      email: user.email,
      subject: "Password reset token",
      message: `Your password reset token is ${resetToken}. It will expire in 10 minutes.`,
    });

    ApiResponse.success("Token sent to email. Please check your email").send(
      res
    );
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordTokenExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return ApiResponse.error("Email could not be sent", 500).send(res);
  }
});

// @desc   Reset password
// @route  PUT /api/v1/auth/reset-password
// @access Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  // Hash le token
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.body.resetPasswordToken)
    .digest("hex");

  // Chercher le user
  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordTokenExpire: { $gt: Date.now() },
  });
  if (!user) {
    return ApiResponse.error("Invalid token", 400).send(res);
  }
  // Mettre à jour le mot de passe
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordTokenExpire = undefined;
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

const sendTokenResponse = (user, statusCode, res,refreshToken=null) => {
  const accessToken = user.generateAccessToken();

  const options ={
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  }
  if(process.env.NODE_ENV === 'production'){
    options.secure = true;
  }
  const response = {
    accessToken,
  }

  if(refreshToken){
    response.refreshToken = refreshToken;
  }

  ApiResponse.success(
    "Authentication successful",response, statusCode)
    .cookie("token", accessToken, options)
    .send(res);
};
