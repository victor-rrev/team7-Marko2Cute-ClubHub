import './App.css'
import { useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import Sidebar from './Sidebar.jsx'
import Discover from './Discover.jsx'
import Posts from './Posts.jsx'
import Events from './Events.jsx'
import Account from './Account.jsx'
import AccountProfile from './AccountProfile.jsx'
import ClubList from './ClubList.jsx'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';

function AppContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const location = useLocation();

  const handleSearch = () => {
    console.log('Searching for:', searchTerm)
  }

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
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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
