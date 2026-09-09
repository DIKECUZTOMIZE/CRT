import fs from "fs";
import path from "path";
import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

import env from "../../config/env.js";
import { authMiddleware, requireRole } from "../../middleware/auth.middleware.js";
import { buildSuccessResponse } from "../../shared/utils/buildSuccessResponse.js";
import { buildFailureResponse } from "../../shared/utils/buildFailureResponse.js";

const uploadRouter = Router();

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const isCloudinaryConfigured = () => {
  const cloudName = String(env.CLOUDINARY_CLOUD_NAME || "").trim();
  const apiKey = String(env.CLOUDINARY_API_KEY || "").trim();
  const apiSecret = String(env.CLOUDINARY_API_SECRET || "").trim();

  const placeholderValues = new Set([
    "",
    "your_cloudinary_cloud_name",
    "your_cloudinary_api_key",
    "your_cloudinary_api_secret",
    "YOUR_CLOUDINARY_CLOUD_NAME",
    "YOUR_CLOUDINARY_API_KEY",
    "YOUR_CLOUDINARY_API_SECRET",
    "demo",
    "demo-key",
    "demo-secret",
  ]);

  return Boolean(
    cloudName &&
    apiKey &&
    apiSecret &&
    !placeholderValues.has(cloudName.toLowerCase()) &&
    !placeholderValues.has(apiKey.toLowerCase()) &&
    !placeholderValues.has(apiSecret.toLowerCase())
  );
};

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
  });
}

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const allowedExtensions = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif",
]);

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    const mimeType = (file.mimetype || "").toLowerCase();
    const isAllowedMime = allowedMimeTypes.has(mimeType);
    const isAllowedExtension = allowedExtensions.has(extension);

    if (!isAllowedMime && !isAllowedExtension) {
      return cb(new Error("Only JPG, PNG, WEBP, GIF, and AVIF images are allowed"));
    }

    cb(null, true);
  },
});

const buildFileUrl = (req, fileName) => {
  const forwardedProto = req.get("x-forwarded-proto");
  const forwardedHost = req.get("x-forwarded-host");
  const protocol = forwardedProto ? forwardedProto.split(",")[0].trim() : req.protocol;
  const host = forwardedHost ? forwardedHost.split(",")[0].trim() : req.get("host");
  const baseHost = host || "localhost:3000";
  const filePath = `/uploads/${fileName}`;
  return new URL(filePath, `${protocol}://${baseHost}`).toString();
};

const createLocalFileName = (file) => {
  const timestamp = Date.now();
  const safeName = file.originalname.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9_.-]/g, "");
  return `${timestamp}-${safeName}`;
};

const saveLocalFile = async (file, req) => {
  const fileName = createLocalFileName(file);
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, file.buffer);

  return buildFileUrl(req, fileName);
};

const uploadToStorage = async (file, req) => {
  if (isCloudinaryConfigured()) {
    return new Promise((resolve, reject) => {
      const result = cloudinary.uploader.upload_stream(
        {
          folder: "crt-uploads",
          resource_type: "image",
        },
        (error, response) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(response?.secure_url || response?.url);
        }
      );

      result.end(file.buffer);
    });
  }

  return saveLocalFile(file, req);
};

uploadRouter.post(
  "/image",
  authMiddleware,
  requireRole("USER", "ORGANIZER", "ADMIN"),
  (req, res, next) => {
    upload.single("image")(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return buildFailureResponse(
            res,
            "Only JPG, PNG, WEBP, GIF, and AVIF images are allowed",
            400
          );
        }

        return next(err);
      }

      try {
        if (!req.file) {
          return buildFailureResponse(res, "Image is required", 400);
        }

        const fileUrl = await uploadToStorage(req.file, req);

        return buildSuccessResponse(
          res,
          "Image uploaded successfully",
          { url: fileUrl },
          200
        );
      } catch (error) {
        return buildFailureResponse(
          res,
          error.message || "Image upload failed",
          500
        );
      }
    });
  }
);

uploadRouter.post(
  "/images",
  authMiddleware,
  requireRole("USER", "ORGANIZER", "ADMIN"),
  (req, res, next) => {
    upload.array("images", 10)(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return buildFailureResponse(
            res,
            "Only JPG, PNG, WEBP, GIF, and AVIF images are allowed",
            400
          );
        }

        return next(err);
      }

      try {
        if (!req.files || req.files.length === 0) {
          return buildFailureResponse(res, "At least one image is required", 400);
        }

        const urls = await Promise.all(
          req.files.map((file) => uploadToStorage(file, req))
        );

        return buildSuccessResponse(
          res,
          "Images uploaded successfully",
          { urls },
          200
        );
      } catch (error) {
        return buildFailureResponse(
          res,
          error.message || "Image upload failed",
          500
        );
      }
    });
  }
);

export default uploadRouter;
