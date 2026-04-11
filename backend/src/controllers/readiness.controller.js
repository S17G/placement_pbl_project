const ApiResponse = require('../utils/ApiResponse')

async function checkReadiness(req, res) {
  return res.status(200).json(new ApiResponse(200, 'Placement readiness endpoint ready'))
}

module.exports = {
  checkReadiness,
}
