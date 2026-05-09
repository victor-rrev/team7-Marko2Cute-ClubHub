import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { FiImage, FiX } from 'react-icons/fi'
import { createPost, softDeletePost, updatePost } from '../services/posts'
import { uploadPostMedia } from '../services/storage'

const MAX_FILES = 4
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB; mirrors storage.rules
// Image-only posts: createPost requires body.size() > 0 by default rule, but
// uploadPostMedia needs a postId, which requires the post to exist first.
// Solution: seed the post body with this single space, upload media, then
// updatePost with body='' (now allowed because mediaPaths is non-empty).
const PLACEHOLDER_BODY = ' '

export default function CreatePostBox({ clubId, isAdmin, onCreated }) {
  const fileRef = useRef(null)
  const [body, setBody] = useState('')
  const [scope, setScope] = useState('club')
  const [files, setFiles] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const previewURLs = useMemo(
    () => files.map((file) => URL.createObjectURL(file)),
    [files],
  )

  useEffect(() => {
    return () => {
      previewURLs.forEach(URL.revokeObjectURL)
    }
  }, [previewURLs])

  const handleFilesChange = (e) => {
    const picked = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (picked.length === 0) return

    const valid = []
    for (const file of picked) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}: not an image`)
        continue
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: over 5 MB`)
        continue
      }
      valid.push(file)
    }
    if (valid.length === 0) return

    setFiles((prev) => {
      const combined = [...prev, ...valid]
      if (combined.length > MAX_FILES) {
        toast.error(`Max ${MAX_FILES} images per post`)
        return combined.slice(0, MAX_FILES)
      }
      return combined
    })
  }

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = body.trim()
    if (!trimmed && files.length === 0) {
      toast.error('Write something or add an image.')
      return
    }
    setSubmitting(true)
    let postId = null
    try {
      // If image-only, seed with placeholder body to satisfy create-time
      // rule, then overwrite once media is uploaded and mediaPaths is set.
      const initialBody = trimmed || PLACEHOLDER_BODY
      postId = await createPost({
        clubId,
        body: initialBody,
        scope,
      })
      if (files.length > 0) {
        const paths = []
        for (const file of files) {
          const { path } = await uploadPostMedia(postId, file)
          paths.push(path)
        }
        await updatePost(postId, { body: trimmed, mediaPaths: paths })
      } else if (initialBody !== trimmed) {
        // Shouldn't happen — image-only path requires files. Defensive only.
        await updatePost(postId, { body: trimmed })
      }
      setBody('')
      setScope('club')
      setFiles([])
      toast.success('Posted!')
      onCreated?.()
    } catch (err) {
      console.error(
        '[create-post] failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't post.")
      // Best-effort rollback so we don't leave a placeholder-body post stranded.
      if (postId) {
        try {
          await softDeletePost(postId)
        } catch {
          /* ignore */
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={10000}
        rows={3}
        placeholder="Post to this club..."
        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y text-sm"
      />

      {previewURLs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {previewURLs.map((url, i) => (
            <div
              key={url}
              className="relative size-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800"
            >
              <img src={url} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 size-5 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                aria-label="Remove image"
              >
                <FiX className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={files.length >= MAX_FILES || submitting}
            className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Add image"
            title="Add image"
          >
            <FiImage className="size-4" />
          </button>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileRef}
            onChange={handleFilesChange}
            className="hidden"
          />
          {isAdmin ? (
            <select
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 text-xs"
            >
              <option value="club">Club only</option>
              <option value="both">Club + global</option>
              <option value="global">Global only</option>
            </select>
          ) : (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Posting to this club
            </span>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting || (!body.trim() && files.length === 0)}
          className="px-4 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {submitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  )
}
