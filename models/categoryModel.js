const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a category name"],
      unique: [true, "Category name already exists"],
      trim: true,
      minlength: [2, "Category name must be at least 2 characters"],
      maxlength: [50, "Category name can not be more than 50 characters"],
    },
    description: {
      type: String,
      trim: true,
      minlength: [2, "Description must be at least 2 characters"],
      maxlength: [500, "Description can not be more than 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
