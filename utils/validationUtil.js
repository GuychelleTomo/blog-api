const { param, validationResult } = require("express-validator");

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    next(errors);
    return;
  }
  next();
};

const validateMongoId = (field) =>
  param(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isMongoId()
    .withMessage(`Invalid MongoDB id : ${field}`);

module.exports = { validateRequest, validateMongoId };
