import './Clubcard.css'
import { useState } from 'react'
function ClubList({name,description,categories,time,location}) {
  return (
    <>
      <h1>{name}</h1>
      <br></br>
      <h2>{time} {location}</h2>
      {categories.map((item,index)=>(
        <div key={item} className="card">
          <h3>{item.title}</h3>
          <p>{item.content}</p>
        </div>
      ))}
      <p>{description}</p>
    </>
  )
}

export default ClubList