import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow } from '@react-google-maps/api';
import AppButton from './AppButton'; // Make sure your AppButton component is imported
import AdvancedMarker from './MarkerComponent'; // Make sure your AdvancedMarker component is imported

const containerStyle = {
  width: '2850px',
  height: '1250px',
};

const initialCenter = {
  lat: -3.745,
  lng: -38.523,
};

// Define the libraries array as a constant to avoid unnecessary reloads
const libraries = ['marker'];

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries, // use the constant here
  });

  const [map, setMap] = useState(null);
  const [dialogLocation, setDialogLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [listOfLocations, setListOfLocations] = useState([]);

  const onLoad = useCallback((mapInstance) => {
    const bounds = new window.google.maps.LatLngBounds(initialCenter);
    mapInstance.fitBounds(bounds);
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    const location = { lat, lng };
    setDialogLocation(location);
    setSelectedLocation(location);
    setShowDialog(true);
  }, []);

  const onAddLocation = useCallback(() => {
    const geocoder = new window.google.maps.Geocoder();

    geocoder.geocode({ location: selectedLocation }, (results, status) => {
      if (status === "OK") {
        if (results[0]) {
          setListOfLocations((prevList) => [
            ...prevList,
            { name: results[0].formatted_address, location: selectedLocation },
          ]);
          setShowDialog(false);
        } else {
          console.error("No results found");
        }
      } else {
        console.error("Geocoder failed due to: " + status);
      }
    });
  }, [selectedLocation]);

  // displays marker on the map for the selected location
  const onViewLocation = (loc) => {
    setMarkerLocation({ lat: loc.lat, lng: loc.lng });
    if (map) {
      map.panTo(loc);
      map.setZoom(14); // Optional: Zoom closer to viewed location
    }
  };

  // deletes selected location from the list
  const onDeleteLocation = (loc) => {
    const updatedList = listOfLocations.filter(
      (l) => !(loc.lat === l.location.lat && loc.lng === l.location.lng)
    );
    setListOfLocations(updatedList);

    // Clear marker if deleted location was being viewed
    if (markerLocation && loc.lat === markerLocation.lat && loc.lng === markerLocation.lng) {
      setMarkerLocation(null);
    }
  };

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
          mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID, // Replace with your valid Map ID
        }}
      >
        {showDialog && dialogLocation && (
          <InfoWindow
            position={dialogLocation}
            onCloseClick={() => setShowDialog(false)}
          >
            <button className="app-button" onClick={onAddLocation}>
              Add this location
            </button>
          </InfoWindow>
        )}

        {/* Marker for the currently viewed location */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={() => console.log("Viewed marker clicked")}
          >
            <div className="default-marker">📍</div>
          </AdvancedMarker>
        )}

        {/* Markers for all added locations */}
        {listOfLocations.map((loc) => (
          <AdvancedMarker
            key={loc.location.lat + loc.location.lng}
            map={map}
            position={loc.location}
            onClick={() => onViewLocation(loc.location)}
          >
            <div className="default-marker">📍</div>
          </AdvancedMarker>
        ))}
      </GoogleMap>

      <div className="list-container">
        {listOfLocations.length > 0 ? (
          <div>
            <p className="list-heading">List of Selected Locations</p>
            {listOfLocations.map((loc) => (
              <div
                key={loc.location.lat + loc.location.lng}
                className="list-item"
              >
                <p className="latLng-text">{loc.name}</p>
                <div style={{ display: "flex" }}>
                  <AppButton handleClick={() => onViewLocation(loc.location)}>
                    View
                  </AppButton>
                  <AppButton handleClick={() => onDeleteLocation(loc.location)}>
                    Delete
                  </AppButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            <p className="list-heading">
              Select a location from the map to show in a list
            </p>
          </div>
        )}
      </div>
    </div>
  ) : (
    <div>Loading Map...</div>
  );
}

export default React.memo(MapComponent);