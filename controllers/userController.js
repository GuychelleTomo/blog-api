const User = require("../models/userModel");
const asyncHandler = require("../middlewares/asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const { deleteOldImage } = require("../utils/fileUpload");

// @desc    get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await User.find().select("-password");
  return ApiResponse.success("Users fetched successfully", users).send(res);
});

// @desc    get single user
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = asyncHandler(async (req, res, next) => {
  const userID = req.params.id;
  const user = await User.findById(userID).select("-password");
  if (!user) {
    return ApiResponse.error("User not found", 404).send(res);
  }
  return ApiResponse.success("User fetched successfully", user).send(res);
});

// @desc    update user
// @route   PUT /api/v1/users/:id
// @access  Private
exports.updateUser = asyncHandler(async (req, res, next) => {
  const userID = req.params.id;
  let user = await User.findById(userID);
  if (!user) {
    return ApiResponse.error("User not found", 404).send(res);
  }
  // Vérifier si l'utilisateur a le droit de modifier l'utilisateur
  if (user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return ApiResponse.error("Not authorized to update this user", 403).send(
      res
    );
  }
  // Ne mettre à jour que les champs username, email, bio et avatar
  const { username, email, bio } = req.body;
  if (username) user.username = username;
  if (email) user.email = email;
  if (bio) user.bio = bio;
  if (req.file) {
    await deleteOldImage(user.avatar);
    user.avatar = req.file.filename;
  }
  await user.save();

  return ApiResponse.success("User updated successfully", user).send(res);
});

// @desc    delete user
// @route   DELETE /api/v1/users/:id
// @access  Private
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const userID = req.params.id;
  const user = await User.findById(userID);
  if (!user) {
    return ApiResponse.error("User not found", 404).send(res);
  }
  // Vérifier si l'utilisateur a le droit de supprimer l'utilisateur
  if (user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return ApiResponse.error("Not authorized to update this user", 403).send(
      res
    );
  }

  await deleteOldImage(user.avatar);
  await user.remove();
  return ApiResponse.success("User deleted successfully").send(res);
});
