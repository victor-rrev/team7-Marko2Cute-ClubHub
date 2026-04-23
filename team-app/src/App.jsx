import './App.css'
import { useState } from 'react'
import { CiSearch } from 'react-icons/ci'
import Sidebar from './Sidebar'

function App() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    // Placeholder for search functionality
    console.log('Searching for:', searchTerm)
    // You can add logic here to filter data or make API calls
  }

  return (
    <div className="app">
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
      <Sidebar />
    </div>
  )
}

export default App
