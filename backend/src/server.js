const app = require('./app')
const env = require('./config/env')
const { connectDatabase } = require('./config/db')
const { ensureAdminUser } = require('./services/seed.service')

async function bootstrap() {
  await connectDatabase(env.mongodbUri)
  await ensureAdminUser()

  app.listen(env.port, () => {
    console.log(`Backend running on port ${env.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap backend:', error)
  process.exit(1)
})
