import React from 'react'
import { Link } from 'react-router-dom'
function Notfound() {
  return (
    <div>
      <h1>404</h1>
      <Link to="/" className='btn btn-classic'>Home</Link>
    </div>
  )
}

export default Notfound
