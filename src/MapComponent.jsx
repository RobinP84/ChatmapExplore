// src/MapComponent.jsx

import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker  } from '@react-google-maps/api';
import { INFO_WINDOW_MODE } from './constants/infoWindowModes';
import AdvancedMarker from './MarkerComponent';
import { useCreatePost } from './hooks/useCreatePost';
//import { useFirebasePosts } from './hooks/useFirebasePosts';
import { usePosts }         from './hooks/usePosts';
import { useLocalHistory } from './hooks/useLocalHistory';
import { useLocalFavorites } from './hooks/useLocalFavorites';
import { useUIStore } from './store/uiStore';
import { MakePostIcon, PostMarkerIcon } from './Components/CustomMarkerIcon';
import LoginButton from './Components/loginButtonComponent';
import authService from './firebase/firebaseAuth';
import CustomInfoWindow from './Components/CustomInfoWindow';

const containerStyle = { width: '375px', height: '812px' };
const initialCenter = { lat: 59.3293, lng: 18.0686 };
const libraries = ['marker'];

const mapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  gestureHandling: 'greedy',
};

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id: import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ─── Zustand (UI state) ─────────────────────────────────
  const selectedPostId    = useUIStore((s) => s.selectedPostId);
  const setSelectedPostId = useUIStore((s) => s.setSelectedPostId);
  const isMakePostOpen    = useUIStore((s) => s.isMakePostOpen);
  const setIsMakePostOpen = useUIStore((s) => s.setIsMakePostOpen);

  // ─── Local React state ────────────────────────────────────
  const [map, setMap]                   = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [savedText, setSavedText]       = useState('');
  const [user, setUser]                 = useState(null);

  // ─── Firestore + TanStack Query (v5) ─────────────────────
  // (Customize viewedArea as needed; here it’s hard‐coded)
  const viewedArea = {
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  };

  // const {
  //   data: posts = [],
  //   isLoading: loadingPosts,
  //   refetch: reloadPosts,
  // } = useFirebasePosts(viewedArea);

  const { posts, loading: loadingPosts, reloadPosts } = usePosts(viewedArea);
  // console.log("▶️ [usePosts] posts array:", posts);

  // ─── Dexie (IndexedDB) ────────────────────────────────────
  const { allHistory, addClosed }       = useLocalHistory();
  const { allFavorites, addFavorite }   = useLocalFavorites();
  const closedPostIds = React.useMemo(
    () => new Set(allHistory.map((h) => h.postId)),
    [allHistory]
  );

  // ─── Hook to create a new post (unchanged) ────────────────
  const { createPost, loading: creating } = useCreatePost();

  // ─── Firebase Auth listener ───────────────────────────────
  useEffect(() => {
    return authService.onAuthStateChanged((u) => {
      setUser(u);
    });
  }, []);

  // ─── Google Map callbacks ──────────────────────────────────
  const onLoad    = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const handleMapClick = useCallback(
    (e) => {
      setMarkerLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setSavedText('');
      setIsMakePostOpen(false);
    },
    [setIsMakePostOpen]
  );

  const handleMarkerClickForNew = useCallback(() => {
    setIsMakePostOpen(true);
  }, [setIsMakePostOpen]);

  const handleSaveCreatePost = useCallback(
    async ({ title, message }) => {
      if (!markerLocation || !user) return;
      await createPost({
        title,
        message,
        lat: markerLocation.lat,
        lng: markerLocation.lng,
        category: 'default',
        userId: user.uid,
      });
      reloadPosts();
      setIsMakePostOpen(false);
      setMarkerLocation(null);
    },
    [createPost, markerLocation, user, reloadPosts]
  );

  const handleTogglePost = useCallback(
    (post) => {
      console.log("👆 Post clicked, post.id=", post.id);
      setSelectedPostId((prev) => (prev === post.id ? null : post.id));
    },
    [setSelectedPostId]
  );

  // When closing an expanded InfoWindow, add to Dexie→history so it disappears
  const handleCloseInfoWindow = useCallback(
    (postId) => {
      addClosed(postId);
      setSelectedPostId(null);
    },
    [addClosed, setSelectedPostId]
  );

  if (!isLoaded) return <div>Loading Map…</div>;

  // Filter out any posts whose ID is in “closedPostIds”
  const visiblePosts = posts.filter((p) => !closedPostIds.has(p.id));

  // console.log("📚 allHistory from Dexie:", allHistory);
  // console.log("🚫 closedPostIds set:", closedPostIds);
  // console.log("✅ visiblePosts (after filter):", visiblePosts);

  return (
    <div>
      {/* ─── NAV BAR ───────────────────────────────────────────── */}
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
        <button onClick={reloadPosts} disabled={loadingPosts}>
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
        onClick={handleMapClick}       // clicking map closes “make‐post” popup
        options={mapOptions}
      >
        {/* 1) “Make a post” marker */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={handleMarkerClickForNew}
          >
            <MakePostIcon />
            {savedText && <div className="marker-label">{savedText}</div>}
          </AdvancedMarker>
        )}

        {/* 2) InfoWindow for creating a post */}
        {markerLocation && isMakePostOpen && (
          <CustomInfoWindow
            map={map}
            position={markerLocation}
            mode={INFO_WINDOW_MODE.MAKE_POST}
            onClose={() => setIsMakePostOpen(false)}
            onSave={handleSaveCreatePost}
          />
        )}

        {/* 3 & 4) For each “visible” post, show marker + InfoWindow */}
        {visiblePosts.map((post) => {        
          const isExpanded = selectedPostId === post.id;
          const mode = isExpanded
            ? INFO_WINDOW_MODE.EXPANDED
            : INFO_WINDOW_MODE.MINIMIZED;

          return (
            <React.Fragment key={post.id}>
              {/* {(() => {
                console.log("📍 Rendering marker for post.id:", post.id);
                return null;
              })()} */}
              <AdvancedMarker
                map={map}
                position={{
                  lat: post.postLocationLat,
                  lng: post.postLocationLong,
                }}
                onClick={() => handleTogglePost(post)}
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
                onClick={() => handleTogglePost(post)}
                onClose={() => handleCloseInfoWindow(post.id)}
                onFavorite={() => addFavorite(post.id)}
                isFavorited={allFavorites.some((f) => f.postId === post.id)}
              />
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapComponent);