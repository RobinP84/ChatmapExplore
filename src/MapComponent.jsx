import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import AdvancedMarker from './MarkerComponent';
import { usePosts } from './hooks/usePosts';
import { MakePostIcon, PostMarkerIcon } from './Components/CustomMarkerIcon';
import LoginButton from './Components/loginButtonComponent';
import authService from './firebase/firebaseAuth';    // <-- import your auth wrappers
//import { useNavigate } from 'react-router-dom';       // or use window.location

const containerStyle = { width: '375px', height: '812px' };
const initialCenter = { lat: -3.745, lng: -38.523 };
const libraries = ['marker'];

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // States for the manually placed marker (for making posts)
  const [map, setMap] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [editingMarker, setEditingMarker] = useState(false);
  const [markerText, setMarkerText] = useState("");
  const [savedMarkerText, setSavedMarkerText] = useState("");
  //const navigate = useNavigate();  // if you have React Router set up
  const [user, setUser] = useState(null);

  // State to manage which post marker's tooltip (InfoWindow) is open.
  const [selectedPost, setSelectedPost] = useState(null);

  // For this example, we define a static viewed area.
  const viewedArea = {
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  };

  // usePosts returns posts, a loading flag, and a reloadPosts function.
  const { posts, loading, reloadPosts } = usePosts(viewedArea);

  const onLoad = useCallback((mapInstance) => {
    const bounds = new window.google.maps.LatLngBounds(initialCenter);
    mapInstance.fitBounds(bounds);
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // When the map is clicked, update the manually placed marker.
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const location = { lat, lng };

    setMarkerLocation(location);
    // Reset the editing state/text.
    setEditingMarker(false);
    setSavedMarkerText("");
  }, []);

  // When the manually placed marker is clicked, enable editing.
  const handleMarkerClick = useCallback(() => {
    setEditingMarker(true);
    setMarkerText(savedMarkerText);
  }, [savedMarkerText]);

  // Save marker text on pressing Enter.
  const handleInputKeyDown = useCallback((event) => {
    if (event.key === "Enter") {
      setSavedMarkerText(markerText);
      setEditingMarker(false);
    }
  }, [markerText]);

  // When a post marker is clicked, update selectedPost state.
  const handlePostMarkerClick = (post) => {
    setSelectedPost(post);
  };

  useEffect(() => {
    // subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged(u => {
      setUser(u);
    });
    return unsubscribe; // cleanup on unmount
  }, []);

  return isLoaded ? (
    <div>
      {/* -------------------------------------------------- */}
      {/* TOP BAR: login or profile */}
      <div className="nav-bar" >
        {user ? (
          <button
            onClick={() => {
              // route to /profile (you’ll build that page later)
              navigate('/profile');
              // or: window.location.href = '/profile';
            }}
          >
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16.642 20.3621C21.0602 20.3621 24.642 16.7803 24.642 12.3621C24.642 7.94378 21.0602 4.36206 16.642 4.36206C12.2237 4.36206 8.64197 7.94378 8.64197 12.3621C8.64197 16.7803 12.2237 20.3621 16.642 20.3621Z" 
              stroke="#6F6F6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4.64197 27.3621C7.06322 23.1783 11.4607 20.3621 16.642 20.3621C21.8232 20.3621 26.2207 23.1783 28.642 27.3621" 
              stroke="#6F6F6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>



          </button>
        ) : (
          <LoginButton />
        )}

        {/* Button to fetch posts from the repository */}
      
        <button onClick={reloadPosts} disabled={loading}>
          {loading ? '' : ''}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.25 21C17.0825 21 21 17.0825 21 12.25C21 7.41751 17.0825 3.5 12.25 3.5C7.41751 3.5 3.5 7.41751 3.5 12.25C3.5 17.0825 7.41751 21 12.25 21Z" 
            stroke="#6F6F6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M18.4373 18.4374L24.5 24.5" 
            stroke="#6F6F6F" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      
        
      </div>
      {/* -------------------------------------------------- */}

      <GoogleMap
        mapContainerStyle={containerStyle}
        center={initialCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        gestureHandling="greedy"
        disableDefaultUI
        onClick={handleMapClick}
        options={{
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
        }}
      >
        {/* Render the manually placed marker */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={handleMarkerClick}
          >
            <MakePostIcon />
            {savedMarkerText && (
              <div
                className="marker-label"
                style={{
                  position: 'absolute',
                  bottom: '30px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  whiteSpace: 'nowrap',
                  backgroundColor: 'white',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)',
                }}
              >
                {savedMarkerText}
              </div>
            )}
          </AdvancedMarker>
        )}

        {/* Show an InfoWindow for editing the marker text */}
        {markerLocation && editingMarker && (
          <InfoWindow
            position={markerLocation}
            onCloseClick={() => setEditingMarker(false)}
          >
            <div>
              <input
                type="text"
                value={markerText}
                onChange={(e) => setMarkerText(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Enter text and press Enter"
                autoFocus
                style={{ width: '200px', padding: '4px' }}
              />
            </div>
          </InfoWindow>
        )}

        {/* Render markers for all posts fetched from the repository */}
        {posts.map((p) => (
          <React.Fragment key={p.id}>
            <AdvancedMarker
              map={map}
              position={{ lat: p.postLocationLat, lng: p.postLocationLong }}
              title={p.title}
              onClick={() => handlePostMarkerClick(p)}
            >
              <PostMarkerIcon />
            </AdvancedMarker>
            <InfoWindow
              position={{ lat: p.postLocationLat, lng: p.postLocationLong }}
              options={{ disableAutoPan: true }}
            >
              <div>
                <h3>{p.title}</h3>
                <p>{p.message}</p>
              </div>
            </InfoWindow>
          </React.Fragment>
        ))}

        {/* Optionally, you can still render a selected InfoWindow */}
        {selectedPost && (
          <InfoWindow
            position={{ lat: selectedPost.postLocationLat, lng: selectedPost.postLocationLong }}
            onCloseClick={() => setSelectedPost(null)}
          >
            <div className="post-board">
              <h3>{selectedPost.title}</h3>
              <p>{selectedPost.message}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      
    </div>
  ) : (
    <div>Loading Map...</div>
  );
}

export default React.memo(MapComponent);