import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import AdvancedMarker from './MarkerComponent';
import { usePosts } from './hooks/usePosts';
import { MakePostIcon, PostMarkerIcon } from './Components/CustomMarkerIcon';
import LoginButton from './Components/loginButtonComponent'; // Import your login button component

const containerStyle = {
  width: '2850px',
  height: '1250px',
};

const initialCenter = {
  lat: -3.745,
  lng: -38.523,
};

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

  return isLoaded ? (
    <div>
      {/* Render the login button above the map */}
      <div style={{ margin: '20px', textAlign: 'center' }}>
        {/* <LoginButton /> */}
      </div>

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
              title={p.title}
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
            title={selectedPost.title}
          >
            <div>
              <h3>{selectedPost.title}</h3>
              <p>{selectedPost.message}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Button to fetch posts from the repository */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button onClick={reloadPosts} disabled={loading}>
          {loading ? 'Loading Posts...' : 'Load Posts'}
        </button>
      </div>
    </div>
  ) : (
    <div>Loading Map...</div>
  );
}

export default React.memo(MapComponent);