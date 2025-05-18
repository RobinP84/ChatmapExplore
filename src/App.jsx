import React from 'react'
import SpriteLoader from './Components/SpriteLoader'
import MapComponent from './MapComponent'

function App() {
  return (
    <>
      {/* Fetch & inject your sprites.svg once */}
      <SpriteLoader />

      {/* Now MapComponent (and any other child) can just do <use href="#icon-…" /> */}
      <MapComponent />
    </>
  )
}

export default App