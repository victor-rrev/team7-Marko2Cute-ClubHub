import { useState } from 'react'
import { toast } from 'sonner'
import { createComment } from '../services/comments'

export default function AddCommentBox({
  postId,
  parentCommentId = null,
  onCreated,
  compact = false,
}) {
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed) return
    setSubmitting(true)
    try {
      await createComment(postId, { body: trimmed, parentCommentId })
      setBody('')
      onCreated?.()
    } catch (err) {
      console.error(
        '[add-comment] failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't post comment.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        compact
          ? ''
          : 'rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3'
      }
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        rows={2}
        placeholder={parentCommentId ? 'Write a reply...' : 'Write a comment...'}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y text-sm"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={submitting || !body.trim()}
          className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
        >
          {submitting ? 'Posting...' : parentCommentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  )
}
