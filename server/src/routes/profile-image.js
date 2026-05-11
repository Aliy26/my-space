import { Router } from 'express'
import { ProfileImage } from '../models/ProfileImage.js'
import { serializeProfileImage } from '../utils/serializers.js'

const router = Router()

async function getLatestProfileImage() {
  return ProfileImage.findOne().sort({ updatedAt: -1, createdAt: -1 })
}

router.get('/', async (_request, response, next) => {
  try {
    const profileImage = await getLatestProfileImage()

    if (!profileImage) {
      response.status(404).json({ message: 'No profile image uploaded yet.' })
      return
    }

    response.json(serializeProfileImage(profileImage))
  } catch (error) {
    next(error)
  }
})

export default router
