import { Link, useLocation } from 'react-router-dom'
import { FiUsers, FiLock } from 'react-icons/fi'
import ClubLogo from './ClubLogo'
import { categoryChipClass } from '../lib/categoryColors'

export default function ClubCard({ club }) {
  const location = useLocation()
  return (
    <Link
      to={`/clubs/${club.id}`}
      state={{ from: location.pathname }}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-orange-500 dark:hover:border-orange-500 transition-colors"
    >
      <div className="flex items-start gap-4">
        <ClubLogo club={club} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {club.name}
            </h3>
            {club.joinPolicy === 'approval' && (
              <FiLock
                className="size-3.5 text-gray-400 dark:text-gray-500 shrink-0"
                title="Approval required"
              />
            )}
          </div>
          {club.description && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {club.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {club.categories?.map((cat) => (
              <span
                key={cat}
                className={`px-2 py-0.5 rounded-full text-xs ${categoryChipClass(cat)}`}
              >
                {cat}
              </span>
            ))}
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <FiUsers className="size-3.5" />
              {club.memberCount ?? 0}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
