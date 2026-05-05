import './App.css'
import { useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import Sidebar from './Sidebar.jsx'
import Discover from './Discover.jsx'
import Posts from './Posts.jsx'
import Events from './Events.jsx'
import Account from './Account.jsx'
import AccountProfile from './AccountProfile.jsx'
import Onboarding from './Onboarding.jsx'
import { useAuth } from './contexts/AuthContext'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'

function AppContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const location = useLocation()
  const { user, loading, isOnboarded, signIn } = useAuth()

  // 1. Still resolving auth state
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#888', fontSize: '18px' }}>Loading...</p>
      </div>
    )
  }

  // 2. Not signed in — show sign in screen
  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '20px' }}>
        <h1 style={{ color: '#E8420A', fontSize: '36px', margin: 0, fontWeight: 'bold' }}>ClubHub</h1>
        <p style={{ color: '#777', margin: 0 }}>Discover clubs and events at your school</p>
        <button
          onClick={signIn}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 24px', borderRadius: '16px', border: '2px solid #ddd',
            background: 'white', fontSize: '16px', fontWeight: '600',
            cursor: 'pointer', marginTop: '10px'
          }}
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" />
          Sign in with Google
        </button>
      </div>
    )
  }

  // 3. Signed in but not onboarded yet
  if (!isOnboarded) {
    return <Onboarding />
  }

  // 4. Fully signed in and onboarded — show the app
  return (
    <div className="app">
      <Sidebar />
      {location.pathname !== '/account' && <AccountProfile />}
      <main className="main-content">
        {location.pathname === '/discover' && (
          <header className="header">
            <div className="search-container">
              <CiSearch className="search-icon" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && console.log('Searching:', searchTerm)}
                placeholder="Search clubs..."
                className="search-bar"
              />
            </div>
          </header>
        )}
        <Routes>
          <Route path="/" element={<Discover />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/events" element={<Events />} />
          <Route path="/account" element={<Account />} />
        </Routes>
      </main>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App