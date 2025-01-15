const { body } = require("express-validator");
const {
  validateRequest,
  validateMongoId,
} = require("../../utils/validationUtil");
const Category = require("../../models/categoryModel");

exports.validatePost = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("content")
    .trim()
    .notEmpty()
    .withMessage("Content is required")
    .isLength({ max: 10000 })
    .withMessage("Content must not exceed 10000 characters"),

  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error("Category not found");
      }
      return true;
    }),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean value"),

  body("image").custom((value, { req }) => {
    if (req.file) {
      const acceptedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!acceptedTypes.includes(req.file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG and GIF are allowed"
        );
      }
      if (req.file.size > 5 * 1024 * 1024) {
        // 5MB
        throw new Error("File size too large. Maximum size is 5MB");
      }
    }
    return true;
  }),
  validateRequest,
];

exports.validatePostUpdate = [
  validateMongoId("id"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("content")
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage("Content must not exceed 10000 characters"),

  body("category")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID")
    .custom(async (value) => {
      const category = await Category.findById(value);
      if (!category) {
        throw new Error("Category not found");
      }
      return true;
    }),

  body("isPublished")
    .optional()
    .isBoolean()
    .withMessage("isPublished must be a boolean value"),

  body("image").custom((value, { req }) => {
    if (req.file) {
      const acceptedTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!acceptedTypes.includes(req.file.mimetype)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG and GIF are allowed"
        );
      }
      if (req.file.size > 5 * 1024 * 1024) {
        // 5MB
        throw new Error("File size too large. Maximum size is 5MB");
      }
    }
    return true;
  }),

  validateRequest,
];

exports.validatePostDelete = [validateMongoId("id"), validateRequest];

exports.validatePostGet = [validateMongoId("id"), validateRequest];

exports.validateCategoryId = [
  validateMongoId("categoryId").custom(async (value) => {
    const category = await Category.findById(value);
    if (!category) {
      throw new Error("Category not found");
    }
    return true;
  }),

  validateRequest,
];

exports.validateTogglePublish = [validateMongoId("id"), validateRequest];
