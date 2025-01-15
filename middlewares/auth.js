const jwt = require("jsonwebtoken");
const asyncHandler = require("./asyncHandler");
const ApiResponse = require("../utils/apiResponse");
const User = require("../models/userModel");

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return ApiResponse.error("Not authorized to access this route", 401).send(
      res
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return ApiResponse.error("Not authorized to access this route", 401).send(
      res
    );
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return ApiResponse.error(
        `User role ${req.user.role} is not authorized to access this route`,
        403
      ).send(res);
    }
    next();
  };
};
