import { useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import AccountProfile from './AccountProfile'
import './Account.css'

export default function Account() {
  const { user, userDoc, signIn, signOut } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [showLimitPopup, setShowLimitPopup] = useState(false)

  const MAX_BIO = 300
  const clubs = []
  const upcomingEvents = []

  const handleBioChange = (e) => {
    if (e.target.value.length > MAX_BIO) {
      setShowLimitPopup(true)
      return
    }
    setBio(e.target.value)
  }

  // Use real name from Google if signed in
  const displayName = user?.displayName ?? 'Your Name'

  return (
    <div className="account-page">
      <div className="account-left">

        <div className="profile-row">
          <div className="avatar-circle">
            {user?.photoURL
              ? <img src={user.photoURL} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              : <AccountProfile variant="large" />
            }
          </div>

          <div className="account-card profile-card">
            {isEditing ? (
              <>
                <div className="profile-card-header">
                  <h2 className="profile-name">{displayName}</h2>
                  <button className="acct-btn" onClick={() => setIsEditing(false)}>Save</button>
                </div>
                <div className="bio-input-wrapper">
                  <textarea
                    className="edit-bio-input"
                    value={bio}
                    onChange={handleBioChange}
                    rows={4}
                    placeholder="Tell people about yourself"
                  />
                  <span className={`char-count ${bio.length >= MAX_BIO ? 'at-limit' : ''}`}>
                    {bio.length}/{MAX_BIO}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="profile-card-header">
                  <h2 className="profile-name">{displayName}</h2>
                  <button className="acct-btn-outline" onClick={() => setIsEditing(true)}>Edit</button>
                </div>
                <p className="profile-bio">{bio || 'No bio yet.'}</p>
              </>
            )}
          </div>
        </div>

        <div className="account-card">
          <h3 className="card-heading">My Clubs</h3>
          {clubs.length === 0
            ? <p className="empty-state">No clubs yet.</p>
            : <ul className="acct-list">{clubs.map(c => <li key={c}>{c}</li>)}</ul>
          }
        </div>

        <div className="account-card">
          <h3 className="card-heading">My Upcoming Events</h3>
          {upcomingEvents.length === 0
            ? <p className="empty-state">No upcoming events.</p>
            : <ul className="acct-list">{upcomingEvents.map((ev, i) => <li key={i}>{ev.label} - {ev.time}</li>)}</ul>
          }
        </div>

        <div className="account-card">
          <h3 className="card-heading">Personalized Calendar</h3>
          <p className="empty-state">Google Calendar integration coming soon.</p>
        </div>

        {/* Sign in / Sign out button */}
        {user ? (
          <button className="google-login-btn" onClick={signOut}>
            <img src={user.photoURL} alt="" className="google-icon" style={{ borderRadius: '50%' }} />
            Sign out ({displayName})
          </button>
        ) : (
          <button className="google-login-btn" onClick={signIn}>
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="google-icon"
            />
            Sign in with Google
          </button>
        )}

      </div>

      {showLimitPopup && (
        <div className="popup-overlay" onClick={() => setShowLimitPopup(false)}>
          <div className="limit-popup" onClick={e => e.stopPropagation()}>
            <h3>Character limit reached</h3>
            <p>Your bio can't exceed {MAX_BIO} characters. Please shorten it.</p>
            <button className="acct-btn" onClick={() => setShowLimitPopup(false)}>Got it</button>
          </div>
        </div>
      )}
    </div>
  )
}