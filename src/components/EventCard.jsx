import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { FiCalendar, FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi'
import dayjs from 'dayjs'
import { getClub } from '../services/clubs'
import { softDeleteEvent } from '../services/events'

export default function EventCard({ event, canEdit = false }) {
  const location = useLocation()
  const [club, setClub] = useState(null)
  const [busy, setBusy] = useState(false)
  const [deleted, setDeleted] = useState(false)

  useEffect(() => {
    let cancelled = false
    getClub(event.clubId).then((c) => {
      if (!cancelled) setClub(c)
    })
    return () => {
      cancelled = true
    }
  }, [event.clubId])

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${event.title}?`)) return
    setBusy(true)
    try {
      await softDeleteEvent(event.id)
      setDeleted(true)
      toast.success('Event deleted.')
    } catch (err) {
      console.error(
        '[event-card] delete failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't delete event.")
      setBusy(false)
    }
  }

  if (deleted) return null

  const startsAt = event.startsAt?.toDate?.() ?? event.startsAt

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-start gap-4">
        <div className="size-14 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex flex-col items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
          <span className="text-[10px] font-semibold uppercase">
            {dayjs(startsAt).format('MMM')}
          </span>
          <span className="text-xl font-bold leading-none">
            {dayjs(startsAt).format('D')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {event.title}
          </h3>
          {club && (
            <Link
              to={`/clubs/${event.clubId}`}
              state={{ from: location.pathname }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500"
            >
              {club.name}
            </Link>
          )}
          {event.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {event.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1">
              <FiCalendar className="size-3.5" />
              {dayjs(startsAt).format('MMM D, h:mm A')}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-1">
                <FiMapPin className="size-3.5" />
                {event.location}
              </span>
            )}
            {canEdit && (
              <>
                <Link
                  to={`/events/${event.id}/edit`}
                  className="ml-auto inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  <FiEdit2 className="size-3.5" />
                  Edit
                </Link>
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
      </div>
    </div>
  )
}
