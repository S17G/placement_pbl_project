import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import http from '../api/http'

function FaqPage() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [faqs, setFaqs] = useState([])
  const [showComposer, setShowComposer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingFaqId, setEditingFaqId] = useState(null)
  const [editingQuestion, setEditingQuestion] = useState('')
  const [editingAnswer, setEditingAnswer] = useState('')
  const [searchParams] = useSearchParams()
  const mineOnly = String(searchParams.get('mine') || '') === 'true'

  const currentUser = useMemo(() => {
    const fallbackUser = {
      name: 'Student User',
      year: 'Year not set',
      branch: 'Branch not set',
      email: 'student@college.edu',
    }

    try {
      const savedUser = JSON.parse(sessionStorage.getItem('pmCurrentUser') || 'null')
      return savedUser || fallbackUser
    } catch {
      return fallbackUser
    }
  }, [])

  useEffect(() => {
    void refreshFaqs()
  }, [mineOnly])

  const refreshFaqs = async () => {
    try {
      const response = await http.get('/v1/faq', {
        params: mineOnly ? { mine: 'true' } : undefined,
      })
      setFaqs(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch FAQ entries.')
    }
  }

  const isOwnPost = (faq) => {
    const ownEmail = String(currentUser.email || '').toLowerCase()
    const postEmail = String(faq.authorEmail || '').toLowerCase()

    if (ownEmail && postEmail) {
      return ownEmail === postEmail
    }

    return String(faq.authorName || '').toLowerCase() === String(currentUser.name || '').toLowerCase()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedQuestion = question.trim()
    const trimmedAnswer = answer.trim()

    if (!trimmedQuestion || !trimmedAnswer) {
      toast.error('Question and answer are both required.')
      return
    }

    setIsSubmitting(true)
    try {
      await http.post('/v1/faq', {
        question: trimmedQuestion,
        answer: trimmedAnswer,
      })
      await refreshFaqs()
      setQuestion('')
      setAnswer('')
      setShowComposer(false)
      toast.success('FAQ posted and visible to all users.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to post FAQ entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveEdit = async (faqId) => {
    const trimmedQuestion = editingQuestion.trim()
    const trimmedAnswer = editingAnswer.trim()

    if (!trimmedQuestion || !trimmedAnswer) {
      toast.error('Question and answer are both required.')
      return
    }

    try {
      await http.patch(`/v1/faq/${faqId}`, {
        question: trimmedQuestion,
        answer: trimmedAnswer,
      })
      toast.success('FAQ updated.')
      setEditingFaqId(null)
      setEditingQuestion('')
      setEditingAnswer('')
      await refreshFaqs()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update FAQ entry.')
    }
  }

  const handleDelete = async (faqId) => {
    try {
      await http.delete(`/v1/faq/${faqId}`)
      toast.success('FAQ deleted.')
      await refreshFaqs()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete FAQ entry.')
    }
  }

  return (
    <section className="space-y-6 animate-fade-up">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">{mineOnly ? 'My FAQs' : 'FAQ and Knowledge Base'}</h1>
        <p className="text-sm text-slate-500 sm:text-base">
          {mineOnly
            ? 'Manage your own FAQ entries.'
            : 'Post common placement questions with answers so everyone can learn quickly.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Create a New FAQ Entry</p>
            <p className="text-xs text-slate-500">Click the button to open the FAQ posting form.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer((previous) => !previous)}
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {showComposer ? 'Close Form' : 'Create FAQ'}
          </button>
        </div>

        {showComposer && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4 animate-fade-up">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Question (required)</span>
              <input
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2"
                placeholder="Example: What is the usual CGPA cut-off for service companies?"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Answer (required)</span>
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                className="min-h-24 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none ring-cyan-500 transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2"
                placeholder="Write a clear and useful answer for juniors..."
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Posting as {currentUser.name} ({currentUser.year})</p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800"
              >
                {isSubmitting ? 'Submitting...' : 'Submit FAQ'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-3 animate-fade-up-delay">
        {faqs.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">
            No FAQ entries yet. Add the first helpful Q&A.
          </article>
        ) : (
          faqs.map((faq) => (
            <article
              key={faq._id || faq.id}
              className={`rounded-2xl border p-5 shadow-sm transition ${
                isOwnPost(faq)
                  ? 'border-sky-300 bg-sky-50/70'
                  : 'border-emerald-300 bg-emerald-50/70'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isOwnPost(faq)
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {isOwnPost(faq) ? 'Your FAQ' : 'Peer FAQ'}
                </span>
                <span className="text-xs text-slate-500">{new Date(faq.postedAt).toLocaleString()}</span>
              </div>

              {editingFaqId === faq._id ? (
                <div className="space-y-2">
                  <input
                    value={editingQuestion}
                    onChange={(event) => setEditingQuestion(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <textarea
                    value={editingAnswer}
                    onChange={(event) => setEditingAnswer(event.target.value)}
                    className="min-h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(faq._id)}
                      className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingFaqId(null)
                        setEditingQuestion('')
                        setEditingAnswer('')
                      }}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-semibold text-slate-900 sm:text-lg">{faq.question}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-700 sm:text-base">{faq.answer}</p>
                </>
              )}
              <div className="mt-3 space-y-1 text-xs text-slate-600 sm:text-sm">
                <p>Posted by {faq.authorName}</p>
                <p>{faq.authorYear} • {faq.authorBranch}</p>
              </div>

              {isOwnPost(faq) && editingFaqId !== faq._id && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingFaqId(faq._id)
                      setEditingQuestion(faq.question)
                      setEditingAnswer(faq.answer)
                    }}
                    className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(faq._id)}
                    className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  )
}

export default FaqPage
