import './ClubList.css'
import {usestate} from 'react'
function ClubList({name,description,categories,time,location}) {
  return (
    <div className="Card">
      <h1>{name}</h1>
      <h3>{time}, @{location}</h3>
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