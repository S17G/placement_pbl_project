const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const env = require('../config/env')

async function hashPassword(rawPassword) {
  return bcrypt.hash(rawPassword, 10)
}

async function comparePassword(rawPassword, hash) {
  return bcrypt.compare(rawPassword, hash)
}

function createAccessToken(payload) {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiry,
  })
}

module.exports = {
  hashPassword,
  comparePassword,
  createAccessToken,
}
