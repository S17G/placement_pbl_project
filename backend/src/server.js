const app = require('./app')
const env = require('./config/env')
const { connectDatabase, disconnectDatabase } = require('./config/db')
const { ensureAdminUser } = require('./services/seed.service')

async function shutdown(signal) {
  try {
    await disconnectDatabase()
    console.log(`[Server] Graceful shutdown complete (${signal})`)
  } catch (error) {
    console.error('[Server] Graceful shutdown failed:', error)
  } finally {
    process.exit(0)
  }
}

async function bootstrap() {
  await connectDatabase(env.mongodbUri, {
    enableInMemoryMongo: env.enableInMemoryMongo,
  })
  await ensureAdminUser()

  app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap backend:', error)
  process.exit(1)
})

process.on('SIGINT', () => {
  shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})
