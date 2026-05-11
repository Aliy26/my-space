import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import dns from 'node:dns'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import bcrypt from 'bcryptjs'
import pino from 'pino'
import pinoHttp from 'pino-http'
import adminRoutes from './routes/admin.js'
import authRoutes from './routes/auth.js'
import settingsRoutes from './routes/settings.js'
import profileImageRoutes from './routes/profile-image.js'
import projectsRoutes from './routes/projects.js'
import resumeRoutes from './routes/resume.js'
import skillsRoutes from './routes/skills.js'
import trackRoutes from './routes/track.js'
import { connectToDatabase } from './db/connect.js'
import { AdminUser } from './models/AdminUser.js'

// ── Validate required environment variables ────────────────────────────────
const REQUIRED_ENV = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']
const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key])
if (missingEnv.length > 0) {
  console.error(`Missing required environment variables: ${missingEnv.join(', ')}`)
  console.error('Set them in your .env file before starting the server.')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)
const serverRoot = path.resolve(__dirname, '..')
const clientDistPath = path.resolve(serverRoot, '..', 'client', 'dist')
const uploadsDirectory = path.resolve(serverRoot, 'uploads', 'resumes')
const brandingDirectory = path.resolve(serverRoot, 'uploads', 'branding')
const projectsUploadsDirectory = path.resolve(serverRoot, 'uploads', 'projects')

const app = express()
const port = Number(process.env.PORT || 4000)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
// Additional origins always allowed (Render subdomain as fallback)
const allowedOrigins = new Set(
  [clientUrl, process.env.RENDER_EXTERNAL_URL].filter(Boolean)
)
const isProduction = process.env.NODE_ENV === 'production'
const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/
const hasPrettyLogger = (() => {
  try {
    require.resolve('pino-pretty')
    return true
  } catch {
    return false
  }
})()

// ── Logger ─────────────────────────────────────────────────────────────────
export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  transport: !isProduction && hasPrettyLogger ? { target: 'pino-pretty' } : undefined,
})

// Some networks resolve Atlas SRV records in the OS, but refuse Node's default DNS path.
dns.setServers(['8.8.8.8', '1.1.1.1'])

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        // Allow Cloudinary for images and PDF resume iframe
        'img-src': ["'self'", 'data:', 'https://res.cloudinary.com', `http://localhost:${process.env.PORT || 4000}`],
        'frame-src': ["'self'", 'https://res.cloudinary.com'],
        'font-src': ["'self'", 'data:'],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      const isConfiguredOrigin = allowedOrigins.has(origin)
      const isLocalDevOrigin = !isProduction && localhostOriginPattern.test(origin)

      if (isConfiguredOrigin || isLocalDevOrigin) {
        callback(null, true)
        return
      }

      callback(new Error(`Origin ${origin} is not allowed by CORS.`))
    },
    credentials: true,
  }),
)
app.use(cookieParser())
app.use(express.json())
app.use(pinoHttp({ logger }))

// ── Static client files ────────────────────────────────────────────────────
// Must come before API routes so built assets (.js, .css) are served with correct MIME types
app.use(express.static(clientDistPath))

// Serve uploaded project images publicly
app.use('/uploads/projects', express.static(path.resolve(serverRoot, 'uploads', 'projects')))

// ── Routes ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/projects', projectsRoutes)
app.use('/api/skills', skillsRoutes)
app.use('/api/resume', resumeRoutes)
app.use('/api/profile-image', profileImageRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/track', trackRoutes)

// ── SPA catch-all ──────────────────────────────────────────────────────────
// Must come AFTER express.static and all API routes.
// If a request has a file extension (.js, .css, .png) and was not served by
// express.static, it means the file does not exist — return 404 instead of
// index.html to prevent wrong MIME types (e.g. text/html for a .js request).
app.use((req, res, next) => {
  if (path.extname(req.path)) return next()
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

// ── Error handler ──────────────────────────────────────────────────────────
app.use((error, _request, response, _next) => {
  const message = error instanceof Error ? error.message : 'Unexpected server error.'
  response.status(500).json({ message })
})

// ── Seed admin user ────────────────────────────────────────────────────────
async function seedAdminUser() {
  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD

  const existing = await AdminUser.findOne({ username })
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12)
    await AdminUser.create({ username, passwordHash })
    logger.info({ username }, 'Admin user created')
    return
  }

  const passwordMatches = await bcrypt.compare(password, existing.passwordHash)
  if (!passwordMatches) {
    existing.passwordHash = await bcrypt.hash(password, 12)
    await existing.save()
    logger.info({ username }, 'Admin user password synced from environment')
  }
}

// ── Start ──────────────────────────────────────────────────────────────────
async function start() {
  await fs.mkdir(uploadsDirectory, { recursive: true })
  await fs.mkdir(brandingDirectory, { recursive: true })
  await fs.mkdir(projectsUploadsDirectory, { recursive: true })
  await connectToDatabase(process.env.MONGODB_URI)
  await seedAdminUser()

  app.listen(port, () => {
    logger.info(`Portfolio API running on http://localhost:${port}`)
  })
}

start().catch((error) => {
  logger.error(error, 'Failed to start server')
  process.exit(1)
})
