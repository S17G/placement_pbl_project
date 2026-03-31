const mongoose = require('mongoose')
const path = require('path')

let isListenerBound = false

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

async function connectDatabase(mongodbUri) {
  if (!mongodbUri) {
    const expectedEnvPath = path.resolve(__dirname, '..', '..', '.env')
    throw new Error(`MONGODB_URI is missing. Set it in ${expectedEnvPath}.`)
  }

  bindConnectionLogs()
  console.log('[MongoDB] Connecting...')

  await mongoose.connect(mongodbUri, {
    autoIndex: true,
  })
}

module.exports = { connectDatabase }
