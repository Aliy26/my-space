import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { rateLimit } from 'express-rate-limit'
import { AdminUser } from '../models/AdminUser.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

router.post('/login', loginRateLimit, async (request, response, next) => {
  try {
    const { username, password } = request.body

    if (!username || !password) {
      response.status(400).json({ message: 'Username and password are required.' })
      return
    }

    const admin = await AdminUser.findOne({ username: username.trim() })

    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      response.status(401).json({ message: 'Invalid username or password.' })
      return
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    )

    response.cookie('admin_token', token, COOKIE_OPTIONS)
    response.json({ username: admin.username })
  } catch (error) {
    next(error)
  }
})

router.post('/logout', (_request, response) => {
  response.clearCookie('admin_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
  })
  response.json({ ok: true })
})

router.get('/me', requireAuth, (request, response) => {
  response.json({ username: request.admin.username })
})

export default router
