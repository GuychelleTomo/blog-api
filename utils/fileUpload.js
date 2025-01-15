const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;

// Configuration pour les images
const config = {
  user: {
    width: parseInt(process.env.USER_PHOTO_WIDTH) || 150, // Valeur par défaut ajoutée
    height: parseInt(process.env.USER_PHOTO_HEIGHT) || 150, // Valeur par défaut ajoutée
    fit: process.env.USER_PHOTO_FIT || "cover", // Valeur par défaut ajoutée
    directory: process.env.USER_UPLOAD_PATH || "uploads/users", // Valeur par défaut ajoutée
  },
  post: {
    width: parseInt(process.env.POST_IMAGE_WIDTH) || 800, // Valeur par défaut ajoutée
    height: parseInt(process.env.POST_IMAGE_HEIGHT) || 600, // Valeur par défaut ajoutée
    fit: process.env.POST_IMAGE_FIT || "inside", // Valeur par défaut ajoutée
    directory: process.env.POST_UPLOAD_PATH || "uploads/posts", // Valeur par défaut ajoutée
  },
};

// Créer les répertoires s'ils n'existent pas
const createDirectories = async () => {
  for (const type of Object.values(config)) {
    try {
      await fs.mkdir(path.join(process.cwd(), type.directory), {
        recursive: true,
      });
    } catch (error) {
      console.error(`Error creating directory: ${type.directory}`, error);
    }
  }
};

// Exécuter la création des répertoires au démarrage
createDirectories();

// Configuration du stockage des images
const storage = multer.memoryStorage();

// Configuration de Multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB par défaut
  },
  fileFilter: (req, file, cb) => {
    // Vérifier le type de fichier
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
});

// Redimensionner et sauvegarder l'image
const resizeAndSaveImage =
  (type = "user") =>
  async (req, res, next) => {
    if (!req.file) return next();

    try {
      const settings = config[type];
      if (!settings) throw new Error("Invalid image type");

      const filename = `${type}-${Date.now()}.jpeg`;
      const relativePath = path.join(settings.directory, filename);
      const absolutePath = path.join(process.cwd(), relativePath);

      await sharp(req.file.buffer)
        .resize(settings.width, settings.height, {
          fit: settings.fit,
          withoutEnlargement: true,
        })
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(absolutePath);

      // Stocker le chemin relatif dans req.file.filename
      req.file.filename = relativePath;
      next();
    } catch (error) {
      next(error);
    }
  };

// Supprimer une ancienne image
const deleteOldImage = async (imagePath) => {
  if (!imagePath || imagePath === "default-avatar.jpg") return;

  try {
    const absolutePath = path.join(process.cwd(), imagePath);
    await fs.access(absolutePath); // Vérifier si le fichier existe
    await fs.unlink(absolutePath);
  } catch (error) {
    console.error("Error deleting file:", error);
    // Ne pas throw l'erreur pour ne pas bloquer le processus
  }
};

module.exports = {
  upload,
  resizeAndSaveImage,
  deleteOldImage,
};
