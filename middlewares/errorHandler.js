const ApiResponse = require("../utils/apiResponse");

const errorHandler = (err, req, res, next) => {
  // Log l'erreur en développement
  if (process.env.NODE_ENV === "development") {
    console.error("Error 💥:", err);
  }

  // Erreurs de validation d'Express Validator
  if (err.array && typeof err.array === "function") {
    // On a plusieurs erreurs, on prend juste le premier message
    const message = err.array()[0].msg;
    return ApiResponse.error(message, 400).send(res);
  }

  // Erreur de validation Mongoose
  if (err.name === "ValidationError") {
    // On a plusieurs erreurs, on prend juste le premier message
    const message = Object.values(err.errors)[0].message;
    return ApiResponse.error(message, 400).send(res);
  }

  // Erreur de cast MongoDB (ID invalide)
  if (err.name === "CastError") {
    const message = `Resource not found`;
    return ApiResponse.error(message, 400).send(res);
  }

  // Erreur de duplication MongoDB
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return ApiResponse.error(
      `This ${field} already exists. Please use another value`,
      400
    ).send(res);
  }

  // Erreur JWT invalide
  if (err.name === "JsonWebTokenError") {
    return ApiResponse.error("Invalid token. Please log in again", 401).send(
      res
    );
  }

  // Erreur JWT expiré
  if (err.name === "TokenExpiredError") {
    return ApiResponse.error(
      "Your token has expired. Please log in again",
      401
    ).send(res);
  }

  // Erreur de fichier trop grand
  if (err.code === "LIMIT_FILE_SIZE") {
    return ApiResponse.error("File too large. Maximum size is 5MB", 400).send(
      res
    );
  }

  // Erreur de type de fichier incorrect
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return ApiResponse.error("Invalid file type", 400).send(res);
  }

  // En production, envoyer un message générique pour les erreurs inconnues
  if (process.env.NODE_ENV === "production") {
    return ApiResponse.error("Something went wrong", 500).send(res);
  }

  // En développement, envoyer les détails de l'erreur
  return ApiResponse.error(
    err.message || "Something went wrong",
    err.statusCode || 500,
    process.env.NODE_ENV === "development"
      ? {
          error: err,
          stack: err.stack,
        }
      : null
  ).send(res);
};

module.exports = errorHandler;
