const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Never reuse the client's filename - it decides where the file lands.
    const name = crypto.randomBytes(16).toString("hex") + ALLOWED[file.mimetype];
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED[file.mimetype]) {
      return cb(new Error("Only JPEG, PNG, WebP or GIF images are allowed"));
    }
    cb(null, true);
  },
});

module.exports = { upload, UPLOAD_DIR };
