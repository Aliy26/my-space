import { Router } from "express";
import multer from "multer";
import { Certificate } from "../models/Certificate.js";
import { serializeCertificate } from "../utils/serializers.js";
import {
  cloudinary,
  hasCloudinaryConfig,
  uploadBuffer,
} from "../utils/cloudinary.js";

const router = Router();

const certificateUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_request, file, callback) => {
    const isPdf =
      file.mimetype === "application/pdf" || file.originalname.endsWith(".pdf");
    const isImage =
      ["image/png", "image/jpeg", "image/webp", "image/jpg"].includes(
        file.mimetype,
      ) ||
      [".png", ".jpg", ".jpeg", ".webp"].includes(
        file.originalname
          .toLowerCase()
          .slice(file.originalname.lastIndexOf(".")),
      );

    callback(
      isPdf || isImage
        ? null
        : new Error("Only PDF or image files are supported."),
      isPdf || isImage,
    );
  },
  limits: { fileSize: 8 * 1024 * 1024 },
});

function normalizeExternalUrl(value) {
  if (!value) return null;
  const trimmed = `${value}`.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

router.get("/", async (_request, response, next) => {
  try {
    const certificates = await Certificate.find().sort({
      sortOrder: 1,
      createdAt: -1,
    });
    response.json(certificates.map(serializeCertificate));
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  certificateUpload.single("certificate"),
  async (request, response, next) => {
    try {
      const title = `${request.body.title ?? ""}`.trim();
      const description = `${request.body.description ?? ""}`.trim();
      const externalUrl = normalizeExternalUrl(request.body.externalUrl ?? "");

      if (!title) {
        response
          .status(400)
          .json({ message: "Certificate title is required." });
        return;
      }

      const hasFile = !!request.file;
      const hasLink = !!externalUrl;

      if (!hasFile && !hasLink) {
        response
          .status(400)
          .json({
            message: "Upload a certificate file or add a reference link.",
          });
        return;
      }

      const payload = {
        title,
        description,
        externalUrl,
        sortOrder: Number(request.body.sortOrder ?? 0),
        originalName: request.file?.originalname ?? null,
        mimeType: request.file?.mimetype ?? null,
        size: request.file?.size ?? null,
        cloudinaryUrl: null,
        cloudinaryPublicId: null,
      };

      if (request.file) {
        if (!hasCloudinaryConfig()) {
          response
            .status(500)
            .json({
              message:
                "Cloudinary configuration is missing. Please contact support.",
            });
          return;
        }

        const result = await uploadBuffer(request.file.buffer, {
          folder: "portfolio/certificates",
          resource_type:
            request.file.mimetype === "application/pdf" ? "raw" : "image",
          public_id: `certificate-${Date.now()}`,
        });

        payload.cloudinaryUrl = result.secure_url;
        payload.cloudinaryPublicId = result.public_id;
      }

      const certificate = await Certificate.create(payload);
      response.status(201).json(serializeCertificate(certificate));
    } catch (error) {
      next(error);
    }
  },
);

router.put(
  "/:certificateId",
  certificateUpload.single("certificate"),
  async (request, response, next) => {
    try {
      const title = `${request.body.title ?? ""}`.trim();
      const description = `${request.body.description ?? ""}`.trim();
      const externalUrl = normalizeExternalUrl(request.body.externalUrl ?? "");

      if (!title) {
        response
          .status(400)
          .json({ message: "Certificate title is required." });
        return;
      }

      const existing = await Certificate.findById(request.params.certificateId);
      if (!existing) {
        response.status(404).json({ message: "Certificate not found." });
        return;
      }

      const nextPayload = {
        title,
        description,
        externalUrl,
        sortOrder: Number(request.body.sortOrder ?? existing.sortOrder ?? 0),
      };

      if (request.file) {
        if (existing.cloudinaryPublicId) {
          await cloudinary.uploader
            .destroy(existing.cloudinaryPublicId)
            .catch(() => {});
        }

        const result = await uploadBuffer(request.file.buffer, {
          folder: "portfolio/certificates",
          resource_type:
            request.file.mimetype === "application/pdf" ? "raw" : "image",
          public_id: `certificate-${Date.now()}`,
        });

        nextPayload.originalName = request.file.originalname;
        nextPayload.mimeType = request.file.mimetype;
        nextPayload.size = request.file.size;
        nextPayload.cloudinaryUrl = result.secure_url;
        nextPayload.cloudinaryPublicId = result.public_id;
      } else {
        nextPayload.originalName = existing.originalName;
        nextPayload.mimeType = existing.mimeType;
        nextPayload.size = existing.size;
        nextPayload.cloudinaryUrl = existing.cloudinaryUrl;
        nextPayload.cloudinaryPublicId = existing.cloudinaryPublicId;
      }

      const certificate = await Certificate.findByIdAndUpdate(
        request.params.certificateId,
        nextPayload,
        { new: true, runValidators: true },
      );

      response.json(serializeCertificate(certificate));
    } catch (error) {
      next(error);
    }
  },
);

router.delete("/:certificateId", async (request, response, next) => {
  try {
    const certificate = await Certificate.findById(
      request.params.certificateId,
    );
    if (!certificate) {
      response.status(404).json({ message: "Certificate not found." });
      return;
    }

    if (certificate.cloudinaryPublicId) {
      await cloudinary.uploader
        .destroy(certificate.cloudinaryPublicId)
        .catch(() => {});
    }

    await Certificate.findByIdAndDelete(request.params.certificateId);
    response.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
