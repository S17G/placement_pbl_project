const jwt = require('jsonwebtoken')
const ApiError = require('../utils/ApiError')
const env = require('../config/env')

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const bearerToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null

  const token = bearerToken || req.cookies?.[env.jwtCookieName]

  if (!token) {
    return next(new ApiError(401, 'Authentication required'))
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret)
    req.user = payload
    next()
  } catch {
    next(new ApiError(401, 'Invalid or expired token'))
  }
}

function requireRole(...roles) {
  return function roleGuard(req, res, next) {
    if (!req.user?.role || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Forbidden: insufficient permissions'))
    }

    next()
  }
}

module.exports = {
  requireAuth,
  requireRole,
}
