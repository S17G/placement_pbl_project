const mongoose = require('mongoose')
const ApiResponse = require('../utils/ApiResponse')

// Official PICT Website Statistics
const DEPT_STATS = {
  CE: {
    '2017-18': 184, '2018-19': 239, '2019-20': 254, '2020-21': 269, '2021-22': 249, '2022-23': 273, '2023-24': 293, '2024-25': 252
  },
  ENTC: {
    '2017-18': 125, '2018-19': 180, '2019-20': 179, '2020-21': 202, '2021-22': 236, '2022-23': 224, '2023-24': 219, '2024-25': 148
  },
  IT: {
    '2017-18': 96, '2018-19': 104, '2019-20': 122, '2020-21': 190, '2021-22': 186, '2022-23': 210, '2023-24': 196, '2024-25': 164
  }
}

const HISTORICAL_DATA = [
  { year: '2017-18', enrolled: 617, placed: 405 },
  { year: '2018-19', enrolled: 631, placed: 523 },
  { year: '2019-20', enrolled: 659, placed: 555 },
  { year: '2020-21', enrolled: 720, placed: 661 },
  { year: '2021-22', enrolled: 730, placed: 671 },
  { year: '2022-23', enrolled: 755, placed: 707 },
  { year: '2023-24', enrolled: 760, placed: 708 },
  { year: '2024-25', enrolled: 775, placed: 564 } // 252+148+164 = 564
]

async function getPlacementStats(req, res) {
  const db = mongoose.connection.db
  const companies = await db.collection('companies_official').find().toArray()

  let maxPackage = 0; let totalPackage = 0; let packageCount = 0
  const parsedCompanies = []

  companies.forEach(company => {
    const ctcStr = String(company.ctc || '')
    const match = ctcStr.match(/(\d+\.?\d*)/)
    let ctcValue = 0
    if (match) {
      ctcValue = parseFloat(match[1])
      if (ctcValue > maxPackage) maxPackage = ctcValue
      totalPackage += ctcValue
      packageCount++
    }
    parsedCompanies.push({ name: company.company_name, ctc: ctcValue, branch: company.branch })
  })

  const avgPackage = packageCount > 0 ? (totalPackage / packageCount).toFixed(2) : 0

  // Trend Chart (Line Chart)
  const trendData = HISTORICAL_DATA.map(d => ({
    name: d.year,
    value: d.placed,
    percentage: ((d.placed / d.enrolled) * 100).toFixed(2)
  }))

  // Branch-wise (Bar Chart) - Latest Year 2024-25
  const branchData = [
    { name: 'CE', value: DEPT_STATS.CE['2024-25'] },
    { name: 'IT', value: DEPT_STATS.IT['2024-25'] },
    { name: 'ENTC', value: DEPT_STATS.ENTC['2024-25'] },
    { name: 'E&CE', value: 0 },
    { name: 'AIDS', value: 0 }
  ]

  const stats = {
    summary: [
      { label: 'Total Students Placed', value: '564', sub: '2024-25 Batch' },
      { label: 'Companies Visited', value: String(companies.length), sub: 'Official Recruits' },
      { label: 'Average Package', value: `₹ ${avgPackage} LPA`, sub: 'Current Session' },
      { label: 'Highest Package', value: `₹ ${maxPackage} LPA`, sub: 'Record High' },
    ],
    trend: trendData,
    branchDistribution: branchData,
    historical: HISTORICAL_DATA.map(d => ({
        ...d,
        percentage: ((d.placed / d.enrolled) * 100).toFixed(2),
        ce: DEPT_STATS.CE[d.year] || 0,
        it: DEPT_STATS.IT[d.year] || 0,
        entc: DEPT_STATS.ENTC[d.year] || 0
    })),
    topRecruiters: parsedCompanies
        .sort((a, b) => b.ctc - a.ctc)
        .slice(0, 5)
        .map(c => ({ name: c.name, package: c.ctc.toFixed(2), branch: c.branch }))
  }

  return res.status(200).json(new ApiResponse(200, 'Analytics fetched', stats))
}

module.exports = {
  getPlacementStats
}
