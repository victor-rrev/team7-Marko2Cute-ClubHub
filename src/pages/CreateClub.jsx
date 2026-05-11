import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { FiArrowLeft } from 'react-icons/fi'
import { createClub } from '../services/clubs'
import { CATEGORIES, JOIN_POLICIES } from '../lib/constants'
import { categoryChipClass } from '../lib/categoryColors'

export default function CreateClub() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categories, setCategories] = useState([])
  const [joinPolicy, setJoinPolicy] = useState('open')
  const [submitting, setSubmitting] = useState(false)

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
      const clubId = await createClub({
        name: name.trim(),
        description: description.trim(),
        categories,
        joinPolicy,
      })
      toast.success('Club created!')
      navigate(`/clubs/${clubId}`, { state: { from: '/discover' } })
    } catch (err) {
      console.error(
        '[create-club] createClub failed:',
        err.code || err.name,
        '—',
        err.message,
      )
      toast.error("Couldn't create club. Try again.")
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <Link
        to="/discover"
        className="inline-flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mb-4"
      >
        <FiArrowLeft className="size-4" />
        Back to discover
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">New club</h1>

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
            placeholder="e.g. Robotics Club"
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
            placeholder="What does this club do?"
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
            Join policy
          </label>
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
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors"
          >
            {submitting ? 'Creating...' : 'Create club'}
          </button>
          <Link
            to="/discover"
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
