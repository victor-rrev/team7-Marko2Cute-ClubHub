import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  FiMessageSquare,
  FiHeart,
  FiShare2,
  FiEdit2,
  FiTrash2,
} from 'react-icons/fi'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { getUser } from '../services/users'
import { getClub } from '../services/clubs'
import { softDeletePost, updatePost } from '../services/posts'
import { useAuth } from '../contexts/AuthContext'
import PostMedia, { EditableMediaGrid } from './PostMedia'

dayjs.extend(relativeTime)

const SCOPE_BADGE = {
  global: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  both: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
}

export default function PostCard({ post: initialPost }) {
  const { user } = useAuth()
  const location = useLocation()
  const [post, setPost] = useState(initialPost)
  const [author, setAuthor] = useState(null)
  const [club, setClub] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [draftMediaPaths, setDraftMediaPaths] = useState([])
  const [busy, setBusy] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    setPost(initialPost)
  }, [initialPost])

  useEffect(() => {
    let cancelled = false
    getUser(post.authorId).then((u) => {
      if (!cancelled) setAuthor(u)
    })
    getClub(post.clubId).then((c) => {
      if (!cancelled) setClub(c)
    })
    return () => {
      cancelled = true
    }
  }, [post.authorId, post.clubId])

  const isAuthor = user?.uid === post.authorId
  const createdDate = post.createdAt?.toDate?.() ?? post.createdAt

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
        '[post-card] edit failed:',
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
      setDeleted(true)
      toast.success('Post deleted.')
    } catch (err) {
      console.error(
        '[post-card] delete failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't delete post.")
      setBusy(false)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/posts/${post.id}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied')
    } catch {
      toast.error("Couldn't copy link")
    }
  }

  if (deleted) return null

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-2">
        {club ? (
          <Link
            to={`/clubs/${post.clubId}`}
            state={{ from: location.pathname }}
            className="font-medium text-gray-900 dark:text-gray-100 hover:text-orange-500"
          >
            {club.name}
          </Link>
        ) : (
          <span>...</span>
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
            rows={3}
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

      <div className="mt-3 flex items-center flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
        <Link
          to={`/posts/${post.id}`}
          className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <FiMessageSquare className="size-3.5" />
          {post.commentCount ?? 0} {post.commentCount === 1 ? 'comment' : 'comments'}
        </Link>
        <span className="inline-flex items-center gap-1">
          <FiHeart className="size-3.5" />
          {post.reactionCount ?? 0}
        </span>
        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <FiShare2 className="size-3.5" />
          Share
        </button>
        {isAuthor && !editing && (
          <>
            <button
              onClick={handleEdit}
              className="ml-auto inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
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
      </div>
    </div>
  )
}
