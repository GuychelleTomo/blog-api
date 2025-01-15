const { body } = require("express-validator");
const {
  validateRequest,
  validateMongoId,
} = require("../../utils/validationUtil");
const Category = require("../../models/categoryModel");

exports.validateCategoryCreate = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters")
    .custom(async (value) => {
      const category = await Category.findOne({ name: value });
      if (category) {
        throw new Error("Category name already exists");
      }
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  validateRequest,
];

exports.validateCategoryUpdate = [
  validateMongoId("id"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty if provided")
    .isLength({ min: 2, max: 50 })
    .withMessage("Category name must be between 2 and 50 characters")
    .custom(async (value, { req }) => {
      const category = await Category.findOne({
        name: value,
        _id: { $ne: req.params.id },
      });
      if (category) {
        throw new Error("Category name already exists");
      }
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description must not exceed 500 characters"),
  validateRequest,
];

exports.validateCategoryGet = [validateMongoId("id"), validateRequest];

exports.validateCategoryDelete = [validateMongoId("id"), validateRequest];
