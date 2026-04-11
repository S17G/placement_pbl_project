const mongoose = require('mongoose')
const path = require('path')

let isListenerBound = false
let memoryServer = null

function bindConnectionLogs() {
  if (isListenerBound) {
    return
  }

  const connection = mongoose.connection

  connection.on('connected', () => {
    console.log(`[MongoDB] Connected: ${connection.host}/${connection.name}`)
  })

  connection.on('reconnected', () => {
    console.log('[MongoDB] Reconnected')
  })

  connection.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected')
  })

  connection.on('error', (error) => {
    console.error('[MongoDB] Connection error:', error.message)
  })

  isListenerBound = true
}

async function connectDatabase(mongodbUri, options = {}) {
  if (!mongodbUri) {
    const expectedEnvPath = path.resolve(__dirname, '..', '..', '.env')
    throw new Error(`MONGODB_URI is missing. Set it in ${expectedEnvPath}.`)
  }

  bindConnectionLogs()
  console.log('[MongoDB] Connecting...')

  try {
    await mongoose.connect(mongodbUri, {
      autoIndex: true,
    })
  } catch (error) {
    const isLocalRefused =
      error?.name === 'MongooseServerSelectionError' &&
      /ECONNREFUSED/.test(String(error?.message || ''))

    const shouldFallbackToMemory =
      process.env.NODE_ENV !== 'production' && options.enableInMemoryMongo !== false && isLocalRefused

    if (!shouldFallbackToMemory) {
      throw error
    }

    console.warn(
      '[MongoDB] Local MongoDB is unavailable. Falling back to in-memory database for development.'
    )

    let MongoMemoryServer
    try {
      ;({ MongoMemoryServer } = require('mongodb-memory-server'))
    } catch (requireError) {
      throw new Error(
        'mongodb-memory-server is required for development fallback. Install it with: npm install mongodb-memory-server'
      )
    }

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'placementdb',
      },
    })

    const memoryUri = memoryServer.getUri()
    await mongoose.connect(memoryUri, {
      autoIndex: true,
    })
    console.log('[MongoDB] In-memory database ready')
  }
}

async function disconnectDatabase() {
  await mongoose.disconnect()

  if (memoryServer) {
    await memoryServer.stop()
    memoryServer = null
  }
}

module.exports = { connectDatabase, disconnectDatabase }
