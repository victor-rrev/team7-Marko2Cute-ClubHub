import './ClubList.css'
import { useState } from 'react'
import { RxCross2, RxStarFilled, RxStar } from 'react-icons/rx'

function ClubList({ name, description, categories, time, location }) {
  const [isOpen, setIsOpen] = useState(false)
  const [favorite, setFavorite] = useState(false)

  const categoryList = Array.isArray(categories)
    ? categories
    : typeof categories === 'string'
    ? categories.split(',').map((item) => item.trim()).filter(Boolean)
    : []

  return (
    <>
      <div
        className="Card"
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setIsOpen(true)
        }}
        style={{ cursor: 'pointer' }}
      >
        <button
          className={`star-button ${favorite ? 'starred' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setFavorite((prev) => !prev)
          }}
          aria-label={favorite ? 'Unfavorite club' : 'Favorite club'}
        >
          {favorite ? <RxStarFilled size={24} /> : <RxStar size={24} />}
        </button>

        <div className="top">
          <h1>{name}</h1>
          <h3>{time}, @{location}</h3>
        </div>

        <div className="category-row">
          {categoryList.map((category) => (
            <span key={category} className="category-chip">
              #{category}
            </span>
          ))}
        </div>

        <div id="clubdesc">
          <p>{description}</p>
        </div>
      </div>

      {isOpen && (
        <div
          className="popup-overlay"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setIsOpen(false)
          }}
        >
          <div className="popup-box" onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
          }}>
            <RxCross2
              className="closebutton"
              size={30}
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                setIsOpen(false)
              }}
              style={{ cursor: 'pointer' }}
            />
            <div className="popupContent">
              <h1>{name}</h1>
              <hr />
              <h4>Contact Info:</h4>
              <h4>President: pres</h4>
              <h4>Co-President: copres</h4>
              <h4>Teacher: teacher</h4>
              <h4>Location: {location}</h4>
              <h4>Time: {time}</h4>
              <h4>Acceptance: Free to Join</h4>
              <p>
                {description}. So like this is just a long placeholder description I put here to take up space and see how this will look, please ignore the following long paragraph about starfish. Starfish, more accurately known as sea stars, are fascinating marine invertebrates belonging to the phylum Echinodermata, meaning they are closely related to sea urchins and sea cucumbers rather than fish. With over 2,000 species inhabiting all of the world's oceans, from tropical reefs to cold, deep-sea floors, they are characterized by a central disc and typically five arms, though some species can have up to 40. Lacking a brain or blood, sea stars use a unique "water vascular system" to pump filtered seawater through their bodies to operate hundreds of tiny tube feet, which are used for movement, gripping surfaces, and capturing prey.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ClubList