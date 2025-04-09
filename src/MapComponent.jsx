import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import AdvancedMarker from './MarkerComponent';
import { usePosts } from './hooks/usePosts';

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

  // These states are used for the manually placed, editable marker.
  const [map, setMap] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [editingMarker, setEditingMarker] = useState(false);
  const [markerText, setMarkerText] = useState("");
  const [savedMarkerText, setSavedMarkerText] = useState("");

  // For the purposes of this example, we define a static viewed area.
  // In a real app, you might derive this from the map's bounds.
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

  // When the map is clicked, the manually placed marker is updated.
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const location = { lat, lng };

    setMarkerLocation(location);
    // Reset the editing state/text.
    setEditingMarker(false);
    setSavedMarkerText("");
  }, []);

  // When the manual marker is clicked, editing mode is enabled.
  const handleMarkerClick = useCallback(() => {
    setEditingMarker(true);
    setMarkerText(savedMarkerText);
  }, [savedMarkerText]);

  // When Enter is pressed in the input, save the text.
  const handleInputKeyDown = useCallback((event) => {
    if (event.key === "Enter") {
      setSavedMarkerText(markerText);
      setEditingMarker(false);
    }
  }, [markerText]);

  return isLoaded ? (
    <div>
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
            <div className="default-marker">📍</div>
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
                  boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.3)'
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
        {posts.map((post) => (
          <AdvancedMarker 
            key={post.id}
            map={map}
            position={{ lat: post.postLocationLat, lng: post.postLocationLong }}
            // You can add an onClick or an InfoWindow here for post details if desired.
          >
            <div className="default-marker" title={post.title}>📍</div>
          </AdvancedMarker>
        ))}
        
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