const express = require("express");
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  togglePublishPost,
  searchPosts,
  likePost,
  unlikePost,
  getPopularPosts,
  getPostsByCategory,
} = require("../controllers/postController");
const { protect } = require("../middlewares/auth");
const {
  validatePost,
  validatePostUpdate,
  validatePostDelete,
  validatePostGet,
  validateTogglePublish,
  validateCategoryId,
} = require("../middlewares/validators/postValidator");
const { upload, resizeAndSaveImage } = require("../utils/fileUpload");

const router = express.Router();

router.get("/search", searchPosts);
router.get("/popular", getPopularPosts);

router
  .route("/")
  .get(getPosts)
  .post(
    protect, 
    upload.single("image"),
    resizeAndSaveImage("post"), 
    validatePost, 
    createPost
  );

router
  .route("/:id")
  .get(validatePostGet, getPost)
  .put(
    protect, 
    upload.single("image"),
    resizeAndSaveImage("post"),  // Update image if provided
    validatePostUpdate,  
    updatePost)
  .delete(protect, validatePostDelete, deletePost);

router
  .route("/:id/publish")
  .put(protect, validateTogglePublish, togglePublishPost);

router.route("/:id/like").post(protect, likePost).delete(protect, unlikePost);

// Routes pour les posts par catégorie
router.get("/category/:categoryId", validateCategoryId, getPostsByCategory);

module.exports = router;
