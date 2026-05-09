import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { GRADE_LEVELS, PRONOUNS } from '../lib/constants'

export default function Onboarding() {
  const { completeOnboarding, user } = useAuth()
  const [gradeLevel, setGradeLevel] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!gradeLevel || !pronouns) {
      setError('Please fill out all fields.')
      return
    }
    setLoading(true)
    try {
      await completeOnboarding({ gradeLevel, pronouns })
    } catch (err) {
      console.error(
        '[onboarding] completeOnboarding failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 space-y-5"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Welcome{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Just a couple of things before you get started.
          </p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Grade level
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select grade...</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g[0].toUpperCase() + g.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
            Pronouns
          </label>
          <select
            value={pronouns}
            onChange={(e) => setPronouns(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="">Select pronouns...</option>
            {PRONOUNS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors"
        >
          {loading ? 'Saving...' : "Let's go!"}
        </button>
      </form>
    </div>
  )
}
