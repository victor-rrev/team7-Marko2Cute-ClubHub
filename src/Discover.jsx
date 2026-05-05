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
  const [selectedCategory, setSelectedCategory] = useState('All')

  const visibleClubs = useMemo(() => {
    if (selectedCategory === 'All') return SAMPLE_CLUBS
    return SAMPLE_CLUBS.filter((club) =>
      Array.isArray(club.categories) && club.categories.includes(selectedCategory),
    )
  }, [selectedCategory])

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
              className={selectedCategory === 'All' ? 'filter-chip active' : 'filter-chip'}
              onClick={() => setSelectedCategory('All')}
            >
              All
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={selectedCategory === category ? 'filter-chip active' : 'filter-chip'}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

export default Discover;