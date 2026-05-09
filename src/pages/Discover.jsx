import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiPlus } from 'react-icons/fi'
import { listClubs } from '../services/clubs'
import { CATEGORIES } from '../lib/constants'
import { categoryChipClass } from '../lib/categoryColors'
import ClubCard from '../components/ClubCard'

export default function Discover() {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listClubs(filter ? { category: filter } : {})
      .then((result) => {
        if (!cancelled) setClubs(result)
      })
      .catch((err) => {
        console.error('[discover] listClubs failed:', err.code || err.name, '—', err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filter])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Discover</h1>
        <Link
          to="/clubs/new"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
        >
          <FiPlus className="size-4" />
          New club
        </Link>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            filter === null
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === cat
                ? 'bg-orange-500 text-white'
                : `${categoryChipClass(cat)} hover:opacity-75`
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : clubs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            {filter ? `No clubs in ${filter} yet.` : 'No clubs yet.'}
          </p>
          <Link
            to="/clubs/new"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
          >
            <FiPlus className="size-4" />
            Create the first club
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
