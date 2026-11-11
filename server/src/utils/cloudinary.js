import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET,
);

export { cloudinary };

/**
 * Upload a Buffer directly to Cloudinary.
 * Works with multer memoryStorage — no temp files needed.
 */
export function uploadBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    if (!hasCloudinaryConfig) {
      reject(
        new Error(
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.",
        ),
      );
      return;
    }

    cloudinary.uploader
      .upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
}

export async function destroyCloudinaryAsset(publicId, options = {}) {
  if (!publicId) return null;
  if (!hasCloudinaryConfig) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, options).catch((error) => {
    console.error("Cloudinary destroy failed:", error);
    return null;
  });
}
