import ClubList from './ClubList.jsx'
import './SportsEvents.css'
import { Link } from 'react-router-dom';
function SportsEvents(){
    return(
        <div>
            <h1 className="title">Sports Events</h1>
            <div id="clubs">
                <ClubList name="Baseball Tryouts" description="Try out for the baseball team" categories="fun" time="never" location="CCA"/>
                <ClubList name="B Club" description="We draw Bs" categories="fun" time="never" location="CCA"/>
                <ClubList name="C Club" description="We draw Cs" categories="fun" time="never" location="CCA"/>
                <ClubList name="D Club" description="We draw Ds" categories="fun" time="never" location="CCA"/>
                <ClubList name="E Club" description="We draw Es" categories="fun" time="never" location="CCA"/>
            </div>
            <Link to="/Events">
                <button className="backbutton">Back</button>
            </Link>
        </div>
    )
}

export default SportsEvents;