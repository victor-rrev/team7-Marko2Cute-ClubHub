import { useMemo, useState } from 'react'
import ClubList from './ClubList.jsx'
import { CATEGORIES } from './lib/constants'
import './Discover.css'

const SAMPLE_CLUBS = [
  {
    name: 'A Club',
    description: 'We draw As',
    categories: ['Academic', 'Creative Writing'],
    time: 'Wednesdays',
    location: 'CCA',
  },
  {
    name: 'B Club',
    description: 'We draw Bs',
    categories: ['Arts', 'Hobbies & Games'],
    time: 'Fridays',
    location: 'Studio',
  },
  {
    name: 'C Club',
    description: 'We draw Cs',
    categories: ['Academic', 'Service & Volunteering'],
    time: 'Mondays',
    location: 'Library',
  },
  {
    name: 'D Club',
    description: 'We draw Ds',
    categories: ['STEM', 'Career & Professional'],
    time: 'Thursdays',
    location: 'Lab',
  },
  {
    name: 'E Club',
    description: 'We draw Es',
    categories: ['Wellness', 'Cultural'],
    time: 'Tuesdays',
    location: 'Gym',
  },
]

function Discover() {
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedDays, setSelectedDays] = useState([])

  const visibleClubs = useMemo(() => {
    let clubs = SAMPLE_CLUBS
    if (selectedCategories.length > 0) {
      clubs = clubs.filter((club) =>
        club.categories.some((cat) => selectedCategories.includes(cat))
      )
    }
    if (selectedDays.length > 0) {
      clubs = clubs.filter((club) =>
        selectedDays.some((day) =>
          club.time.toLowerCase().includes(day.toLowerCase())
        )
      )
    }
    return clubs
  }, [selectedCategories, selectedDays])

  return (
    <div className="discover-page">
      <header className="sticky-header"></header>

      <div className="discover-layout">
        <section className="discover-clubs">
          {visibleClubs.map((club) => (
            <ClubList key={club.name} {...club} />
          ))}
          {visibleClubs.length === 0 && (
            <div className="empty-state">No clubs match that category.</div>
          )}
        </section>

        <aside className="discover-filter">
          <div className="filter-panel">
            <h3>Filter by category</h3>
            <button
              className={selectedCategories.length === 0 ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setSelectedCategories([])}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={selectedCategories.includes(category) ? 'filter-chip active' : 'filter-chip'}
                onClick={() => {
                  if (selectedCategories.includes(category)) {
                    setSelectedCategories(selectedCategories.filter(c => c !== category))
                  } else {
                    setSelectedCategories([...selectedCategories, category])
                  }
                }}
              >
                {category}
              </button>
            ))}
            <h3>Filter by day</h3>
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
              <button
                key={day}
                className={selectedDays.includes(day) ? 'filter-chip active' : 'filter-chip'}
                onClick={() => {
                  if (selectedDays.includes(day)) {
                    setSelectedDays(selectedDays.filter(d => d !== day))
                  } else {
                    setSelectedDays([...selectedDays, day])
                  }
                }}
              >
                {day}
              </button>
            ))}
            <br></br>
            <button
              className="clear-filters"
              onClick={() => {
                setSelectedCategories([])
                setSelectedDays([])
              }}
            >
              Clear All Filters
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Discover;