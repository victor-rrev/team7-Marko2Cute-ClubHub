import './ClubList.css'
import {useState} from 'react'
import { RxCross2 } from "react-icons/rx";
function ClubList({name,description,categories,time,location}) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <div className="Card" 
          onClick={() => setIsOpen(true)} 
          style={{ cursor: 'pointer' }}>
        <div className="top">
          <h1>{name}</h1>
          <h3>{time}, @{location}</h3>  
        </div>
        
        <i className="heart"></i>
        {/*{categories.map((item,index)=>(
          <div key={item} className="card">
            <h3>{item.title}</h3>
            <p>{item.content}</p>
          </div>
        ))}*/}
        <h5>#{categories}</h5>
        <div id="clubdesc">
          <p>{description}</p>
        </div>
      </div>
      {isOpen && (
        <div className="popup-overlay" onClick={() => setIsOpen(false)}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <RxCross2 class="closebutton" size={30}
              onClick={() => setIsOpen(false)} 
              style={{ cursor: 'pointer' }}  />
            <div className="popupContent">
              <h1>{name}</h1>
              <hr></hr>
              <h4>Contact Info:</h4>
              <h4>President: pres</h4>
              <h4>Co-President: copres</h4>
              <h4>Teacher: teacher</h4>
              <h4>Location: {location}</h4>
              <h4>Time: {time}</h4>
              <h4>Acceptance: Free to Join</h4>
              <p>{description}. 
                 So like this is just a long placeholder description I put here to take up space and see how this will look, please ignore the following long paragraph about starfish. Starfish, more accurately known as sea stars, are fascinating marine invertebrates belonging to the phylum Echinodermata, meaning they are closely related to sea urchins and sea cucumbers rather than fish. With over 2,000 species inhabiting all of the world's oceans, from tropical reefs to cold, deep-sea floors, they are characterized by a central disc and typically five arms, though some species can have up to 40. Lacking a brain or blood, sea stars use a unique "water vascular system" to pump filtered seawater through their bodies to operate hundreds of tiny tube feet, which are used for movement, gripping surfaces, and capturing prey.
                </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
/*      <div className='Card'>
            <h2>{name}</h2>
            <p>Description: {description}</p>
            <button onClick={() => setCount(count+1)}>Add {name} to cart</button>
            <button onClick={()=>setCount(0)}>Reset</button>
            <p>Total {name}: {count}</p>
        </div>*/
export default ClubList