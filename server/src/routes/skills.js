import { Router } from 'express'
import { Skill } from '../models/Skill.js'
import { serializeSkill } from '../utils/serializers.js'

const router = Router()

router.get('/', async (_request, response, next) => {
  try {
    const skills = await Skill.find().sort({ sortOrder: 1, name: 1 })
    response.json(skills.map(serializeSkill))
  } catch (error) {
    next(error)
  }
})

export default router
