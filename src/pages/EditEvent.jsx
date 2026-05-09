import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FiArrowLeft } from 'react-icons/fi'
import DatePicker from 'react-datepicker'
import { getEvent, softDeleteEvent, updateEvent } from '../services/events'
import { getMyMembership } from '../services/memberships'

const INPUT_CLASS =
  'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm'

export default function EditEvent() {
  const { eventId } = useParams()
  const navigate = useNavigate()

  const [event, setEvent] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState(null)
  const [endsAt, setEndsAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const e = await getEvent(eventId)
        if (cancelled) return
        if (!e) {
          toast.error('Event not found.')
          navigate('/events')
          return
        }
        const membership = await getMyMembership(e.clubId)
        if (cancelled) return
        const isAdmin =
          membership?.status === 'active' &&
          (membership.role === 'admin' || membership.role === 'owner')
        if (!isAdmin) {
          toast.error('Only admins can edit events.')
          navigate(`/clubs/${e.clubId}`)
          return
        }
        setEvent(e)
        setTitle(e.title ?? '')
        setDescription(e.description ?? '')
        setLocation(e.location ?? '')
        setStartsAt(e.startsAt?.toDate?.() ?? e.startsAt ?? null)
        setEndsAt(e.endsAt?.toDate?.() ?? e.endsAt ?? null)
      } catch (err) {
        console.error(
          '[edit-event] load failed:',
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
  }, [eventId, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (!startsAt) {
      toast.error('Start date and time are required.')
      return
    }
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      toast.error('End time must be after start time.')
      return
    }
    setSubmitting(true)
    try {
      const patch = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startsAt,
      }
      if (endsAt) patch.endsAt = endsAt
      await updateEvent(eventId, patch)
      toast.success('Event updated.')
      navigate(`/clubs/${event.clubId}`)
    } catch (err) {
      console.error(
        '[edit-event] update failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't save changes.")
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${title}? This can't be undone.`)) return
    setDeleting(true)
    try {
      await softDeleteEvent(eventId)
      toast.success('Event deleted.')
      navigate(`/clubs/${event.clubId}`)
    } catch (err) {
      console.error(
        '[edit-event] delete failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't delete event.")
      setDeleting(false)
    }
  }

  if (loading || !event) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link
        to={`/clubs/${event.clubId}`}
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
      >
        <FiArrowLeft className="size-4" />
        Back to club
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Edit event
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Title <span className="text-orange-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="e.g. Weekly meeting"
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Starts <span className="text-orange-500">*</span>
          </label>
          <DatePicker
            selected={startsAt}
            onChange={setStartsAt}
            showTimeInput
            timeInputLabel="Time:"
            dateFormat="MMM d, yyyy h:mm aa"
            placeholderText="Pick date and time"
            className={INPUT_CLASS}
            popperPlacement="bottom-start"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Ends{' '}
            <span className="text-gray-500 dark:text-gray-400 font-normal">
              (optional)
            </span>
          </label>
          <DatePicker
            selected={endsAt}
            onChange={setEndsAt}
            showTimeInput
            timeInputLabel="Time:"
            dateFormat="MMM d, yyyy h:mm aa"
            minDate={startsAt ?? undefined}
            placeholderText="Pick date and time"
            className={INPUT_CLASS}
            popperPlacement="bottom-start"
            isClearable
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Location
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Room 302"
            className={INPUT_CLASS}
          />
        </div>

        <div className="space-y-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={5000}
            rows={3}
            placeholder="What's the event about?"
            className={`${INPUT_CLASS} resize-y`}
          />
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
            to={`/clubs/${event.clubId}`}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>

      <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">
          Danger zone
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Deleting hides this event. RSVPs are kept but won't be shown.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="mt-3 px-4 py-2 rounded-lg border border-red-500 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60 transition-colors text-sm font-medium"
        >
          {deleting ? 'Deleting...' : 'Delete event'}
        </button>
      </div>
    </div>
  )
}
