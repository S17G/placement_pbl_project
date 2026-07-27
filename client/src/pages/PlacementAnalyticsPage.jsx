import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import http from '../api/http'

const COLORS = ['#fb923c', '#f59e0b', '#d97706', '#b45309', '#78350f']

function PlacementAnalyticsPage() {
  console.log('PlacementAnalyticsPage mounted')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await http.get('/v1/analytics/placement-stats')
        setData(response.data?.data)
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    void fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400">
        Unable to load placement analytics data.
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-100">Placement Analytics</h1>
        <p className="text-slate-400">Historical performance and branch-wise placement insights.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {data.summary.map((item) => (
          <article
            key={item.label}
            className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-xl transition hover:border-orange-500/30"
          >
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{item.label}</p>
            <p className="mt-2 text-3xl font-black text-slate-100">{item.value}</p>
            <p className="mt-1 text-xs text-orange-500/70">{item.sub}</p>
          </article>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Placement Trend Line Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
            <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Year Over Year</p>
                <h2 className="text-xl font-bold text-slate-100">Placement Trend — Companies Visited</h2>
            </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                />
                <YAxis 
                    stroke="#64748b" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#f1f5f9'
                  }}
                  itemStyle={{ color: '#fb923c' }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#fb923c"
                  strokeWidth={4}
                  dot={{ fill: '#fb923c', r: 6, strokeWidth: 2, stroke: '#020617' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Recruitment activity (all years)
          </div>
        </div>

        {/* Branch-wise Bar Chart */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
            <div className="mb-8">
                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">By Department • 2024-25</p>
                <h2 className="text-xl font-bold text-slate-100">Branch-wise Recruitment</h2>
            </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.branchDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#64748b"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(251, 146, 60, 0.05)' }}
                  contentStyle={{
                    backgroundColor: '#020617',
                    border: '1px solid #1e293b',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                  {data.branchDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Yearly Deep Dive */}
      <YearlyDeepDive data={data.historical} />

      {/* Department-wise Progress Chart */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl sm:p-8">
          <div className="mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Long-term Trends</p>
              <h2 className="text-xl font-bold text-slate-100">Department-wise Placement Progress</h2>
          </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.historical}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                  dataKey="year" 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
              />
              <YAxis 
                  stroke="#64748b" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Bar dataKey="ce" name="CE" fill="#fb923c" radius={[4, 4, 0, 0]} />
              <Bar dataKey="it" name="IT" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="entc" name="ENTC" fill="#d97706" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detail Table / List */}
      <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-100">Top Recruiters Performance</h2>
        <p className="mb-6 text-sm text-slate-500">Detailed breakdown of company participation and packages.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-4 pr-4 font-semibold">Company</th>
                <th className="pb-4 pr-4 font-semibold">Package (LPA)</th>
                <th className="pb-4 pr-4 font-semibold">Target Branch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.topRecruiters?.map((recruiter) => (
                <tr key={recruiter.name} className="group">
                  <td className="py-4 pr-4 font-medium text-slate-100 group-hover:text-orange-400">
                    {recruiter.name}
                  </td>
                  <td className="py-4 pr-4 text-slate-300">{recruiter.package}</td>
                  <td className="py-4 pr-4 text-slate-500">{recruiter.branch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function YearlyDeepDive({ data }) {
  const [selectedYear, setSelectedYear] = useState(data[data.length - 1]?.year)
  const yearData = data.find((d) => d.year === selectedYear)

  if (!yearData) return null

  const chartData = [
    { name: 'Placed', value: yearData.placed },
    { name: 'Remaining', value: yearData.enrolled - yearData.placed },
  ]

  const COLORS_PIE = ['#fb923c', '#1e293b']

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 shadow-2xl">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Historical Deep Dive</p>
          <h2 className="text-xl font-bold text-slate-100">Placement Success Rate</h2>
        </div>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none focus:border-orange-500"
        >
          {data.map((d) => (
            <option key={d.year} value={d.year}>
              Batch {d.year}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="flex flex-col justify-center space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-slate-900/50 p-4">
              <p className="text-xs font-medium text-slate-500">Enrolled Students</p>
              <p className="text-2xl font-bold text-slate-100">{yearData.enrolled}</p>
            </div>
            <div className="rounded-2xl bg-slate-900/50 p-4">
              <p className="text-xs font-medium text-slate-500">Placed Students</p>
              <p className="text-2xl font-bold text-orange-500">{yearData.placed}</p>
            </div>
          </div>
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-6">
            <p className="text-sm font-medium text-slate-300">Placement Percentage</p>
            <p className="text-4xl font-black text-orange-400">
              {yearData.percentage}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
                {selectedYear === '2024-25' ? 'Current Batch (In Progress)' : 'Final Year Audit Result'}
            </p>
          </div>
        </div>

        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS_PIE[index % COLORS_PIE.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  border: '1px solid #1e293b',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default PlacementAnalyticsPage
