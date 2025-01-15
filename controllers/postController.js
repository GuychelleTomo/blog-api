const Post = require("../models/postModel");
const asyncHandler = require("../middlewares/asyncHandler");
const { deleteOldImage } = require("../utils/fileUpload");
const ApiResponse = require("../utils/apiResponse");
const APIFeatures = require("../utils/apiFeatures");

// @desc    get all posts
// @route   GET /api/v1/posts
// @access  Public
exports.getPosts = asyncHandler(async (req, res, next) => {
  const features = new APIFeatures(Post.find({ isPublished: true }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const posts = await features.query
    .populate("author", "username avatar")
    .populate("category", "name");

  const total = await Post.countDocuments({ isPublished: true });
  const dataToReturn = { total, count: posts.length, posts };

  return ApiResponse.success("Posts fetched successfully", dataToReturn).send(
    res
  );
});

// @desc    get single post
// @route   GET /api/v1/posts
// @access  Public
exports.getPost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id)
    .populate("author", "username avatar")
    .populate("category", "name");

  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }

  // Incrémenter le nombre de vues
  post.views += 1;
  await post.save();

  return ApiResponse.success("Post fetched successfully", post).send(res);
});

// @desc    create post
// @route   POST /api/v1/posts
// @access  Private
exports.createPost = asyncHandler(async (req, res, next) => {
  const { title, content, category , isPublished} = req.body;

  const post = await Post.create({
    title,
    content,
    author: req.user.id,
    category,
    isPublished,
    image: req.file ? req.file.filename 
      : undefined,
  });

  await post.populate([
    { path: "author", select: "username avatar" },
    { path: "category", select: "name" },
  ]);

  const postResponse = post.toJSON();
  return ApiResponse.success("Post created successfully", postResponse).send(res);
});

// @desc    update post
// @route   PUT /api/v1/posts/:id
// @access  Private
exports.updatePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }
  // Vérifier si l'utilisateur a le droit de modifier le post
  if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
    return ApiResponse.error("Not authorized to update this post", 403).send(
      res
    );
  }
  // Ne mettre à jour que les champs title, content, category et image
  const { title, content, category, isPublished } = req.body;
  if (title) post.title = title;
  if (content) post.content = content;
  if (category) post.category = category;
  if(isPublished) post.isPublished = isPublished;

  if (req.file) {
    await deleteOldImage(post.image);
    post.image = req.file.filename;
  }
  await post.save();

  await post.populate([
    { path: "author", select: "username" },
    { path: "category", select: "name" },
  ]);

  const postResponse = post.toJSON();

  return ApiResponse.success("Post updated successfully", postResponse).send(res);
});
/** 
    * @desc    delete post
    * @route   DELETE /api/v1/posts/:id
    * @access  Private
*/
exports.deletePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }

  // Vérifier si l'utilisateur a le droit de modifier le post
  if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
    return ApiResponse.error("Not authorized to delete this post", 403).send(
      res
    );
  }

  await deleteOldImage(post.image);
  await post.deleteOne();

  return ApiResponse.success("Post deleted successfully").send(res);
});

// @desc    Like post
// @route   PUT /api/v1/posts/:id/like
// @access  Private
exports.likePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }

  const like = post.likes.find((like) => like.user.toString() === req.user.id);
  if (like) {
    post.likes = post.likes.filter(
      (like) => like.user.toString() !== req.user.id
    );
  } else {
    post.likes.push({ user: req.user.id });
  }

  post.likeCount = post.likes.length;
  await post.save();

  return ApiResponse.success("Post liked successfully").send(res);
});

// @desc    Unlike post
// @route   PUT /api/v1/posts/:id/unlike
// @access  Private
exports.unlikePost = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }

  post.likes = post.likes.filter(
    (like) => like.user.toString() !== req.user.id
  );
  post.likeCount = post.likes.length;
  await post.save();

  return ApiResponse.success("Post unliked successfully").send(res);
});

/**
 * @desc    Toggle post publish status
 * @route   PUT /api/posts/:id/publish
 * @access  Private
 */
exports.togglePublishPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }

  // Vérifier l'autorisation
  if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
    return ApiResponse.error(
      "Not authorized to publish/unpublish this post",
      403
    ).send(res);
  }

  post.isPublished = !post.isPublished;
  await post.save();

  ApiResponse.success(
    `Post ${post.isPublished ? "published" : "unpublished"} successfully`,
    post
  ).send(res);
});

/**
 * @desc    Get posts by category
 * @route   GET /api/posts/category/:categoryId
 * @access  Public
 */
exports.getPostsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  const baseQuery = Post.find({
    category: categoryId,
    isPublished: true,
  });

  const features = new APIFeatures(baseQuery, req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const posts = await features.query
    .populate("author", "username avatar")
    .populate("category", "name");

  const total = await Post.countDocuments({
    category: categoryId,
    isPublished: true,
  });

  ApiResponse.success("Posts retrieved successfully", {
    total,
    count: posts.length,
    posts,
  }).send(res);
});

/**
 * @desc    Get popular posts
 * @route   GET /api/posts/popular
 * @access  Public
 */
exports.getPopularPosts = asyncHandler(async (req, res) => {
  const features = new APIFeatures(
    Post.find({ isPublished: true }).sort("-popularityScore"),
    req.query
  )
    .limitFields()
    .paginate();

  const posts = await features.query
    .populate("author", "username avatar")
    .populate("category", "name");

  ApiResponse.success("Popular posts retrieved successfully", {
    count: posts.length,
    posts,
  }).send(res);
});

/**
 * @desc    Search posts
 * @route   GET /api/posts/search
 * @access  Public
 */
exports.searchPosts = asyncHandler(async (req, res) => {
  if (!req.query.q) {
    return ApiResponse.error("Please provide a search query", 400).send(res);
  }

  const features = new APIFeatures(
    Post.find(
      {
        $text: { $search: req.query.q },
        isPublished: true,
      },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }),
    req.query
  )
    .limitFields()
    .paginate();

  const posts = await features.query
    .populate("author", "username avatar")
    .populate("category", "name");

  ApiResponse.success("Search results retrieved successfully", {
    count: posts.length,
    posts,
  }).send(res);
});

// Middleware pour mettre à jour le nombre de commentaires
exports.updateCommentCount = asyncHandler(async (req, res, next) => {
  const post = await Post.findById(req.params.postId);

  if (!post) {
    return ApiResponse.error("Post not found", 404).send(res);
  }

  const commentCount = await Comment.countDocuments({
    post: req.params.postId,
  });
  post.commentCount = commentCount;
  await post.save();

  next();
});
