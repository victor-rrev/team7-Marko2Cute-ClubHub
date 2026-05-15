import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FiArrowLeft } from 'react-icons/fi'
import { getClub, softDeleteClub, updateClub } from '../services/clubs'
import { getMyMembership } from '../services/memberships'
import { CATEGORIES, JOIN_POLICIES } from '../lib/constants'
import { categoryChipClass } from '../lib/categoryColors'

export default function EditClub() {
  const { clubId } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState([])
  const [joinPolicy, setJoinPolicy] = useState('open')
  const [originalJoinPolicy, setOriginalJoinPolicy] = useState('open')
  const [isOwner, setIsOwner] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [club, membership] = await Promise.all([
          getClub(clubId),
          getMyMembership(clubId),
        ])
        if (cancelled) return
        if (!club) {
          toast.error('Club not found.')
          navigate('/discover')
          return
        }
        const canEdit =
          membership?.status === 'active' &&
          (membership.role === 'admin' || membership.role === 'owner')
        if (!canEdit) {
          toast.error('Only admins can edit this club.')
          navigate(`/clubs/${clubId}`)
          return
        }
        setName(club.name)
        setDescription(club.description ?? '')
        setCategories(club.categories ?? [])
        setJoinPolicy(club.joinPolicy ?? 'open')
        setOriginalJoinPolicy(club.joinPolicy ?? 'open')
        setIsOwner(membership.role === 'owner')
      } catch (err) {
        console.error(
          '[edit-club] load failed:',
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
  }, [clubId, navigate])

  const toggleCategory = (cat) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat],
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }
    if (categories.length === 0) {
      toast.error('Pick at least one category.')
      return
    }
    if (categories.length > 5) {
      toast.error('Maximum 5 categories.')
      return
    }
    setSubmitting(true)
    try {
      const patch = {
        name: name.trim(),
        description: description.trim(),
        categories,
      }
      // Rules reject non-owners changing joinPolicy; only include if owner-changed.
      if (isOwner && joinPolicy !== originalJoinPolicy) {
        patch.joinPolicy = joinPolicy
      }
      await updateClub(clubId, patch)
      toast.success('Club updated.')
      navigate(`/clubs/${clubId}`, { state: { from: '/discover' } })
    } catch (err) {
      console.error(
        '[edit-club] update failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't save changes.")
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!isOwner) return
    if (!window.confirm(`Delete ${name}? This can't be undone.`)) return
    setDeleting(true)
    try {
      await softDeleteClub(clubId)
      toast.success('Club deleted.')
      navigate('/discover')
    } catch (err) {
      console.error(
        '[edit-club] delete failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't delete club.")
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
      <Link
        to={`/clubs/${clubId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
      >
        <FiArrowLeft className="size-4" />
        Back to club
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Edit club
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Name <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-y"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Categories <span className="text-orange-500">*</span>{' '}
            <span className="text-gray-500 dark:text-gray-400 font-normal">
              ({categories.length}/5)
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((cat) => {
              const selected = categories.includes(cat)
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-orange-500 text-white'
                      : `${categoryChipClass(cat)} hover:opacity-75`
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Join policy{' '}
            {!isOwner && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                (owner only)
              </span>
            )}
          </label>
          {isOwner ? (
            <div className="flex gap-2">
              {JOIN_POLICIES.map((policy) => (
                <label
                  key={policy}
                  className={`flex-1 cursor-pointer px-4 py-3 rounded-lg border text-sm transition-colors ${
                    joinPolicy === policy
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                      : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="joinPolicy"
                    value={policy}
                    checked={joinPolicy === policy}
                    onChange={(e) => setJoinPolicy(e.target.value)}
                    className="sr-only"
                  />
                  <div className="font-medium capitalize">{policy}</div>
                  <div className="text-xs mt-0.5 opacity-80">
                    {policy === 'open'
                      ? 'Anyone can join instantly'
                      : 'Requests need admin approval'}
                  </div>
                </label>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 capitalize">
              {joinPolicy}
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {submitting ? 'Saving...' : 'Save changes'}
          </button>
          <Link
            to={`/clubs/${clubId}`}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>

      {isOwner && (
        <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
            Danger zone
          </h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Deleting hides this club from everyone immediately. The data isn't
            permanently erased, but it can't be recovered through the app.
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="mt-3 px-4 py-2 rounded-lg border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors text-sm font-medium"
          >
            {deleting ? 'Deleting...' : 'Delete club'}
          </button>
        </div>
      )}
    </div>
  )
}
