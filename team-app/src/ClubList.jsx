import './Clublist.css'
function ClubList({name,description,categories,time,location}) {
  return (
    <>
      <h1>{name}</h1>
      <h1 class="clublisttimeandplace">{time} {location}</h1>
      <i class="heart"></i>
      <h3>{categories}</h3>
      <p>{description}</p>
    </>
  )
}

export default ClubList