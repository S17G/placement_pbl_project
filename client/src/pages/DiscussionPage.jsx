import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
import http from '../api/http'

function DiscussionPage() {
  const [message, setMessage] = useState('')
  const [posts, setPosts] = useState([])
  const [showComposer, setShowComposer] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editingMessage, setEditingMessage] = useState('')
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
    void refreshPosts()
  }, [mineOnly])

  const refreshPosts = async () => {
    try {
      const response = await http.get('/v1/discussion', {
        params: mineOnly ? { mine: 'true' } : undefined,
      })
      setPosts(response.data?.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to fetch discussion posts.')
    }
  }

  const isOwnPost = (post) => {
    const ownEmail = String(currentUser.email || '').toLowerCase()
    const postEmail = String(post.authorEmail || '').toLowerCase()

    if (ownEmail && postEmail) {
      return ownEmail === postEmail
    }

    return String(post.authorName || '').toLowerCase() === String(currentUser.name || '').toLowerCase()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    const trimmedMessage = message.trim()
    if (!trimmedMessage) {
      toast.error('Please write a message before posting.')
      return
    }

    setIsSubmitting(true)
    try {
      await http.post('/v1/discussion', { message: trimmedMessage })
      await refreshPosts()
      setMessage('')
      setShowComposer(false)
      toast.success('Discussion post published successfully. It will be live for 72 hours.')
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to publish discussion post.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (postId) => {
    try {
      await http.delete(`/v1/discussion/${postId}`)
      toast.success('Discussion post deleted.')
      await refreshPosts()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to delete discussion post.')
    }
  }

  const handleSaveEdit = async (postId) => {
    const trimmedMessage = editingMessage.trim()
    if (!trimmedMessage) {
      toast.error('Message cannot be empty.')
      return
    }

    try {
      await http.patch(`/v1/discussion/${postId}`, { message: trimmedMessage })
      toast.success('Discussion post updated.')
      setEditingPostId(null)
      setEditingMessage('')
      await refreshPosts()
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Unable to update discussion post.')
    }
  }

  return (
    <section className="relative space-y-6 animate-fade-up">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <span className="floating-orb animate-float-y left-[4%] top-[9%] h-10 w-10 bg-cyan-500/12" />
        <span className="floating-orb animate-float-x right-[8%] top-[20%] h-8 w-8 bg-emerald-500/12" />
        <span className="floating-orb animate-float-y right-[14%] bottom-[12%] h-12 w-12 bg-sky-500/10" />
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-100">{mineOnly ? 'My Discussions' : 'Open Discussion Forum'}</h1>
        <p className="text-sm text-slate-400 sm:text-base">
          {mineOnly
            ? 'Manage your own discussion posts.'
            : 'Share interview experiences, ask doubts, and post any placement related message.'}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900/85 via-slate-900/70 to-cyan-950/25 p-4 shadow-[0_20px_50px_-30px_rgba(34,211,238,0.35)] sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-100">Create a New Discussion Post</p>
            <p className="text-xs text-slate-400">Click the button to open the posting form.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowComposer((previous) => !previous)}
            className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            {showComposer ? 'Close Form' : 'Create Post'}
          </button>
        </div>

        {showComposer && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3 animate-fade-up">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-200">Your Message</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                className="min-h-28 w-full rounded-xl border border-slate-600 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-cyan-500 transition placeholder:text-slate-500 focus:border-cyan-500 focus:ring-2"
                placeholder="Share your interview experience, tips, or question..."
              />
            </label>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-slate-400">Posting as {currentUser.name} ({currentUser.year})</p>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Post'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="space-y-3 animate-fade-up-delay">
        {posts.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-slate-600 bg-slate-900/70 p-5 text-sm text-slate-400">
            No discussion posts yet. Be the first one to post.
          </article>
        ) : (
          posts.map((post) => (
            <article
              key={post._id || post.id}
              className={`rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_-26px_rgba(16,185,129,0.35)] ${
                isOwnPost(post)
                  ? 'border-sky-700/60 bg-gradient-to-br from-sky-950/45 via-slate-900/82 to-sky-900/25'
                  : 'border-emerald-700/60 bg-gradient-to-br from-emerald-950/40 via-slate-900/82 to-emerald-900/22'
              }`}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    isOwnPost(post)
                      ? 'bg-sky-500/20 text-sky-200'
                      : 'bg-emerald-500/20 text-emerald-200'
                  }`}
                >
                  {isOwnPost(post) ? 'Your Post' : 'Peer Post'}
                </span>
                <span className="text-xs text-slate-400">{new Date(post.postedAt).toLocaleString()}</span>
              </div>

              {editingPostId === post._id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingMessage}
                    onChange={(event) => setEditingMessage(event.target.value)}
                    className="min-h-24 w-full rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(post._id)}
                      className="rounded-lg bg-cyan-700 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPostId(null)
                        setEditingMessage('')
                      }}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-base leading-relaxed text-slate-100 sm:text-lg">{post.message}</p>
              )}
              <div className="mt-3 space-y-1 text-xs text-slate-400 sm:text-sm">
                <p>Posted by {post.authorName}</p>
                <p>{post.authorYear} • {post.authorBranch}</p>
              </div>

              {isOwnPost(post) && editingPostId !== post._id && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(post._id)
                      setEditingMessage(post.message)
                    }}
                    className="rounded-lg border border-sky-600 bg-sky-900/40 px-3 py-1 text-xs font-semibold text-sky-200"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(post._id)}
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

export default DiscussionPage
