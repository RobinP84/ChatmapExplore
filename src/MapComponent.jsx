// src/MapComponent.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader }           from '@react-google-maps/api';
import { INFO_WINDOW_MODE }                     from './constants/infoWindowModes';
import AdvancedMarker                           from './MarkerComponent';
import { useCreatePost }                        from './hooks/useCreatePost';
import { usePosts }                             from './hooks/usePosts';
import { useLocalHistory }                      from './hooks/useLocalHistory';
import { useLocalFavorites }                    from './hooks/useLocalFavorites';
import { useUIStore }                           from './store/uiStore';
import { MakePostIcon, PostMarkerIcon }         from './Components/CustomMarkerIcon';
import LoginButton                              from './Components/loginButtonComponent';
import authService                              from './firebase/firebaseAuth';
import CustomInfoWindow                         from './Components/CustomInfoWindow';
import { CATEGORY_ID_TO_NAME }                  from './constants/categoryMap';
import { CATEGORY_COLORS }                      from './constants/categoryColors';

const containerStyle = { width: '375px', height: '812px' };
const initialCenter  = { lat: 59.3293, lng: 18.0686 };
const libraries      = ['marker'];
const mapOptions     = {
  disableDefaultUI: true,
  clickableIcons:   false,
  mapId:            import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  gestureHandling:  'greedy',
};

function MapComponent() {
  // ─── HOOK 1: load Google Maps JS API ────────────────────────────────
  const { isLoaded } = useJsApiLoader({
    id:               import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ─── HOOK 2: Zustand (“which post is expanded?”, “make‐post open?”) ──────
  const selectedPostId    = useUIStore((s) => s.selectedPostId);
  const setSelectedPostId = useUIStore((s) => s.setSelectedPostId);
  const isMakePostOpen    = useUIStore((s) => s.isMakePostOpen);
  const setIsMakePostOpen = useUIStore((s) => s.setIsMakePostOpen);

  // ─── HOOKs 3–5: React local state for map, marker, user ────────────────
  const [map,            setMap]            = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [user,           setUser]           = useState(null);

  // ─── HOOK 6: Fetch “viewed area” posts via React Query (or your mock) ─
  const viewedArea = {
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  };

  const {
    data: rawPosts = [],     // raw array of posts (may each have .rating, .categoryId, etc.)
    isLoading: loadingPosts, // boolean
    refetch: reloadPosts,    // function to manually re‐fetch
  } = usePosts(viewedArea);

  // ─── HOOK 7: Normalize each raw post so we have “.id” as string & “.category” as name ─
  const posts = React.useMemo(() => {
    return rawPosts.map((p) => {
      const idStr       = String(p.id);
      const categoryStr = CATEGORY_ID_TO_NAME[p.categoryId] || 'default';
      return {
        ...p,
        id:       idStr,
        category: categoryStr,
      };
    });
  }, [rawPosts]);

  // ─── HOOK 8: Dexie (IndexedDB) “closed posts” & “favorites” ─────────
  const { allHistory, addClosed }     = useLocalHistory();
  const { allFavorites, addFavorite } = useLocalFavorites();

  // Build a Set of all “closedPostIds” so we can filter them out:
  const closedPostIds = React.useMemo(
    () => new Set(allHistory.map((h) => h.postId)),
    [allHistory]
  );

  // ─── HOOK 9: Hook to create a new post (unchanged) ───────────────
  const { createPost, loading: creating } = useCreatePost();

  // ─── HOOK 10: Firebase Auth listener ───────────────────────────
  useEffect(() => {
    return authService.onAuthStateChanged((u) => {
      setUser(u);
    });
  }, []);

  // ─── HOOK 11: Google Map callbacks (onLoad / onUnmount) ──────────
  const onLoad    = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // ─── HOOK 12: “Make a post” marker handlers ───────────────────────
  const handleMapClick = useCallback(
    (e) => {
      setMarkerLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setIsMakePostOpen(false); // close any open “create post” form
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
        lat:      markerLocation.lat,
        lng:      markerLocation.lng,
        category: 'default',
        userId:   user.uid,
      });
      reloadPosts();
      setIsMakePostOpen(false);
      setMarkerLocation(null);
    },
    [createPost, markerLocation, user, reloadPosts]
  );

  // ─── HOOK 13: “Toggle MINIMIZED ↔ EXPANDED” for an existing post ───
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

  // ─── HOOK 14: “Close an expanded InfoWindow” → record in history so it won’t reappear ─
  const handleCloseInfoWindow = useCallback(
    (postId) => {
      addClosed(postId);        // Adds to Dexie → closedPostIds will update
      setSelectedPostId(null);
    },
    [addClosed, setSelectedPostId]
  );

  // ─── HOOK 15: Sort / filter / slice → pick at most 5 posts, in descending rating ───
  // My note: Is it better to filter closed posts in the backend or here? If in the backend, we could avoid sending them to the client, but that would require backend data processing. Wich would be most efficient/cost effective?
  const displayedPosts = React.useMemo(() => {
    // a) Sort all posts by rating descending (newest first if same rating)
    const sortedByRating = [...posts].sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
    );

    // b) Filter out any that have been closed (closedPostIds)
    const stillAlive = sortedByRating.filter((p) => !closedPostIds.has(p.id));

    // c) Keep only the top 5
    return stillAlive.slice(0, 5);
  }, [posts, closedPostIds]);

  // ─── NOW: Because _all_ of the hooks above have been called, React’s hook order is stable. ─
  //      We can safely short‐circuit rendering if the map library hasn’t loaded yet.

  if (!isLoaded) {
    return <div>Loading Map…</div>;
  }

  // ─── Final JSX: render the GoogleMap, the “new post” marker, and up to five displayedPosts ─
  return (
    <div>
      {/* ─── NAV BAR ────────────────────────────────────────── */}
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
        onClick={handleMapClick}  // click on “blank map” → place new‐post marker
        options={mapOptions}
      >
        {/* ─── 1) “Make a post” marker (for creating a new post) ─────────── */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={handleMarkerClickForNew}
          >
            <MakePostIcon />
          </AdvancedMarker>
        )}

        {/* ─── 2) InfoWindow for “MAKE_POST” mode (when user clicked blank map) ─── */}
        {markerLocation && isMakePostOpen && (
          <CustomInfoWindow
            map={map}
            position={markerLocation}
            mode={INFO_WINDOW_MODE.MAKE_POST}
            onClose={() => setIsMakePostOpen(false)}
            onSave={handleSaveCreatePost}
          />
        )}

        {/* ─── 3 & 4) For each of the (at most) five displayedPosts: render marker & InfoWindow ─ */}
        {displayedPosts.map((post) => {
          const isExpanded = selectedPostId === post.id;
          const mode       = isExpanded
            ? INFO_WINDOW_MODE.EXPANDED
            : INFO_WINDOW_MODE.MINIMIZED;

          console.log(
            '⏺ rendering post.id:', post.id,
            'rating:', post.rating,
            'category:', post.category,
            'selectedPostId:', selectedPostId,
            '→ isExpanded=', isExpanded ? 'YES' : 'no'
          );

          return (
            <React.Fragment key={post.id}>
              {/* a) Pin for this post */}
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

              {/* b) CustomInfoWindow (minimized or expanded) */}
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