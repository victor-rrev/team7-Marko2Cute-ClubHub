import ClubList from './ClubList.jsx'
import './Discover.css'
function Discover(){
    return(
        <div>
            <header class="sticky-header"></header>
            <div id="clubs">
                <ClubList name="A Club" description="We draw As" categories="fun" time="never" location="CCA"/>
                <ClubList name="B Club" description="We draw Bs" categories="fun" time="never" location="CCA"/>
                <ClubList name="C Club" description="We draw Cs" categories="fun" time="never" location="CCA"/>
                <ClubList name="D Club" description="We draw Ds" categories="fun" time="never" location="CCA"/>
                <ClubList name="E Club" description="We draw Es" categories="fun" time="never" location="CCA"/>
            </div>
        </div>
    )
}

export default Discover;