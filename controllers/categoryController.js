const Category = require("../models/categoryModel");
const asyncHandler = require("../middlewares/asyncHandler");
const ApiResponse = require("../utils/apiResponse");

// @desc    get all categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = asyncHandler(async (req, res, next) => {
  const categories = await Category.find();
  return ApiResponse.success(
    "Categories fetched successfully",
    categories
  ).send(res);
});

// @desc    get single category
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = asyncHandler(async (req, res, next) => {
  const categoryID = req.params.id;
  const category = await Category.findById(categoryID);
  if (!category) {
    return ApiResponse.error("Category not found", 404).send(res);
  }
  return ApiResponse.success("Category fetched successfully", category).send(
    res
  );
});

// @desc    create category
// @route   POST /api/v1/categories
// @access  Private/Admin
exports.createCategory = asyncHandler(async (req, res, next) => {
  const category = await Category.create(req.body);
  if (!category) {
    return ApiResponse.error("Category not created", 400).send(res);
  }
  return ApiResponse.success(
    "Category created successfully",
    category,
    201
  ).send(res);
});

// @desc    update category
// @route   PUT /api/v1/categories/:id
// @access  Private/Admin
exports.updateCategory = asyncHandler(async (req, res, next) => {
  const categoryID = req.params.id;
  const category = await Category.findByIdAndUpdate(categoryID, req.body, {
    new: true,
    runValidators: true,
  });
  if (!category) {
    return ApiResponse.error("Category not found", 404).send(res);
  }
  return ApiResponse.success("Category updated successfully", category).send(
    res
  );
});

// @desc    delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private/Admin
exports.deleteCategory = asyncHandler(async (req, res, next) => {
  const categoryID = req.params.id;
  const category = await Category.findByIdAndDelete(categoryID);
  if (!category) {
    return ApiResponse.error("Category not found", 404).send(res);
  }
  return ApiResponse.success("Category deleted successfully").send(res);
});
