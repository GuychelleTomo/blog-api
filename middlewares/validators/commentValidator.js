const { body, param } = require("express-validator");
const { validateRequest } = require("../../utils/validationUtil");
const Post = require("../../models/Post");

const {
  validateRequest,
  validateMongoId,
} = require("../../utils/validationUtil");

exports.validateCommentCreate = [
  validateMongoId("postId"),
  param("postId").custom(async (value) => {
    const post = await Post.findById(value);
    if (!post) {
      throw new Error("Post not found");
    }
    return true;
  }),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ max: 1000 })
    .withMessage("Comment must not exceed 1000 characters"),
  validateRequest,
];

exports.validateCommentUpdate = [
  validateMongoId("id"),
  body("content")
    .trim()
    .notEmpty()
    .withMessage("Comment content is required")
    .isLength({ max: 1000 })
    .withMessage("Comment must not exceed 1000 characters"),
  validateRequest,
];

exports.validateCommentDelete = [validateMongoId("id"), validateRequest];
