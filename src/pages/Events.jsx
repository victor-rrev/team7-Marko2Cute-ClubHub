import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { listUserMemberships } from '../services/memberships'
import { listClubEvents } from '../services/events'
import EventCard from '../components/EventCard'

export default function Events() {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [hasMemberships, setHasMemberships] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const memberships = await listUserMemberships(user.uid)
        if (memberships.length === 0) {
          if (!cancelled) {
            setHasMemberships(false)
            setEvents([])
          }
          return
        }
        const eventArrays = await Promise.all(
          memberships.map((m) =>
            listClubEvents(m.clubId, { upcomingOnly: true }).catch(() => []),
          ),
        )
        const merged = eventArrays.flat().sort((a, b) => {
          const aMs = a.startsAt?.toMillis?.() ?? 0
          const bMs = b.startsAt?.toMillis?.() ?? 0
          return aMs - bMs
        })
        if (!cancelled) {
          setEvents(merged)
          setHasMemberships(true)
        }
      } catch (err) {
        console.error(
          '[events] load failed:',
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
  }, [user.uid])

  return (
    <div className="max-w-3xl mx-auto px-4 py-5 sm:px-6 sm:py-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Upcoming events
      </h1>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : !hasMemberships ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Join a club to see its events here.
          </p>
          <Link
            to="/discover"
            className="inline-flex items-center mt-4 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            Browse clubs
          </Link>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No upcoming events from your clubs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
