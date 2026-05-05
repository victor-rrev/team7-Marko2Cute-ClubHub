import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import './Onboarding.css'

const GRADE_LEVELS = ['freshman', 'sophomore', 'junior', 'senior']
const PRONOUNS = ['he/him', 'she/her', 'they/them']

export default function Onboarding() {
  const { completeOnboarding, user } = useAuth()
  const [gradeLevel, setGradeLevel] = useState('')
  const [pronouns, setPronouns] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!gradeLevel || !pronouns) {
      setError('Please fill out all fields.')
      return
    }
    setLoading(true)
    try {
      await completeOnboarding({ gradeLevel, pronouns })
    } catch (err) {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-card">
        <h2>Welcome, {user?.displayName?.split(' ')[0]}!</h2>
        <p className="onboarding-sub">Just a couple things before you get started.</p>

        <label className="onboarding-label">Grade Level</label>
        <select
          className="onboarding-select"
          value={gradeLevel}
          onChange={e => setGradeLevel(e.target.value)}
        >
          <option value="">Select grade...</option>
          {GRADE_LEVELS.map(g => (
            <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
          ))}
        </select>

        <label className="onboarding-label">Pronouns</label>
        <select
          className="onboarding-select"
          value={pronouns}
          onChange={e => setPronouns(e.target.value)}
        >
          <option value="">Select pronouns...</option>
          {PRONOUNS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        {error && <p className="onboarding-error">{error}</p>}

        <button
          className="onboarding-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Saving...' : "Let's go!"}
        </button>
      </div>
    </div>
  )
}