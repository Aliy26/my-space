import { Router } from 'express'
import { Project } from '../models/Project.js'
import { serializeProject } from '../utils/serializers.js'

const router = Router()

router.get('/', async (_request, response, next) => {
  try {
    const projects = await Project.find().sort({ sortOrder: 1, createdAt: -1 })
    response.json(projects.map(serializeProject))
  } catch (error) {
    next(error)
  }
})
// projects is an array of objects

export default router
