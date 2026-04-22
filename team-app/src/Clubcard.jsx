import './Clublist.css'
function ClubList({name,description,categories,time,location}) {
  return (
    <>
      <h1>{name}</h1>
      <br></br>
      <h2>{time} {location}</h2>
      <h3>{categories}</h3>
      <p>{description}</p>
    </>
  )
}

export default ClubList