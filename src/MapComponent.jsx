// src/MapComponent.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { INFO_WINDOW_MODE }                from './constants/infoWindowModes';
import AdvancedMarker                      from './MarkerComponent';
import { useCreatePost }                   from './hooks/useCreatePost';
// Pull in usePosts (your mock‐back end)
import { usePosts }                        from './hooks/usePosts';
import { useLocalHistory }                 from './hooks/useLocalHistory';
import { useLocalFavorites }               from './hooks/useLocalFavorites';
import { useUIStore }                      from './store/uiStore';
import { MakePostIcon, PostMarkerIcon }    from './Components/CustomMarkerIcon';
import LoginButton                         from './Components/loginButtonComponent';
import authService                         from './firebase/firebaseAuth';
import CustomInfoWindow                    from './Components/CustomInfoWindow';

const containerStyle = { width: '375px', height: '812px' };
const initialCenter  = { lat: 59.3293, lng: 18.0686 };
const libraries      = ['marker'];

const mapOptions = {
  disableDefaultUI:  true,
  clickableIcons:    false,
  mapId:             import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  gestureHandling:   'greedy',
};

function MapComponent() {
  const { isLoaded } = useJsApiLoader({
    id:               import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ─── Zustand (UI state) ─────────────────────────────────
  // selectedPostId is stored as a string (or null)
  const selectedPostId    = useUIStore((s) => s.selectedPostId);
  const setSelectedPostId = useUIStore((s) => s.setSelectedPostId);
  const isMakePostOpen    = useUIStore((s) => s.isMakePostOpen);
  const setIsMakePostOpen = useUIStore((s) => s.setIsMakePostOpen);

  // ─── Local React state ────────────────────────────────────
  const [map,            setMap]            = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [user,           setUser]           = useState(null);

  // ─── Hard‐coded “viewed area” ─────────────────────────────
  const viewedArea = {
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  };

  // ─── Fetch posts from “mock” or Firebase ───────────────────
  const {
    posts: rawPosts = [],     // raw array from your mock hook
    loading: loadingPosts,    // boolean
    reloadPosts,              // function
  } = usePosts(viewedArea);

  // ─── Normalize IDs to strings (so Zustand’s selectedPostId is always a string)
  // const posts = React.useMemo(() => {
  //   return rawPosts.map((p) => ({
  //     ...p,
  //     id: String(p.id),
  //   }));
  // }, [rawPosts]);

  const posts = React.useMemo(() => {
    return rawPosts.map((p) => ({
      ...p,
      id: p.id,
    }));
  }, [rawPosts]);

  // ─── Dexie (IndexedDB) ────────────────────────────────────
  const { allHistory, addClosed }     = useLocalHistory();
  const { allFavorites, addFavorite } = useLocalFavorites();
  const closedPostIds = React.useMemo(
    () => new Set(allHistory.map((h) => h.postId)),
    [allHistory]
  );

  // ─── Hook to create a new post ─────────────────────────────
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

  // Click on the map → drop a “new post” marker
  const handleMapClick = useCallback(
    (e) => {
      setMarkerLocation({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
      setIsMakePostOpen(false);
    },
    [setIsMakePostOpen]
  );

  // Click the “new post” marker icon → open MAKE_POST form
  const handleMarkerClickForNew = useCallback(() => {
    setIsMakePostOpen(true);
  }, [setIsMakePostOpen]);

  // Save a newly created post → refresh list → close form
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

  // ─── Here is the (ONLY) change! ───────────────────────────
  // Toggle “MINIMIZED ↔ EXPANDED” for an existing post (no functional updater):
  const handleTogglePost = useCallback(
    (post) => {
      console.log('👆 Post clicked, post.id =', post.id);
      if (selectedPostId === post.id) {
        setSelectedPostId(null);
      } else {
        setSelectedPostId(post.id);
      }
    },
    [selectedPostId, setSelectedPostId]
  );

  // Close an expanded InfoWindow → add to Dexie history → hide permanently
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
        onClick={handleMapClick} // click on the map → place new post marker
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
          </AdvancedMarker>
        )}

        {/* 2) InfoWindow for creating a post (MAKE_POST) */}
        {markerLocation && isMakePostOpen && (
          <CustomInfoWindow
            map={map}
            position={markerLocation}
            mode={INFO_WINDOW_MODE.MAKE_POST}
            onClose={() => setIsMakePostOpen(false)}
            onSave={handleSaveCreatePost}
          />
        )}

        {/* 3 & 4) For each visible post: render marker + CustomInfoWindow */}
        {visiblePosts.map((post) => {
          // Now selectedPostId and post.id are both strings:
          const isExpanded = selectedPostId === post.id;
          const mode       = isExpanded
            ? INFO_WINDOW_MODE.EXPANDED
            : INFO_WINDOW_MODE.MINIMIZED;

          console.log(
            '⏺ rendering post.id:', post.id,
            'selectedPostId:', selectedPostId,
            '→ isExpanded=', isExpanded ? 'YES' : 'no'
          );

          return (
            <React.Fragment key={post.id}>
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
                isFavorited={allFavorites.some(
                  // (f) => String(f.postId) === post.id
                  (f) => f.postId === post.id
                )}
              />
            </React.Fragment>
          );
        })}
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapComponent);