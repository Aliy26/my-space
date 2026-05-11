import jwt from 'jsonwebtoken'

export function requireAuth(request, response, next) {
  const token = request.cookies?.admin_token

  if (!token) {
    response.status(401).json({ message: 'Unauthorized.' })
    return
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    request.admin = payload
    next()
  } catch {
    response.status(401).json({ message: 'Invalid or expired token.' })
  }
}
