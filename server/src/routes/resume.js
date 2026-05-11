import { Router } from 'express'
import { Resume } from '../models/Resume.js'
import { serializeResume } from '../utils/serializers.js'

const router = Router()

async function getLatestResume() {
  return Resume.findOne().sort({ updatedAt: -1, createdAt: -1 })
}

router.get('/', async (_request, response, next) => {
  try {
    const resume = await getLatestResume()

    if (!resume) {
      response.status(404).json({ message: 'No resume uploaded yet.' })
      return
    }

    response.json(serializeResume(resume))
  } catch (error) {
    next(error)
  }
})

// Proxy the PDF through the server so the client never touches Cloudinary directly.
// This avoids any Cloudinary access-control quirks and lets us set headers ourselves.
router.get('/view', async (_request, response, next) => {
  try {
    const resume = await getLatestResume()
    if (!resume?.cloudinaryUrl) {
      response.status(404).json({ message: 'No resume uploaded yet.' })
      return
    }

    const upstream = await fetch(resume.cloudinaryUrl)
    if (!upstream.ok) {
      response.status(502).json({ message: 'Could not fetch resume from storage.' })
      return
    }

    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader('Content-Disposition', 'inline; filename="resume.pdf"')
    // Stream the body without buffering the whole file in memory
    const reader = upstream.body.getReader()
    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) { response.end(); return }
      response.write(Buffer.from(value))
      return pump()
    }
    await pump()
  } catch (error) {
    next(error)
  }
})

router.get('/download', async (_request, response, next) => {
  try {
    const resume = await getLatestResume()
    if (!resume?.cloudinaryUrl) {
      response.status(404).json({ message: 'No resume uploaded yet.' })
      return
    }

    const upstream = await fetch(resume.cloudinaryUrl)
    if (!upstream.ok) {
      response.status(502).json({ message: 'Could not fetch resume from storage.' })
      return
    }

    const filename = resume.originalName || 'resume.pdf'
    response.setHeader('Content-Type', 'application/pdf')
    response.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    const reader = upstream.body.getReader()
    const pump = async () => {
      const { done, value } = await reader.read()
      if (done) { response.end(); return }
      response.write(Buffer.from(value))
      return pump()
    }
    await pump()
  } catch (error) {
    next(error)
  }
})

export default router
