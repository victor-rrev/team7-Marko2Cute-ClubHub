import { useEffect, useState } from 'react'
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FiArrowLeft, FiShare2, FiEdit2, FiTrash2 } from 'react-icons/fi'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getPost, softDeletePost, updatePost } from '../services/posts'
import { listPostComments } from '../services/comments'
import { getUser } from '../services/users'
import { getClub } from '../services/clubs'
import { useAuth } from '../contexts/AuthContext'
import CommentThread from '../components/CommentThread'
import AddCommentBox from '../components/AddCommentBox'
import ReactionBar from '../components/ReactionBar'
import PostMedia, { EditableMediaGrid } from '../components/PostMedia'

dayjs.extend(relativeTime)

const SCOPE_BADGE = {
  global: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  both: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
}

export default function PostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const [post, setPost] = useState(null)
  const [author, setAuthor] = useState(null)
  const [club, setClub] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [commentRefresh, setCommentRefresh] = useState(0)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftMediaPaths, setDraftMediaPaths] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const p = await getPost(postId)
        if (cancelled) return
        if (!p) {
          toast.error('Post not found.')
          navigate('/posts')
          return
        }
        setPost(p)
        const [a, c] = await Promise.all([
          getUser(p.authorId).catch(() => null),
          getClub(p.clubId).catch(() => null),
        ])
        if (!cancelled) {
          setAuthor(a)
          setClub(c)
        }
      } catch (err) {
        console.error(
          '[post-detail] load failed:',
          err.code || err.name,
          '—',
          err.message,
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [postId, navigate])

  useEffect(() => {
    let cancelled = false
    listPostComments(postId)
      .then((result) => {
        if (!cancelled) setComments(result)
      })
      .catch((err) => {
        console.error(
          '[post-detail] listComments failed:',
          err.code || err.name,
          '—',
          err.message,
        )
      })
    return () => {
      cancelled = true
    }
  }, [postId, commentRefresh])

  const refreshComments = () => setCommentRefresh((n) => n + 1)

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${postId}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error("Couldn't copy link")
    }
  }

  const handleEdit = () => {
    setDraft(post.body ?? '')
    setDraftMediaPaths(post.mediaPaths ?? [])
    setEditing(true)
  }

  const removeDraftMedia = (idx) => {
    setDraftMediaPaths((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed && draftMediaPaths.length === 0) {
      toast.error('Add some text or keep at least one image.')
      return
    }
    setBusy(true)
    try {
      await updatePost(post.id, {
        body: trimmed,
        mediaPaths: draftMediaPaths,
      })
      setPost({ ...post, body: trimmed, mediaPaths: draftMediaPaths })
      setEditing(false)
    } catch (err) {
      console.error(
        '[post-detail] edit failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't save edit.")
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    setBusy(true)
    try {
      await softDeletePost(post.id)
      toast.success('Post deleted.')
      navigate('/posts')
    } catch (err) {
      console.error(
        '[post-detail] delete failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't delete post.")
      setBusy(false)
    }
  }

  if (loading || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  const createdDate = post.createdAt?.toDate?.() ?? post.createdAt
  const isAuthor = user?.uid === post.authorId

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
      <Link
        to="/posts"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
      >
        <FiArrowLeft className="size-4" />
        Back to posts
      </Link>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
          {club && (
            <Link
              to={`/clubs/${post.clubId}`}
              state={{ from: location.pathname }}
              className="font-medium text-gray-900 dark:text-gray-100 hover:text-orange-500"
            >
              {club.name}
            </Link>
          )}
          <span>·</span>
          {author?.photoURL ? (
            <img src={author.photoURL} alt="" className="size-5 rounded-full object-cover" />
          ) : (
            <div className="size-5 rounded-full bg-gray-300 dark:bg-gray-700" />
          )}
          <span>{author?.displayName ?? '...'}</span>
          {createdDate && (
            <>
              <span>·</span>
              <span>{dayjs(createdDate).fromNow()}</span>
            </>
          )}
          {SCOPE_BADGE[post.scope] && (
            <span
              className={`ml-auto px-1.5 py-0.5 rounded text-[10px] font-semibold ${SCOPE_BADGE[post.scope]}`}
            >
              {post.scope === 'both' ? 'CLUB + GLOBAL' : 'GLOBAL'}
            </span>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={10000}
              rows={4}
              placeholder="Body (optional if you have images)"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y text-sm"
            />
            <EditableMediaGrid
              mediaPaths={draftMediaPaths}
              onRemove={removeDraftMedia}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={
                  busy || (!draft.trim() && draftMediaPaths.length === 0)
                }
                className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-xs font-medium transition-colors"
              >
                {busy ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.body && (
              <p className="text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                {post.body}
              </p>
            )}
            <PostMedia mediaPaths={post.mediaPaths} />
          </>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
          <ReactionBar postId={post.id} />
          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            {isAuthor && !editing && (
              <>
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <FiEdit2 className="size-3.5" />
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={busy}
                  className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-60 transition-colors"
                >
                  <FiTrash2 className="size-3.5" />
                  Delete
                </button>
              </>
            )}
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <FiShare2 className="size-3.5" />
              Share
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {post.commentCount ?? 0}{' '}
          {post.commentCount === 1 ? 'Comment' : 'Comments'}
        </h2>
        {user && <AddCommentBox postId={postId} onCreated={refreshComments} />}
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No comments yet.
          </p>
        ) : (
          <CommentThread
            postId={postId}
            comments={comments}
            onUpdated={refreshComments}
          />
        )}
      </div>
    </div>
  )
}
