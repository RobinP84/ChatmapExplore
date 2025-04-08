import React from 'react';
import MapComponent from './MapComponent';

function App() {
  return (
    <div>
      <h1>Chatmap</h1>
      <MapComponent />
    </div>
  );
}

export default App;


// import React from 'react'
// import { Fragment, useState } from 'react'
// import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'

// function App() {

//   return (
//     <Fragment>
//       <div className='container'>
//         <h1 className='text-center'>google-maps-markers-vite-react-yarn</h1>
//         <div style={{width: '100%', height: '90vh'}}>
//           isLoaded ? (
//             <GoogleMap
//               mapContainerStyle={{width: '100%', height: '90vh'}}
//               center={{lat: -3.745, lng: -38.523}}
//               zoom={10}
//               // onLoad={onLoad}
//               // onUnmount={onUnmount}
//             >
//               {/* Child components, such as markers, info windows, etc. */}
//               <></>
//             </GoogleMap>
//           ) : (
//             <></>
//           )
//         </div>
//       </div>
//     </Fragment>
//   )
// }

// export default App
