import { useState } from 'react'
import AccountProfile from './AccountProfile'
import './Account.css'

const MAX_BIO = 300

export default function Account() {
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [showLimitPopup, setShowLimitPopup] = useState(false)

  // TODO: replace with real Firebase/Google auth data
  const name = 'Your Name'
  const clubs = []
  const upcomingEvents = []

  const handleBioChange = (e) => {
    if (e.target.value.length > MAX_BIO) {
      setShowLimitPopup(true)
      return
    }
    setBio(e.target.value)
  }

  const handleGoogleLogin = () => {
    // TODO: wire up Firebase Google auth here
    console.log('Google login clicked')
  }

  return (
    <div className="account-page">
      <div className="account-left">

        {/* Avatar + Profile card */}
        <div className="profile-row">
          <div className="avatar-circle">
            <AccountProfile variant="large" />
          </div>

          <div className="account-card profile-card">
            {isEditing ? (
              <>
                {/* Name is read-only — pulled from school Google account */}
                <div className="profile-card-header">
                  <h2 className="profile-name">{name}</h2>
                  <button className="acct-btn" onClick={() => setIsEditing(false)}>
                    Save
                  </button>
                </div>
                <div className="bio-input-wrapper">
                  <textarea
                    className="edit-bio-input"
                    value={bio}
                    onChange={handleBioChange}
                    rows={4}
                    placeholder="Tell people about yourself"
                    maxLength={MAX_BIO + 1}
                  />
                  <span className={`char-count ${bio.length >= MAX_BIO ? 'at-limit' : ''}`}>
                    {bio.length}/{MAX_BIO}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="profile-card-header">
                  <h2 className="profile-name">{name}</h2>
                  <button className="acct-btn-outline" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                </div>
                <p className="profile-bio">{bio || 'No bio yet.'}</p>
              </>
            )}
          </div>
        </div>

        {/* My Clubs */}
        <div className="account-card">
          <h3 className="card-heading">My Clubs</h3>
          {clubs.length === 0
            ? <p className="empty-state">No clubs yet.</p>
            : <ul className="acct-list">{clubs.map(c => <li key={c}>{c}</li>)}</ul>
          }
        </div>

        {/* My Upcoming Events */}
        <div className="account-card">
          <h3 className="card-heading">My Upcoming Events</h3>
          {upcomingEvents.length === 0
            ? <p className="empty-state">No upcoming events.</p>
            : (
              <ul className="acct-list events-list">
                {upcomingEvents.map((ev, i) => (
                  <li key={i}>
                    <span className="ev-label">{ev.label}</span>
                    <span className="ev-time"> - {ev.time}</span>
                  </li>
                ))}
              </ul>
            )
          }
        </div>

        {/* Personalized Calendar */}
        <div className="account-card">
          <h3 className="card-heading">Personalized Calendar</h3>
          <p className="empty-state">Google Calendar integration coming soon.</p>
        </div>

        {/* Google Login button */}
        <button className="google-login-btn" onClick={handleGoogleLogin}>
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google"
            className="google-icon"
          />
          Sign in with Google
        </button>

      </div>

      {/* ── Bio limit popup ── */}
      {showLimitPopup && (
        <div className="popup-overlay" onClick={() => setShowLimitPopup(false)}>
          <div className="limit-popup" onClick={e => e.stopPropagation()}>
            <h3>Character limit reached</h3>
            <p>Your bio cannot exceed {MAX_BIO} characters.</p>
            <button className="acct-btn" onClick={() => setShowLimitPopup(false)}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  )
}