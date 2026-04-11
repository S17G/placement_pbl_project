const path = require('path')
const dotenv = require('dotenv')

const envPath = path.resolve(__dirname, '..', '..', '.env')
dotenv.config({ path: envPath })

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI || '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'unsafe-default-secret',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '1d',
  jwtCookieName: process.env.JWT_COOKIE_NAME || 'pm_access_token',
}

module.exports = env
