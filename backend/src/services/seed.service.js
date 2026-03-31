const User = require('../models/User')
const { hashPassword } = require('./auth.service')

const ADMIN_EMAIL = 'admin.placemate@gmail.com'
const ADMIN_PASSWORD = 'admin.placemate@gmail.com'
const ADMIN_PRN = 'ADMIN-PLACEMATE-0001'

async function ensureAdminUser() {
  const passwordHash = await hashPassword(ADMIN_PASSWORD)

  const admin = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    {
      $set: {
        fullName: 'PlaceMate Admin',
        prn: ADMIN_PRN,
        email: ADMIN_EMAIL,
        passwordHash,
        role: 'admin',
        isApproved: true,
        branch: 'TnP',
        year: 'Admin',
        skills: [],
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    },
  )

  console.log(`[Seed] Admin user ready: ${admin.email}`)
}

module.exports = {
  ensureAdminUser,
  ADMIN_EMAIL,
}
