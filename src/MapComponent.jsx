// src/MapComponent.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader }            from '@react-google-maps/api';
import { INFO_WINDOW_MODE }                     from './constants/infoWindowModes';
import AdvancedMarker                           from './MarkerComponent';
import { usePosts }                             from './hooks/usePosts';
import { useCreatePost }                        from './hooks/useCreatePost';
import { MakePostIcon, PostMarkerIcon }         from './Components/CustomMarkerIcon';
import LoginButton                              from './Components/loginButtonComponent';
import authService                              from './firebase/firebaseAuth';
import CustomInfoWindow                         from './Components/CustomInfoWindow';

const containerStyle = { width: '375px', height: '812px' };
const initialCenter  = { lat: 59.3293, lng: 18.0686 };
const libraries      = ['marker'];

const mapOptions = {
  disableDefaultUI: true,
  clickableIcons:   false,
  mapId:            import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  gestureHandling:  'greedy',
};

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id:               import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [map, setMap]               = useState(null);
  const [markerLocation, setMarker] = useState(null);
  const [editingMarker, setEditing]= useState(false);
  const [markerText, setMarkerText]= useState('');
  const [savedText, setSavedText]  = useState('');
  const [user, setUser]            = useState(null);
  const [selectedPost, setSelected]= useState(null);

  // ① Fetch existing posts
  const { posts, loading, reloadPosts } = usePosts({
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  });

  // ② Hook to insert new posts
  const { createPost, loading: creating } = useCreatePost();

  // Listen to auth state
  useEffect(() => authService.onAuthStateChanged(u => setUser(u)), []);

  const onLoad    = useCallback(m => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // When you click on the map, drop a marker for “new post”
  const handleMapClick = useCallback(e => {
    setMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setEditing(false);
    setSavedText('');
  }, []);

  // When that “new post” marker is clicked, show the form
  const handleMarkerClick = useCallback(() => {
    setEditing(true);
    setMarkerText(savedText);
  }, [savedText]);

  // Toggle an existing post’s InfoWindow
  const togglePost = useCallback(post => {
    setSelected(prev => {
      const next = prev?.id === post.id ? null : post;
      return next;
    });
  }, []);

  const closeExpanded = useCallback(() => {
    setSelected(null);
  }, []);

  // ── 1) Memoize the “close the make‐post popup” handler
  const closeMakePost = useCallback(() => {
    setEditing(false);
  }, []);

  // ── 2) Memoize the “save new post” handler
  const handleSaveCreatePost = useCallback(
    ({ title, message }) => {
      if (!markerLocation || !user) {
        return Promise.resolve();
      }
      return createPost({
        title,
        message,
        lat:      markerLocation.lat,
        lng:      markerLocation.lng,
        category: 'default',
        userId:   user.uid,
      })
      .then(() => {
        reloadPosts();        // refresh the list after inserting
        setEditing(false);
        setMarker(null);
      })
      .catch(err => {
        console.error('Error creating post:', err);
      });
    },
    [createPost, markerLocation, user, reloadPosts]
  );

  if (!isLoaded) return <div>Loading Map…</div>;

  return (
    <div>
      {/* NAV BAR */}
      <div className="nav-bar">
        {user ? (
          <button onClick={() => (window.location.href = '/profile')}>
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
        onClick={handleMapClick}       // clicking map closes the “make post” popup
        options={mapOptions}
      >
        {/* 1) “Make a post” marker */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={handleMarkerClick}
          >
            <MakePostIcon />
            {savedText && (
              <div className="marker-label" style={{ /* your styles */ }}>
                {savedText}
              </div>
            )}
          </AdvancedMarker>
        )}

        {/* 2) Edit‐input popup (MAKE_POST mode) */}
        {markerLocation && editingMarker && (
          <CustomInfoWindow
            map={map}
            position={markerLocation}
            mode={INFO_WINDOW_MODE.MAKE_POST}
            onClose={closeMakePost}                   // memoized
            onSave={handleSaveCreatePost}             // memoized
          />
        )}

        {/* 3 & 4) Minimized & Expanded InfoWindows for each existing post */}
        {posts.map(post => {
          const mode =
            selectedPost?.id === post.id
              ? INFO_WINDOW_MODE.EXPANDED
              : INFO_WINDOW_MODE.MINIMIZED;

          return (
            <React.Fragment key={post.id}>
              <AdvancedMarker
                map={map}
                position={{
                  lat: post.postLocationLat,
                  lng: post.postLocationLong,
                }}
                onClick={() => togglePost(post)}
              >
                <PostMarkerIcon />
              </AdvancedMarker>

              <CustomInfoWindow
                map={map}
                position={{
                  lat: post.postLocationLat,
                  lng: post.postLocationLong,
                }}
                post={post}
                mode={mode}
                category={post.category}
                onClick={() => togglePost(post)}
                onClose={closeExpanded}
              />
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapComponent);