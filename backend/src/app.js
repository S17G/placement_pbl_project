const compression = require('compression')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
const rateLimit = require('express-rate-limit')

const env = require('./config/env')
const errorHandler = require('./middlewares/errorHandler')
const notFound = require('./middlewares/notFound')
const routes = require('./routes')

const app = express()

const configuredOrigins = String(env.clientUrl || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const defaultDevOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]

const allowedOrigins = new Set([...configuredOrigins, ...defaultDevOrigins])

app.set('trust proxy', 1)

app.use(helmet())
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      if (!requestOrigin || allowedOrigins.has(requestOrigin)) {
        callback(null, true)
        return
      }

      callback(new Error('CORS origin not allowed'))
    },
    credentials: true,
  }),
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
)
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }))
app.use(cookieParser())
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'))
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

app.use('/api', routes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
