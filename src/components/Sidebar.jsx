import { NavLink } from 'react-router-dom'
import {
  FiBookmark,
  FiCalendar,
  FiCompass,
  FiFileText,
  FiUser,
} from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const NAV = [
  { to: '/posts', icon: FiFileText, label: 'Posts' },
  { to: '/my-clubs', icon: FiBookmark, label: 'My clubs' },
  { to: '/discover', icon: FiCompass, label: 'Discover' },
  { to: '/events', icon: FiCalendar, label: 'Events' },
  { to: '/account', icon: FiUser, label: 'Account' },
]

export default function Sidebar() {
  const { user, userDoc } = useAuth()
  const photoURL = userDoc?.photoURL || user?.photoURL

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-xl font-bold text-orange-500">ClubHub</h1>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="border-t border-gray-200 dark:border-gray-800 px-3 py-3 flex items-center gap-3">
          {photoURL ? (
            <img src={photoURL} alt="" className="size-8 rounded-full object-cover" />
          ) : (
            <div className="size-8 rounded-full bg-gray-300 dark:bg-gray-700" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.displayName?.split(' ')[0] || 'User'}
          </span>
        </div>
      )}
    </aside>
  )
}
