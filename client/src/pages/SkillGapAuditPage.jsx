import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, 
  Search, 
  Plus, 
  X, 
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Clock,
  Briefcase,
  Target,
  ExternalLink,
  BookOpen,
  Video,
  Code2,
  Pencil,
  Check,
  LayoutGrid
} from 'lucide-react'
import axios from 'axios'
import toast, { Toaster } from 'react-hot-toast'

const AI_BASE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/v1'

export default function SkillGapAuditPage() {
  // --- STATE ---
  const [loading, setLoading] = useState(false)
  const [metadata, setMetadata] = useState({ roles: [], companies: [], ctc_brackets: [], mappings: [] })
  
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedCTC, setSelectedCTC] = useState('')
  
  const [studentSkills, setStudentSkills] = useState(['Java', 'Data Structures & Algorithms', 'OOP', 'HTML', 'CSS'])
  const [newSkill, setNewSkill] = useState('')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [editableRoadmap, setEditableRoadmap] = useState([]) // editable copy of roadmap_blocks
  const [editingCell, setEditingCell] = useState(null) // { blockIdx, taskIdx } | null
  const [editValue, setEditValue] = useState('')

  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState([])
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [providerUsed, setProviderUsed] = useState('gemini') // 'gemini' | 'groq'
  const [isGroqFallback, setIsGroqFallback] = useState(false)

  const [recommendedSkills, setRecommendedSkills] = useState([])
  const [quickMatchData, setQuickMatchData] = useState(null)

  // --- EFFECTS ---
  useEffect(() => {
    fetchMetadata()
  }, [])

  const fetchMetadata = async () => {
    try {
      const resp = await axios.get(`${AI_BASE_URL}/metadata`)
      setMetadata({
        roles: resp.data.roles || [],
        companies: resp.data.companies || [],
        ctc_brackets: resp.data.ctc_brackets || [],
        mappings: resp.data.mappings || []
      })
    } catch (err) {
      if (err.response && err.response.status === 503) {
        toast.loading('AI Service is warming up. Loading placement data from MongoDB...', { id: 'api-warmup' })
        setTimeout(fetchMetadata, 3000) // Retry in 3s
      } else {
        console.error('AI Service connectivity issue', err)
        toast.error('AI Service not reachable. Please ensure port 8000 is active.', { id: 'api-error' })
      }
    }
  }

  // --- DERIVED STATE FOR DROPDOWNS ---
  const mappings = metadata.mappings || []

  const availableCompanies = useMemo(() => {
    if (!selectedRole && !selectedCTC) return metadata.companies
    let filtered = mappings
    if (selectedRole) filtered = filtered.filter(m => m.role === selectedRole)
    if (selectedCTC) filtered = filtered.filter(m => m.ctc_bracket === selectedCTC)
    return [...new Set(filtered.map(m => m.company))].sort()
  }, [mappings, selectedRole, selectedCTC, metadata.companies])

  const availableRoles = useMemo(() => {
    if (!selectedCompany && !selectedCTC) return metadata.roles
    let filtered = mappings
    if (selectedCompany) filtered = filtered.filter(m => m.company === selectedCompany)
    if (selectedCTC) filtered = filtered.filter(m => m.ctc_bracket === selectedCTC)
    return [...new Set(filtered.map(m => m.role))].sort()
  }, [mappings, selectedCompany, selectedCTC, metadata.roles])

  const availableCTCs = useMemo(() => {
    if (!selectedCompany && !selectedRole) return metadata.ctc_brackets
    let filtered = mappings
    if (selectedCompany) filtered = filtered.filter(m => m.company === selectedCompany)
    if (selectedRole) filtered = filtered.filter(m => m.role === selectedRole)
    return [...new Set(filtered.map(m => m.ctc_bracket))].sort()
  }, [mappings, selectedCompany, selectedRole, metadata.ctc_brackets])

  // Invalid selection cleanup
  useEffect(() => {
    if (selectedCompany && availableCompanies.length > 0 && !availableCompanies.includes(selectedCompany)) setSelectedCompany('')
    if (selectedRole && availableRoles.length > 0 && !availableRoles.includes(selectedRole)) setSelectedRole('')
    if (selectedCTC && availableCTCs.length > 0 && !availableCTCs.includes(selectedCTC)) setSelectedCTC('')
  }, [selectedCompany, selectedRole, selectedCTC, availableCompanies, availableRoles, availableCTCs])

  // Auto-selection when only 1 option remains
  useEffect(() => {
    if (availableCompanies.length === 1 && !selectedCompany) setSelectedCompany(availableCompanies[0])
    if (availableRoles.length === 1 && !selectedRole) setSelectedRole(availableRoles[0])
    if (availableCTCs.length === 1 && !selectedCTC) setSelectedCTC(availableCTCs[0])
  }, [availableCompanies, availableRoles, availableCTCs, selectedCompany, selectedRole, selectedCTC])

  const handleClearSelection = () => {
    setSelectedCompany('')
    setSelectedRole('')
    setSelectedCTC('')
  }

  // Fetch suggested skills
  useEffect(() => {
    if (selectedRole && selectedCTC) {
      axios.post(`${AI_BASE_URL}/recommend-skills`, {
        role: selectedRole,
        ctc_bracket: selectedCTC
      }).then(res => {
        setRecommendedSkills(res.data.recommended_skills || [])
      }).catch(err => console.error(err))
    } else {
      setRecommendedSkills([])
    }
  }, [selectedRole, selectedCTC])

  // Fetch quick match
  useEffect(() => {
    if (selectedCompany) {
      axios.post(`${AI_BASE_URL}/quick-match`, {
        company_name: selectedCompany,
        user_skills: studentSkills
      }).then(res => {
        setQuickMatchData(res.data)
      }).catch(err => console.error(err))
    } else {
      setQuickMatchData(null)
    }
  }, [selectedCompany, studentSkills])

  const handleRunAnalysis = async () => {
    if (!selectedCompany || !selectedRole || !selectedCTC) {
      toast.error('Please select Company, Role, and CTC')
      return
    }
    setLoading(true)
    setIsGroqFallback(false) // reset on new request
    try {
      const studentId = JSON.parse(sessionStorage.getItem('pmCurrentUser') || '{}').email || 'guest'
      const payload = {
        student_id: studentId,
        user_skills: studentSkills,
        target_role: selectedRole,
        target_ctc_bracket: selectedCTC,
        target_company: selectedCompany,
        background: 'Computer Science' 
      }
      
      const resp = await axios.post(`${AI_BASE_URL}/generate-roadmap`, payload)
      
      if (resp.data.error) {
        toast.error(resp.data.error)
      } else {
        // Detect if Groq fallback was used
        const provider = resp.data._provider || 'gemini'
        setProviderUsed(provider)
        if (provider === 'groq') {
          setIsGroqFallback(true)
          toast.success('Analysis complete! Your personalized roadmap is ready.', {
            id: 'analysis-success',
            icon: '🎯',
            style: { background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }
          })
        }
        setAnalysisResult(resp.data)
        setEditableRoadmap(resp.data.roadmap_blocks || [])
      }
    } catch (err) {
      const errMsg = err.response?.data?.detail || 'Analysis failed. Check your API key or backend logs.'
      toast.error(errMsg, { id: 'analysis-error', duration: 5000 })
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return
    const msg = chatMessage
    setChatMessage('')
    setChatHistory(prev => [...prev, { role: 'user', content: msg }])
    setIsChatLoading(true)
    
    try {
      const studentId = JSON.parse(sessionStorage.getItem('pmCurrentUser') || '{}').email || 'guest'
      const resp = await axios.post(`${AI_BASE_URL}/chat`, {
        student_id: studentId,
        message: msg
      })
      setChatHistory(prev => [...prev, { role: 'assistant', content: resp.data.response }])
    } catch (err) {
      toast.error('Chat context failed')
    } finally {
      setIsChatLoading(false)
    }
  }

  const addSkill = (skill) => {
    if (skill && !studentSkills.includes(skill)) {
      setStudentSkills([...studentSkills, skill])
    }
    setNewSkill('')
  }

  const removeSkill = (skill) => {
    setStudentSkills(studentSkills.filter(s => s !== skill))
  }

  // --- EDITABLE ROADMAP HANDLERS ---
  const startEditTask = (blockIdx, taskIdx) => {
    setEditingCell({ blockIdx, taskIdx })
    setEditValue(editableRoadmap[blockIdx].tasks[taskIdx])
  }

  const saveEditTask = () => {
    if (!editingCell) return
    const { blockIdx, taskIdx } = editingCell
    const updated = editableRoadmap.map((block, bi) =>
      bi === blockIdx
        ? { ...block, tasks: block.tasks.map((t, ti) => ti === taskIdx ? editValue : t) }
        : block
    )
    setEditableRoadmap(updated)
    setEditingCell(null)
  }

  const addTaskToBlock = (blockIdx) => {
    const updated = editableRoadmap.map((block, bi) =>
      bi === blockIdx ? { ...block, tasks: [...block.tasks, 'New task — click to edit'] } : block
    )
    setEditableRoadmap(updated)
    startEditTask(blockIdx, updated[blockIdx].tasks.length - 1)
  }

  const removeTaskFromBlock = (blockIdx, taskIdx) => {
    const updated = editableRoadmap.map((block, bi) =>
      bi === blockIdx ? { ...block, tasks: block.tasks.filter((_, ti) => ti !== taskIdx) } : block
    )
    setEditableRoadmap(updated)
  }

  const RESOURCE_ICON = { course: BookOpen, video: Video, practice: Code2 }
  const RESOURCE_COLOR = { course: 'text-blue-400 border-blue-500/30 bg-blue-500/10', video: 'text-rose-400 border-rose-500/30 bg-rose-500/10', practice: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' }
  const BLOCK_COLORS = [
    'border-orange-500/40 bg-orange-500/5',
    'border-blue-500/40 bg-blue-500/5',
    'border-violet-500/40 bg-violet-500/5',
    'border-emerald-500/40 bg-emerald-500/5',
  ]
  const BLOCK_HEADER_COLORS = ['text-orange-400', 'text-blue-400', 'text-violet-400', 'text-emerald-400']
  const BLOCK_NUM_BG = ['bg-orange-500/20 border-orange-500/30 text-orange-400', 'bg-blue-500/20 border-blue-500/30 text-blue-400', 'bg-violet-500/20 border-violet-500/30 text-violet-400', 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400']

  return (
    <div className="relative min-h-screen bg-[#0f172a] text-slate-200 font-sans">
      <Toaster position="top-right" />
      
      {/* Background Orbs */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-orange-500/10 blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 -left-24 h-64 w-64 rounded-full bg-amber-500/5 blur-[96px] pointer-events-none" />

      <main className="relative z-10 flex min-h-[112vh] p-6 gap-6">
        
        {/* LEFT PANE - Navigation & Selection */}
        <section className="w-80 flex flex-col gap-6 shrink-0">
          
          {/* Form Selection */}
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-widest">Target Profile</h3>
              {(selectedCompany || selectedRole || selectedCTC) && (
                <button 
                  onClick={handleClearSelection}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-orange-400 transition-colors flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded-lg"
                >
                  <X className="h-3 w-3" /> Clear
                </button>
              )}
            </div>
            
            <div className="space-y-1 relative">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Company</label>
              <select 
                value={selectedCompany} 
                onChange={e => setSelectedCompany(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-200 focus:border-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a company...</option>
                {availableCompanies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-[30px] h-4 w-4 text-slate-500 rotate-90 pointer-events-none" />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Job Role</label>
              <select 
                value={selectedRole} 
                onChange={e => setSelectedRole(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-200 focus:border-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a role...</option>
                {availableRoles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-[30px] h-4 w-4 text-slate-500 rotate-90 pointer-events-none" />
            </div>

            <div className="space-y-1 relative">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-1">Salary / CTC</label>
              <select 
                value={selectedCTC} 
                onChange={e => setSelectedCTC(e.target.value)}
                className="w-full rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-xs text-slate-200 focus:border-orange-500/50 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="">Select a CTC bracket...</option>
                {availableCTCs.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronRight className="absolute right-4 top-[30px] h-4 w-4 text-slate-500 rotate-90 pointer-events-none" />
            </div>

            <button 
              onClick={handleRunAnalysis}
              disabled={!selectedCompany || !selectedRole || !selectedCTC || loading}
              className="mt-2 w-full rounded-2xl bg-orange-500 py-3.5 text-[13px] font-black uppercase tracking-widest text-slate-950 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
            >
              {loading ? 'Analyzing...' : 'Run Skill Gap Audit'}
            </button>
          </div>

          {/* Your Skills Sidebar */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Your skills</h3>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">{studentSkills.length} skills</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-4 max-h-32 overflow-y-auto custom-scrollbar pr-2">
              {studentSkills.map(s => (
                <span key={s} className="flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700/50 px-2.5 py-1 text-[10px] text-slate-300 transition hover:bg-slate-700">
                  {s} <X className="h-3 w-3 cursor-pointer hover:text-rose-400" onClick={() => removeSkill(s)} />
                </span>
              ))}
            </div>
            <div className="relative group">
              <Plus className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500 group-focus-within:text-orange-400" />
              <input 
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSkill(newSkill)}
                placeholder="Add a skill..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 pl-8 pr-3 text-[10px] text-slate-200 focus:border-orange-500/50 outline-none transition-all"
              />
            </div>

            {recommendedSkills.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-3">Suggested for this role:</p>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 min-w-0">
                  {recommendedSkills.filter(s => !studentSkills.some(us => us.toLowerCase() === s.toLowerCase())).map(s => (
                    <button 
                      key={s} 
                      onClick={() => addSkill(s)}
                      className="shrink-0 flex items-center gap-1 rounded-lg border border-orange-500/30 bg-orange-500/10 px-2.5 py-1.5 text-[10px] text-orange-200 transition hover:bg-orange-500/20"
                    >
                      <Plus className="h-3 w-3" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Required Skills & Quick Match Sidebar */}
          {quickMatchData && (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">Required skills</h3>
                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-bold">{quickMatchData.matched.length + quickMatchData.missing.length} required</span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-6 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {quickMatchData.matched.map(s => (
                  <span key={s} className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[10px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> {s}
                  </span>
                ))}
                {quickMatchData.missing.map(s => (
                  <span key={s} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-[10px] font-bold text-slate-400">
                    <X className="h-3 w-3 text-rose-500/70" /> {s}
                  </span>
                ))}
              </div>

              {/* Quick Match Progress */}
              <div className="pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[11px] font-bold text-slate-300">Quick match</h3>
                  <span className="text-xl font-black text-slate-100">{Math.round(quickMatchData.match_p)}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800/80 overflow-hidden mb-3">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${quickMatchData.match_p}%` }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-lg border border-emerald-500/20">{quickMatchData.matched.length} matched</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 px-2 py-1 rounded-lg border border-rose-500/20">{quickMatchData.missing.length} missing</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* RIGHT PANE - Analysis Result */}
        <section className="flex-1 flex flex-col gap-6 min-w-0">
          {analysisResult ? (
            <>
              {/* Header Box */}
              <div className="w-full min-w-0 rounded-[40px] border border-slate-800 bg-slate-900/50 p-10 backdrop-blur-3xl shadow-2xl">
                <div className="flex items-center justify-between mb-10 gap-10">
                  <div className="space-y-4">
                    <h1 className="text-4xl font-extrabold text-slate-100">{analysisResult.company_name}</h1>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-orange-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-tighter text-orange-400 border border-orange-500/20">
                        Company analysis
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 flex-1 max-w-sm">
                    <div className="w-full flex items-center gap-4">
                      <div className="flex-1 h-3 rounded-full bg-slate-800/80 overflow-hidden shadow-inner">
                        <div className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-1000 ease-out" style={{ width: `${analysisResult.match_percentage}%` }} />
                      </div>
                      <span className="text-lg font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">{analysisResult.match_percentage}% match</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">{analysisResult.matched_count} matched • {analysisResult.missing_count} missing</p>
                  </div>
                  <div className="shrink-0 text-center space-y-1 bg-slate-800/80 px-4 py-3 rounded-2xl border border-slate-700/50">
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Priority skill:</p>
                    <div className="rounded-lg bg-orange-500 text-slate-950 px-3 py-1 text-xs font-black uppercase tracking-tight shadow-lg shadow-orange-500/20">
                      {analysisResult.priority_skill || 'SQL'}
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1 mt-1"><Clock className="h-3 w-3" /> ~{analysisResult.estimated_preparation_days || 35} days</p>
                  </div>
                </div>

                {/* Analysis Box */}
                <div className="mb-10 rounded-[30px] border border-emerald-500/30 bg-emerald-500/5 p-8 backdrop-blur-md">
                   <h5 className="mb-4 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400/60">Analysis Summary</h5>
                   <p className="text-slate-200 leading-relaxed text-[15px] font-medium italic opacity-90">
                     "{analysisResult.analysis_summary}"
                   </p>
                   <div className="mt-6 flex items-center gap-3 text-emerald-400 text-xs font-bold py-2 px-4 rounded-xl bg-emerald-500/10 w-fit border border-emerald-500/20">
                     <CheckCircle2 className="h-4 w-4" /> {analysisResult.readiness_status}
                   </div>
                </div>

                {/* Skills Grid */}
                <div className="flex flex-col gap-10 w-full min-w-0">
                  <div className="space-y-6 w-full min-w-0">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      Skills you already have <span className="text-emerald-500 ml-2 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">✓ {analysisResult.matched_count}</span>
                    </h4>
                    <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                      <div className="flex gap-3 w-max">
                         {analysisResult.skills_already_have.map(s => (
                           <span key={s} className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-200">
                             {s}
                           </span>
                         ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 w-full min-w-0">
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      Skills to develop <span className="text-rose-500 ml-2 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">⚠ {analysisResult.missing_count}</span>
                    </h4>
                    <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                      <div className="flex gap-4 w-max">
                        {analysisResult.skills_to_develop.map(item => (
                          <div key={item.skill} className="shrink-0 w-72 flex flex-col gap-3 rounded-2xl bg-slate-950/40 p-4 border border-slate-800/80 group hover:border-rose-500/30 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]" />
                                <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{item.skill}</span>
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-[9px] font-black text-orange-400 uppercase tracking-tight border border-orange-500/20">{item.tag || 'Critical'}</span>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><Clock className="h-3 w-3" /> ~{item.est_days || 14}d</span>
                              </div>
                            </div>
                            {item.resource_link && (
                              <a 
                                href={item.resource_link} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="ml-6 flex items-center justify-center gap-2 text-[10px] font-bold text-blue-400 hover:text-blue-300 w-fit bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 transition-all hover:scale-105"
                              >
                                <BookOpen className="h-3 w-3" /> Study Resource <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat & Roadmap Row */}
              <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
                {/* EDITABLE BLOCK DIAGRAM ROADMAP */}
                <div className="col-span-8 overflow-y-auto custom-scrollbar pb-10">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold flex items-center gap-2"><Target className="h-5 w-5 text-orange-400" /> 8-Week Placement Roadmap</h2>
                    <span className="text-[10px] text-slate-500 border border-slate-700 rounded-lg px-2 py-1">Click any task to edit</span>
                  </div>

                  {/* Timeline connector row */}
                  <div className="space-y-0">
                    {editableRoadmap.map((block, idx) => (
                      <div key={idx}>
                        {/* Phase Block */}
                        <div className={`rounded-2xl border p-5 transition-all ${BLOCK_COLORS[idx % BLOCK_COLORS.length]} backdrop-blur-md`}>
                          {/* Block Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`h-7 w-7 shrink-0 rounded-xl flex items-center justify-center text-[11px] font-black border ${BLOCK_NUM_BG[idx % BLOCK_NUM_BG.length]}`}>{idx + 1}</div>
                              <div>
                                <p className={`text-xs font-black uppercase tracking-widest ${BLOCK_HEADER_COLORS[idx % BLOCK_HEADER_COLORS.length]}`}>{block.title}</p>
                                {block.skills_covered && (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {block.skills_covered.map(s => (
                                      <span key={s} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400">{s}</span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <button onClick={() => addTaskToBlock(idx)} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-orange-400 border border-slate-700 hover:border-orange-500/40 rounded-lg px-2 py-1 transition-all">
                              <Plus className="h-3 w-3" /> Task
                            </button>
                          </div>

                          {/* Tasks List */}
                          <ul className="space-y-2 mb-5">
                            {block.tasks.map((task, ti) => (
                              <li key={ti} className="group flex items-start gap-2">
                                <ChevronRight className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${BLOCK_HEADER_COLORS[idx % BLOCK_HEADER_COLORS.length]} opacity-60`} />
                                {editingCell?.blockIdx === idx && editingCell?.taskIdx === ti ? (
                                  <div className="flex-1 flex items-center gap-2">
                                    <input
                                      autoFocus
                                      value={editValue}
                                      onChange={e => setEditValue(e.target.value)}
                                      onKeyDown={e => { if (e.key === 'Enter') saveEditTask(); if (e.key === 'Escape') setEditingCell(null) }}
                                      className="flex-1 bg-slate-900 border border-orange-500/50 rounded-lg px-2 py-1 text-[11px] text-slate-200 outline-none"
                                    />
                                    <button onClick={saveEditTask} className="text-emerald-400 hover:text-emerald-300"><Check className="h-3.5 w-3.5" /></button>
                                    <button onClick={() => removeTaskFromBlock(idx, ti)} className="text-rose-500/60 hover:text-rose-400"><X className="h-3.5 w-3.5" /></button>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-start justify-between gap-2">
                                    <span className="text-[11px] text-slate-300 leading-tight flex-1">{task}</span>
                                    <button onClick={() => startEditTask(idx, ti)} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-orange-400">
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </li>
                            ))}
                          </ul>

                          {/* Resources */}
                          {block.resources && block.resources.length > 0 && (
                            <div className="pt-3 border-t border-slate-700/30">
                              <p className="text-[9px] uppercase text-slate-600 font-black tracking-widest mb-2">Course Resources</p>
                              <div className="flex flex-wrap gap-2">
                                {block.resources.map((res, ri) => {
                                  const resObj = typeof res === 'object' ? res : { label: 'Resource', url: res, type: 'course' }
                                  const IconComp = RESOURCE_ICON[resObj.type] || BookOpen
                                  const colorClass = RESOURCE_COLOR[resObj.type] || RESOURCE_COLOR.course
                                  return (
                                    <a
                                      key={ri}
                                      href={resObj.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-bold transition-all hover:scale-105 ${colorClass}`}
                                    >
                                      <IconComp className="h-3 w-3" />
                                      {resObj.label || 'Resource'}
                                      <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                    </a>
                                  )
                                })}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Arrow connector between blocks */}
                        {idx < editableRoadmap.length - 1 && (
                          <div className="flex justify-center py-1">
                            <div className="w-px h-5 bg-gradient-to-b from-slate-700 to-transparent" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-4 flex flex-col rounded-[32px] border border-slate-800 bg-slate-900/40 backdrop-blur-xl shadow-2xl overflow-hidden min-h-0 mb-10">
                   <div className="border-b border-slate-800/50 p-6 bg-slate-950/30">
                      <h3 className="flex items-center gap-3 font-black text-slate-100 uppercase tracking-widest text-xs">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        Career Assistant
                      </h3>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4">
                         <p className="text-[11px] italic text-orange-200/80 leading-relaxed font-medium">"I'm ready to help you specialize for **{analysisResult.company_name}**. Ask me about the specific roadmap steps or interview questions!"</p>
                      </div>
                      {chatHistory.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-[13px] ${msg.role === 'user' ? 'bg-orange-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isChatLoading && <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse ml-2 flex items-center gap-2"><div className="h-1 w-1 bg-slate-500 rounded-full animate-bounce" /> Analyzing query...</div>}
                   </div>
                   <div className="p-6 border-t border-slate-800/50 bg-slate-950/30">
                      <div className="relative group">
                        <input 
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Ask a refinement..." 
                          className="w-full rounded-2xl border border-slate-800 bg-slate-950 py-4 pl-5 pr-12 text-[13px] text-slate-200 outline-none focus:border-orange-500/50 transition-all font-medium placeholder:text-slate-700 shadow-inner"
                        />
                        <button 
                          onClick={handleSendMessage}
                          disabled={isChatLoading}
                          className="absolute right-2 top-2 rounded-xl bg-orange-500 p-2 text-slate-950 hover:bg-orange-400 disabled:opacity-50 shadow-lg"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                   </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 rounded-[40px] border border-dashed border-slate-800">
               <div className="h-20 w-20 rounded-3xl bg-slate-950 flex items-center justify-center mb-8 border border-white/5 shadow-2xl">
                 <Search className="h-10 w-10 text-orange-500/40" />
               </div>
               <h2 className="text-2xl font-bold mb-4">Select a target to begin</h2>
               <p className="text-slate-500 max-w-sm text-sm">Choose a company, job role, and CTC from the left panel to run an instant skill gap audit against real PiCT data.</p>
            </div>
          )}
        </section>
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0f172a]/80 backdrop-blur-3xl">
          <div className="relative">
            <div className="h-24 w-24 animate-spin rounded-[30%] border-4 border-slate-800 border-t-orange-500 shadow-[0_0_50px_rgba(249,115,22,0.2)]"></div>
            <BarChart3 className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-orange-500 animate-pulse" />
          </div>
          <p className="mt-8 font-black text-orange-400 animate-pulse uppercase tracking-[0.4em] text-xs">Deep Audit In Progress</p>
        </div>
      )}

      {/* Global CSS for scrollbar */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(45, 55, 72, 0.4);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(249, 115, 22, 0.2);
        }
      `}</style>
    </div>
  )
}
