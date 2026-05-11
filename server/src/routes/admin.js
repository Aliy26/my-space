import { Router } from 'express'
import path from 'node:path'
import mongoose from 'mongoose'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import { ProfileImage } from '../models/ProfileImage.js'
import { Project } from '../models/Project.js'
import { Resume } from '../models/Resume.js'
import { Skill } from '../models/Skill.js'
import { cloudinary, uploadBuffer } from '../utils/cloudinary.js'
import {
  serializeProfileImage,
  serializeProject,
  serializeResume,
  serializeSkill,
} from '../utils/serializers.js'

const router = Router()

// All uploads go to memory — no temp files on disk
const imageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_request, file, callback) => {
    const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
    const extension = path.extname(file.originalname).toLowerCase()
    const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp'])
    const isAccepted = allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)
    callback(isAccepted ? null : new Error('Only PNG, JPG, or WEBP images are supported.'), isAccepted)
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

const profileImageUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_request, file, callback) => {
    const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
    const extension = path.extname(file.originalname).toLowerCase()
    const allowedExtensions = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg'])
    const isAccepted = allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(extension)
    callback(isAccepted ? null : new Error('Only PNG, JPG, WEBP, or SVG images are supported.'), isAccepted)
  },
  limits: { fileSize: 5 * 1024 * 1024 },
})

const resumeUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_request, file, callback) => {
    const isPdf = file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')
    callback(isPdf ? null : new Error('Only PDF resumes are supported.'), isPdf)
  },
  limits: { fileSize: 8 * 1024 * 1024 },
})

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return value.map((tag) => `${tag}`.trim()).filter(Boolean)
  }
  return `${value ?? ''}`.split(',').map((tag) => tag.trim()).filter(Boolean)
}

function isValidHref(href) {
  if (href.startsWith('#')) return true
  try {
    const url = new URL(href)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function getProjectPayload(body) {
  return {
    title: `${body.title ?? ''}`.trim(),
    description: `${body.description ?? ''}`.trim(),
    href: `${body.href ?? ''}`.trim(),
    tags: normalizeTags(body.tags),
    sortOrder: Number(body.sortOrder ?? 0),
  }
}

function validateProjectPayload(payload) {
  if (!payload.title || !payload.description || !payload.href) {
    return 'Title, description, and link are required.'
  }
  if (!isValidHref(payload.href)) {
    return 'Link must be a valid URL (https://...) or a hash (#section).'
  }
  if (!Number.isFinite(payload.sortOrder)) {
    return 'Sort order must be a valid number.'
  }
  return null
}

function requireValidObjectId(request, response, next) {
  const { projectId } = request.params
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    response.status(400).json({ message: 'Invalid project ID.' })
    return
  }
  next()
}

router.use(requireAuth)

// ── Projects ────────────────────────────────────────────────────────────────

router.post('/projects', imageUpload.single('projectImage'), async (request, response, next) => {
  try {
    const payload = getProjectPayload(request.body)
    const validationError = validateProjectPayload(payload)

    if (validationError) {
      response.status(400).json({ message: validationError })
      return
    }

    if (request.file) {
      const result = await uploadBuffer(request.file.buffer, {
        folder: 'portfolio/projects',
        resource_type: 'image',
      })
      payload.imageUrl = result.secure_url
      payload.cloudinaryPublicId = result.public_id
    }

    const project = await Project.create(payload)
    response.status(201).json(serializeProject(project))
  } catch (error) {
    next(error)
  }
})

router.put('/projects/:projectId', requireValidObjectId, imageUpload.single('projectImage'), async (request, response, next) => {
  try {
    const payload = getProjectPayload(request.body)
    const validationError = validateProjectPayload(payload)

    if (validationError) {
      response.status(400).json({ message: validationError })
      return
    }

    const existing = await Project.findById(request.params.projectId)
    if (!existing) {
      response.status(404).json({ message: 'Project not found.' })
      return
    }

    if (request.file) {
      // Delete old image from Cloudinary if it exists
      if (existing.cloudinaryPublicId) {
        await cloudinary.uploader.destroy(existing.cloudinaryPublicId).catch(() => {})
      }
      const result = await uploadBuffer(request.file.buffer, {
        folder: 'portfolio/projects',
        resource_type: 'image',
      })
      payload.imageUrl = result.secure_url
      payload.cloudinaryPublicId = result.public_id
    } else {
      // Preserve existing image
      payload.imageUrl = existing.imageUrl ?? null
      payload.cloudinaryPublicId = existing.cloudinaryPublicId ?? null
    }

    const project = await Project.findByIdAndUpdate(request.params.projectId, payload, {
      new: true,
      runValidators: true,
    })

    response.json(serializeProject(project))
  } catch (error) {
    next(error)
  }
})

router.delete('/projects/:projectId', requireValidObjectId, async (request, response, next) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(request.params.projectId)

    if (!deletedProject) {
      response.status(404).json({ message: 'Project not found.' })
      return
    }

    if (deletedProject.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(deletedProject.cloudinaryPublicId).catch(() => {})
    }

    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

// ── Resume ──────────────────────────────────────────────────────────────────

router.post('/resume', resumeUpload.single('resume'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ message: 'Please upload a PDF resume.' })
      return
    }

    const previousResume = await Resume.findOne().sort({ updatedAt: -1, createdAt: -1 })

    const result = await uploadBuffer(request.file.buffer, {
      folder: 'portfolio/resumes',
      resource_type: 'raw',
      public_id: `resume-${Date.now()}`,
    })

    const resume = await Resume.create({
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      size: request.file.size,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    })

    // Delete old resume from Cloudinary after new one is saved
    if (previousResume?.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(previousResume.cloudinaryPublicId, { resource_type: 'raw' }).catch(() => {})
      await Resume.findByIdAndDelete(previousResume._id)
    }

    response.status(201).json(serializeResume(resume))
  } catch (error) {
    next(error)
  }
})

// ── Profile Image ────────────────────────────────────────────────────────────

router.post('/profile-image', profileImageUpload.single('profileImage'), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ message: 'Please upload an image file.' })
      return
    }

    const previousProfileImage = await ProfileImage.findOne().sort({ updatedAt: -1, createdAt: -1 })

    const result = await uploadBuffer(request.file.buffer, {
      folder: 'portfolio/branding',
      resource_type: 'image',
      public_id: `profile-${Date.now()}`,
    })

    const profileImage = await ProfileImage.create({
      originalName: request.file.originalname,
      mimeType: request.file.mimetype,
      size: request.file.size,
      cloudinaryUrl: result.secure_url,
      cloudinaryPublicId: result.public_id,
    })

    // Delete old image from Cloudinary after new one is saved
    if (previousProfileImage?.cloudinaryPublicId) {
      await cloudinary.uploader.destroy(previousProfileImage.cloudinaryPublicId).catch(() => {})
      await ProfileImage.findByIdAndDelete(previousProfileImage._id)
    }

    response.status(201).json(serializeProfileImage(profileImage))
  } catch (error) {
    next(error)
  }
})

// ── Skills ───────────────────────────────────────────────────────────────────

router.post('/skills', async (request, response, next) => {
  try {
    const name = `${request.body.name ?? ''}`.trim()
    const category = `${request.body.category ?? ''}`.trim()
    const sortOrder = Number(request.body.sortOrder ?? 0)

    if (!name || !category) {
      response.status(400).json({ message: 'Skill name and category are required.' })
      return
    }

    const skill = await Skill.create({ name, category, sortOrder })
    response.status(201).json(serializeSkill(skill))
  } catch (error) {
    next(error)
  }
})

router.put('/skills/:skillId', async (request, response, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(request.params.skillId)) {
      response.status(400).json({ message: 'Invalid skill ID.' })
      return
    }

    const name = `${request.body.name ?? ''}`.trim()
    const category = `${request.body.category ?? ''}`.trim()
    const sortOrder = Number(request.body.sortOrder ?? 0)

    if (!name || !category) {
      response.status(400).json({ message: 'Skill name and category are required.' })
      return
    }

    const skill = await Skill.findByIdAndUpdate(
      request.params.skillId,
      { name, category, sortOrder },
      { new: true, runValidators: true },
    )

    if (!skill) {
      response.status(404).json({ message: 'Skill not found.' })
      return
    }

    response.json(serializeSkill(skill))
  } catch (error) {
    next(error)
  }
})

router.delete('/skills/:skillId', async (request, response, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(request.params.skillId)) {
      response.status(400).json({ message: 'Invalid skill ID.' })
      return
    }

    const deleted = await Skill.findByIdAndDelete(request.params.skillId)

    if (!deleted) {
      response.status(404).json({ message: 'Skill not found.' })
      return
    }

    response.status(204).send()
  } catch (error) {
    next(error)
  }
})

export default router
