import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import AdvancedMarker from './MarkerComponent';

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

  const [map, setMap] = useState(null);
  // This state will hold the single marker location.
  const [markerLocation, setMarkerLocation] = useState(null);

  const onLoad = useCallback((mapInstance) => {
    const bounds = new window.google.maps.LatLngBounds(initialCenter);
    mapInstance.fitBounds(bounds);
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Each map click replaces the current markerLocation.
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    const location = { lat, lng };

    setMarkerLocation(location);
  }, []);

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
        {/* Render only one marker based on markerLocation */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={() => console.log("Marker clicked")}
          >
            <div className="default-marker">📍</div>
          </AdvancedMarker>
        )}
      </GoogleMap>
    </div>
  ) : (
    <div>Loading Map...</div>
  );
}

export default React.memo(MapComponent);
