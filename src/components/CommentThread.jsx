import { useEffect, useMemo, useState } from 'react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { toast } from 'sonner'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import { getUser } from '../services/users'
import { softDeleteComment, updateComment } from '../services/comments'
import { useAuth } from '../contexts/AuthContext'
import AddCommentBox from './AddCommentBox'

dayjs.extend(relativeTime)

function buildTree(comments) {
  const byId = new Map()
  const roots = []
  comments.forEach((c) => byId.set(c.id, { ...c, replies: [] }))
  comments.forEach((c) => {
    if (c.parentCommentId) {
      const parent = byId.get(c.parentCommentId)
      if (parent) parent.replies.push(byId.get(c.id))
      else roots.push(byId.get(c.id))
    } else {
      roots.push(byId.get(c.id))
    }
  })
  // Hide subtrees where every node is soft-deleted; keep [deleted]
  // tombstones only when there's at least one live reply underneath.
  return roots.map(pruneFullyDeleted).filter(Boolean)
}

function pruneFullyDeleted(node) {
  node.replies = node.replies.map(pruneFullyDeleted).filter(Boolean)
  if (node.deletedAt && node.replies.length === 0) return null
  return node
}

export default function CommentThread({ postId, comments, onUpdated }) {
  const tree = useMemo(() => buildTree(comments), [comments])
  return (
    <ul className="space-y-3">
      {tree.map((c) => (
        <CommentNode
          key={c.id}
          postId={postId}
          comment={c}
          onUpdated={onUpdated}
        />
      ))}
    </ul>
  )
}

function CommentNode({ postId, comment: initialComment, onUpdated }) {
  const { user } = useAuth()
  const [comment, setComment] = useState(initialComment)
  const [author, setAuthor] = useState(null)
  const [replyOpen, setReplyOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setComment(initialComment)
  }, [initialComment])

  useEffect(() => {
    let cancelled = false
    getUser(comment.authorId).then((u) => {
      if (!cancelled) setAuthor(u)
    })
    return () => {
      cancelled = true
    }
  }, [comment.authorId])

  const createdDate = comment.createdAt?.toDate?.() ?? comment.createdAt
  const isDeleted = !!comment.deletedAt
  const isAuthor = user?.uid === comment.authorId

  const handleEdit = () => {
    setDraft(comment.body)
    setEditing(true)
  }

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed) {
      toast.error('Comment cannot be empty.')
      return
    }
    setBusy(true)
    try {
      await updateComment(postId, comment.id, trimmed)
      setComment({ ...comment, body: trimmed })
      setEditing(false)
    } catch (err) {
      console.error(
        '[comment] edit failed:',
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
    if (!window.confirm('Delete this comment?')) return
    setBusy(true)
    try {
      await softDeleteComment(postId, comment.id)
      setComment({ ...comment, deletedAt: new Date() })
      toast.success('Comment deleted.')
    } catch (err) {
      console.error(
        '[comment] delete failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't delete comment.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <li>
      <div className="flex gap-3">
        {!isDeleted && author?.photoURL ? (
          <img src={author.photoURL} alt="" className="size-7 rounded-full shrink-0" />
        ) : (
          <div className="size-7 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {isDeleted ? '...' : (author?.displayName ?? '...')}
            </span>
            {createdDate && <span>{dayjs(createdDate).fromNow()}</span>}
          </div>

          {editing ? (
            <div className="mt-1 space-y-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={5000}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={busy || !draft.trim()}
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
            <p
              className={`mt-0.5 text-sm whitespace-pre-wrap break-words ${
                isDeleted
                  ? 'italic text-gray-400 dark:text-gray-600'
                  : 'text-gray-900 dark:text-gray-100'
              }`}
            >
              {isDeleted ? '[deleted]' : comment.body}
            </p>
          )}

          {!isDeleted && !editing && (
            <div className="mt-1 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <button
                onClick={() => setReplyOpen((o) => !o)}
                className="hover:text-orange-500"
              >
                {replyOpen ? 'Cancel reply' : 'Reply'}
              </button>
              {isAuthor && (
                <>
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <FiEdit2 className="size-3" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-60"
                  >
                    <FiTrash2 className="size-3" />
                    Delete
                  </button>
                </>
              )}
            </div>
          )}

          {replyOpen && (
            <div className="mt-2">
              <AddCommentBox
                postId={postId}
                parentCommentId={comment.id}
                onCreated={() => {
                  setReplyOpen(false)
                  onUpdated?.()
                }}
                compact
              />
            </div>
          )}
          {comment.replies.length > 0 && (
            <ul className="mt-3 space-y-3 border-l-2 border-gray-200 dark:border-gray-800 pl-3">
              {comment.replies.map((reply) => (
                <CommentNode
                  key={reply.id}
                  postId={postId}
                  comment={reply}
                  onUpdated={onUpdated}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}
