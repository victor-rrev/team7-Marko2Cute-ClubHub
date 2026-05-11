import './Events.css'
import {useState} from 'react'
import {FiCalendar} from 'react-icons/fi';
import { RxCross2 } from "react-icons/rx";
import { Link } from 'react-router-dom';
import ClubList from './ClubList.jsx';

function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 7)) // May 7, 2026

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const days = []

  // Empty cells for days before month starts
  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-empty"></div>)
  }

  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    const isToday = i === 7 && currentDate.getMonth() === 4 && currentDate.getFullYear() === 2026
    days.push(
      <div key={i} className={`calendar-day ${isToday ? 'today' : ''}`}>
        {i}
      </div>
    )
  }

  return (
    <div className="calendar-content">
      <div className="calendar-header">
        <button onClick={handlePrevMonth} className="calendar-nav-btn">&lt;</button>
        <h3>{monthYear}</h3>
        <button onClick={handleNextMonth} className="calendar-nav-btn">&gt;</button>
      </div>
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="calendar-grid">
        {days}
      </div>
    </div>
  )
}
function Events(){

    const [isOpen, setIsOpen] = useState(false);

    return(
        <div className="events">
            <div className="center-container">
                <Link to="/ClubEvents">
                    <div className="clubEvents">
                        <h2>Club/ASB Events</h2>
                        <ClubList name="Cookie Sale" description="We sell cookies" categories="fun" time="never" location="CCA"/>
                        <ClubList name="ASB Dance" description="Go Dancing" categories="fun" time="11:00PM April 1st" location="Walmart"/>
                        <h5>More v</h5>
                    </div>
                </Link>
                <Link to="/SportsEvents">
                    <div className="sportsEvents">
                        <h2>Sports Events</h2>
                        <ClubList name="Baseball tryouts" description="tryout to join baseball team" categories="fun" time="yesterday" location="PTMS Quad"/>
                        <ClubList name="B Club" description="We draw Bs" categories="fun" time="never" location="CCA"/>
                        <h5>More v</h5>
                    </div>
                </Link>
            </div>
            <div className="right-container">
                <div className="calendar"
                onClick={() => setIsOpen(true)} 
                style={{ cursor: 'pointer' }}>
                    <FiCalendar size = {60} />
                    <span>Calendar</span>
                </div>
            </div>
            {isOpen && (
                    <div className="popup-overlay" onClick={() => setIsOpen(false)}>
                      <div className="calendar-box" onClick={(e) => e.stopPropagation()}>
                        <RxCross2 className="closebutton" size={30}
                          onClick={() => setIsOpen(false)} 
                          style={{ cursor: 'pointer' }}  />
                        <Calendar />
                      </div>
                    </div>
                  )}
        </div>   
    )
}

export default Events;