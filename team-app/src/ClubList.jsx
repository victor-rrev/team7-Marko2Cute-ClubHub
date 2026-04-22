import './Clublist.css'
import {usestate} from 'react'
function ClubList({name,description,categories,time,location}) {
  return (
    <>
      <h1>{name}</h1>
      <h1 class="clublisttimeandplace">{time} {location}</h1>
      <i class="heart"></i>
      {categories.map((item,index)=>(
        <div key={item} className="card">
          <h3>{item.title}</h3>
          <p>{item.content}</p>
        </div>
      ))}
      <div id="clubdesc">
        <p>{description}</p>
      </div>
    </>
  )
}

export default ClubList