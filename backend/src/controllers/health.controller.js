const ApiResponse = require('../utils/ApiResponse')

async function healthCheck(req, res) {
  return res.status(200).json(
    new ApiResponse(200, 'Backend healthy', {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }),
  )
}

module.exports = {
  healthCheck,
}
