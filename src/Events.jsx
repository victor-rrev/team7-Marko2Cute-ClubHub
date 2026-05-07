import './Events.css'
import {useState} from 'react'
import {FiCalendar} from 'react-icons/fi';
import { RxCross2 } from "react-icons/rx";
import { Link } from 'react-router-dom';
import ClubList from './ClubList.jsx';
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
                    </div>
                </Link>
                <Link to="/SportsEvents">
                    <div className="sportsEvents">
                        <h2>Sports Events</h2>
                        <ClubList name="Baseball tryouts" description="tryout to join baseball team" categories="fun" time="yesterday" location="PTMS Quad"/>
                        <ClubList name="B Club" description="We draw Bs" categories="fun" time="never" location="CCA"/>
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
                        <RxCross2 class="closebutton" size={30}
                          onClick={() => setIsOpen(false)} 
                          style={{ cursor: 'pointer' }}  />
                        <div className="popupContent">
                          <h2>Calendar</h2>
                        </div>
                      </div>
                    </div>
                  )}
        </div>   
    )
}

export default Events;