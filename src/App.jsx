import './App.css'
import { useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import Sidebar from './Sidebar'
import Discover from './Discover'
import Posts from './Posts'
import Events from './Events'
import Account from './Account'
import AccountProfile from './AccountProfile'
import Sidebar from './Sidebar.jsx'
import ClubList from './ClubList.jsx'

function App() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState("discover");

  const handleSearch = () => {
    console.log('Searching for:', searchTerm)
  }

  return (
    <div className="app">
      <Sidebar setPage = {setPage} />
      {page !== "account" && <AccountProfile />}
      <main className = "main-content">
        {page == "discover" && (
          <>
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
          <Discover />
          </>
        )}
        {page == "posts" && <Posts/>}
        {page == "events" && <Events/>}
        {page == "account" && <Account/>}
      <ClubList name="A Club" description="We draw As" categories="fun" time="never" location="CCA"/>
      </main>
    </div>
  )
}

export default App
