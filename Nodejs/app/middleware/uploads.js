import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    files: 10,
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image uploads are supported."));
    }
    cb(null, true);
  },
});

const uploadPhotos = upload.array("photos", 10);

function encodeFilesToBase64(files) {
  return files.map((file) => {
    if (!file?.buffer) {
      const error = new Error("Unable to encode uploaded file to base64.");
      error.status = 422;
      throw error;
    }
    return file.buffer.toString("base64");
  });
}

function attachBase64Images(req, res, next) {
  try {
    const files = req.files || [];
    req.base64Images = encodeFilesToBase64(files);
    next();
  } catch (error) {
    next(error);
  }
}

export const uploadImages = [uploadPhotos, attachBase64Images];

export { encodeFilesToBase64 };

export function multerErrorHandler(err, req, res, next) {
  if (
    err instanceof multer.MulterError ||
    err.message === "Only image uploads are supported."
  ) {
    err.status = err.status || 400;
  }
  next(err);
}
