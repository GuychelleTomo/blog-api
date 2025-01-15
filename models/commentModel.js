const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, "Please add a comment"],
      trim: true,
      minlength: [3, "Comment must be at least 3 characters"],
      maxlength: [500, "Comment can not be more than 500 characters"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: "Post",
      required: [true, "Post is required"],
    },
  },
  {
    timestamps: true,
  }
);

// Middleware pour mettre à jour le compteur après la création d'un commentaire
commentSchema.post("save", async function () {
  try {
    const Post = this.model("Post");
    const post = await Post.findByIdAndUpdate(
      this.post,
      { $inc: { commentCount: 1 } },
      { new: true }
    );

    // Le middleware pre('save') du Post s'occupera de recalculer le score de popularité
    await post.save();
  } catch (err) {
    console.error("Error updating comment count:", err);
  }
});

// Middleware pour mettre à jour le compteur après la suppression d'un commentaire
commentSchema.post("remove", async function () {
  try {
    const Post = this.model("Post");
    const post = await Post.findByIdAndUpdate(
      this.post,
      { $inc: { commentCount: -1 } },
      { new: true }
    );

    // Le middleware pre('save') du Post s'occupera de recalculer le score de popularité
    await post.save();
  } catch (err) {
    console.error("Error updating comment count:", err);
  }
});

module.exports = mongoose.model("Comment", commentSchema);
