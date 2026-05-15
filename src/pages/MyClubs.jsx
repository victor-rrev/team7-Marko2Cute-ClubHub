import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { listUserMemberships } from '../services/memberships'
import { getClub } from '../services/clubs'
import ClubCard from '../components/ClubCard'

export default function MyClubs() {
  const { user } = useAuth()
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const memberships = await listUserMemberships(user.uid)
        const resolved = await Promise.all(
          memberships.map((m) => getClub(m.clubId).catch(() => null)),
        )
        if (!cancelled) setClubs(resolved.filter(Boolean))
      } catch (err) {
        console.error(
          '[my-clubs] load failed:',
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
        My clubs
      </h1>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : clubs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            You haven't joined any clubs yet.
          </p>
          <Link
            to="/discover"
            className="inline-flex items-center mt-4 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            Browse clubs
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {clubs.map((club) => (
            <ClubCard key={club.id} club={club} />
          ))}
        </div>
      )}
    </div>
  )
}
