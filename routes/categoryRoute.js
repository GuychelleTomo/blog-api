const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategory,
  getCategories,
  deleteCategory,
  updateCategory,
} = require("../controllers/categoryController");
const {
  validateCategoryCreate,
  validateCategoryGet,
  validateCategoryDelete,
  validateCategoryUpdate,
} = require("../middlewares/validators/categoryValidator");

router
  .route("/")
  .post(validateCategoryCreate, createCategory)
  .get(getCategories);

router
  .route("/:id")
  .get(getCategory)
  .delete(validateCategoryDelete, deleteCategory)
  .put(validateCategoryUpdate, updateCategory);

module.exports = router;
