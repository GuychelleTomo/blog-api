const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [3, "Title must be at least 3 characters"],
      maxlength: [100, "Title can not be more than 100 characters"],
    },
    content: {
      type: String,
      required: [true, "Please add content"],
      trim: true,
      minlength: [3, "Content must be at least 3 characters"],
      maxlength: [10000, "Content can not be more than 10000 characters"],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
    },
    category: {
      type: mongoose.Schema.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    image: {
      type: String,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes:[
      {
        user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        }
      }
    ],

    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    popularityScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//ajouter l'URL complète de l'image
postSchema.virtual("imageUrl").get(function(){
  if (!this.image) return null;

  const baseUrl = process.env.BASE_URL;
  return `${baseUrl}/${this.image}`
});

//Modifier la transfomration toJSON pour inclure imageUrl et gérer l'image
postSchema.set("toJSON", {
  virtuals: true,
  transform: function (doc, ret) {
    ret.imageUrl = doc.imageUrl;

    //Optionnel: supprimer le champ image original si vous ne voulez pas l'exposer
    delete ret.image;
    return ret;
  },
});

// calculate popularity score
postSchema.methods.calculatePopularityScore = function () {
  this.popularityScore =
    this.views * 0.5 + this.likedCount * 0.3 + this.commentCount * 0.2;
};

// Middleware to calculate popularity score
postSchema.pre("save", function (next) {
  this.calculatePopularityScore();
  next();
});

module.exports = mongoose.model("Post", postSchema);
