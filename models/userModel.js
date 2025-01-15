const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please add a username"],
      unique: [true, "Username already exists"],
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [50, "Username can not be more than 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Please add an email"],
      unique: [true, "Email already exists"],
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["admin", "user"],
      default: "user",
    },
    password: {
      type: String,
      required: true,
      select: false,
      trim: true,
    },
    avatar: {
      type: String,
    },
    bio: {
      type: String,
      trim: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationTokenExpire: Date,
    resetPasswordToken: String,
    resetPasswordTokenExpire: Date,
    refreshTokens: {
      type: [String],
      default: [],
    },
  },


  { timestamps: true }
);

// Middleware pour crypter le mot de passe
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Middleware pour comparer le mot de passe
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware pour générer le token d'authentification
userSchema.methods.generateAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};


// Middleware pour générer le token de refresh
userSchema.methods.generateRefreshToken = function () {
 const refreshToken = jwt.sign(
  { id: this._id },
   process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRE}
)

// stoker le refresh token
this.refreshTokens.push(refreshToken);

  return refreshToken;
};

// verifier si un refresh token est valide pour cette utilisateur
userSchema.methods.verifyRefreshToken = function (refreshToken) {
  try{
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    return(
      decoded.id === this._id &&
      this.refreshTokens.includes(refreshToken)
    )
  }catch (error){
    return false;
  }
};


// retire un refresh token de la liste des tokens valides
userSchema.methods.removeRefreshToken = function (refreshToken) {
  this.refreshTokens = this.refreshTokens.filter(
    (token) => token!== refreshToken
  );
};

// Middleware pour générer le token de verification d'email
userSchema.methods.generateEmailVerificationToken = function () {
  // Générer un token à 6 chiffres
  const verificationToken = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Crypter le token
  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(verificationToken)
    .digest("hex");

  // Désactiver le token apres 10 minutes
  this.emailVerificationTokenExpire = Date.now() + 10 * 60 * 1000;

  // Retourner le token
  return verificationToken;
};

// Generate and hash password reset token
userSchema.methods.getResetPasswordToken = function () {
  // Generate token
  const resetToken = crypto.randomBytes(20).toString("hex");

  // Hash token and set to resetPasswordToken field
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Set expire
  this.resetPasswordTokenExpire = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
