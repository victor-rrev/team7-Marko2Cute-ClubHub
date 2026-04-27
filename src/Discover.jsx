import ClubList from './ClubList.jsx'
import './Discover.css'
function Discover(){
    return(
        <div>
            <div id="clubs">
                <ClubList name="A Club" description="We draw As" categories="fun" time="never" location="CCA"/>
                <ClubList name="B Club" description="We draw Bs" categories="fun" time="never" location="CCA"/>
            </div>
        </div>
    )
}

export default Discover;