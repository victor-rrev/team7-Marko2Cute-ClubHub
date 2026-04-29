import './Events.css'
import ClubList from './ClubList.jsx'
function Events(){
    return(
        <div>
            <div className="clubEvents">
                <ClubList name="Cookie Sale" description="We sell cookies" categories="fun" time="never" location="CCA"/>
                <ClubList name="ASB Dance" description="Go Dancing" categories="fun" time="11:00PM April 1st" location="Walmart"/>
            </div>
            <div className="sportsEvents">
                <ClubList name="Baseball tryouts" description="tryout to join baseball team" categories="fun" time="yesterday" location="PTMS Quad"/>
                <ClubList name="B Club" description="We draw Bs" categories="fun" time="never" location="CCA"/>
            </div>
        </div>
    )
}

export default Events;