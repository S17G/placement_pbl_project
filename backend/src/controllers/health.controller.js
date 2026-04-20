async function healthCheck(req, res) {
  return res.status(200).json({ ok: true })
}

module.exports = {
  healthCheck,
}
