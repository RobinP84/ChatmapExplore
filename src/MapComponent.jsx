import React, { 
  useState, 
  useCallback, 
  useEffect 
} from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';

import AdvancedMarker                   from './MarkerComponent';
import { usePosts }                     from './hooks/usePosts';
import { MakePostIcon, PostMarkerIcon } from './Components/CustomMarkerIcon';
import LoginButton                      from './Components/loginButtonComponent';
import authService                      from './firebase/firebaseAuth';
import CustomInfoWindow                 from './Components/CustomInfoWindow';

const containerStyle = { width: '375px', height: '812px' };
const initialCenter   = { lat: -3.745, lng: -38.523 };
const libraries       = ['marker'];

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id:    import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries
  });

  const [map, setMap]                       = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [editingMarker, setEditingMarker]   = useState(false);
  const [markerText, setMarkerText]         = useState('');
  const [savedMarkerText, setSavedMarkerText] = useState('');
  const [user, setUser]                     = useState(null);
  const [selectedPost, setSelectedPost]     = useState(null);

  const { posts, loading, reloadPosts } = usePosts({
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  });

  useEffect(() => {
    const unsub = authService.onAuthStateChanged(u => setUser(u));
    return unsub;
  }, []);

  const onLoad = useCallback(m => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const handleMapClick = useCallback(e => {
    setMarkerLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setEditingMarker(false);
    setSavedMarkerText('');
  }, []);

  const handleMarkerClick = useCallback(() => {
    setEditingMarker(true);
    setMarkerText(savedMarkerText);
  }, [savedMarkerText]);

  const handleInputKeyDown = useCallback(e => {
    if (e.key === 'Enter') {
      setSavedMarkerText(markerText);
      setEditingMarker(false);
    }
  }, [markerText]);

  const handlePostMarkerClick = post => setSelectedPost(post);

  if (!isLoaded) return <div>Loading Map…</div>;

  return (
    <div>
      {/* NAV BAR */}
      <div className="nav-bar">
        {user ? (
          <button onClick={() => window.location.href = '/profile'}>
            <svg width={32} height={32} aria-hidden="true">
              <use href="#icon-user" />
            </svg>
          </button>
        ) : (
          <LoginButton />
        )}
        <button onClick={reloadPosts} disabled={loading}>
          <svg width={32} height={32} aria-hidden="true">
            <use href="#icon-search" />
          </svg>
        </button>
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
        options={{ mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID }}
      >
        {/* 1) Manual “make a post” */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={handleMarkerClick}
          >
            <MakePostIcon />
            {savedMarkerText && (
              <div className="marker-label" style={{
                position: 'absolute',
                bottom: '30px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'white',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}>
                {savedMarkerText}
              </div>
            )}
          </AdvancedMarker>
        )}

        {/* 2) Edit‐input popup */}
        {markerLocation && editingMarker && (
          <CustomInfoWindow map={map} position={markerLocation}>
            <input
              type="text"
              value={markerText}
              onChange={e => setMarkerText(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Enter text and press Enter"
              autoFocus
              style={{ width: 200, padding: 4 }}
            />
          </CustomInfoWindow>
        )}

        {/* 3) BASIC popup for every post */}
        {Array.isArray(posts) && posts.map(post => (
          <React.Fragment key={post.id}>
            <AdvancedMarker
              map={map}
              position={{
                lat: post.postLocationLat,
                lng: post.postLocationLong
              }}
              onClick={() => handlePostMarkerClick(post)}
            >
              <PostMarkerIcon />
            </AdvancedMarker>

            <CustomInfoWindow
              map={map}
              position={{
                lat: post.postLocationLat,
                lng: post.postLocationLong
              }}
              style={{ cursor: 'pointer' }}
              onClose={() => handlePostMarkerClick(post)}
            >
              <strong>{post.title}</strong>
            </CustomInfoWindow>
          </React.Fragment>
        ))}

        {/* 4) EXPANDED popup on top */}
        {selectedPost && (
          <CustomInfoWindow
            map={map}
            position={{
              lat: selectedPost.postLocationLat,
              lng: selectedPost.postLocationLong
            }}
            className="expanded-post-window"
            style={{ cursor: 'default' }}
            onClose={() => setSelectedPost(null)}
          >
            <h3>{selectedPost.title}</h3>
            <p>{selectedPost.message}</p>
            <button className="close-btn">×</button>
          </CustomInfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapComponent);