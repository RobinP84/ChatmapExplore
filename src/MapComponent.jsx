// src/MapComponent.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader }           from '@react-google-maps/api';
import { INFO_WINDOW_MODE }                     from './constants/infoWindowModes';
import AdvancedMarker                           from './MarkerComponent';
import { useCreatePost }                        from './hooks/useCreatePost';
import { usePosts }                             from './hooks/usePosts';        // mock or Firebase
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
  // ─── 1) Load Google Maps JS API ──────────────────────────
  const { isLoaded } = useJsApiLoader({
    id:               import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ─── 2) Zustand (UI state) ────────────────────────────────
  // selectedPostId = the ID (string) of whichever post is currently expanded (or null)
  const selectedPostId    = useUIStore((s) => s.selectedPostId);
  const setSelectedPostId = useUIStore((s) => s.setSelectedPostId);

  // isMakePostOpen = whether we’re currently showing the “create a new post” form
  const isMakePostOpen    = useUIStore((s) => s.isMakePostOpen);
  const setIsMakePostOpen = useUIStore((s) => s.setIsMakePostOpen);

  // ─── 3) React local state ─────────────────────────────────
  const [map,            setMap]            = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [user,           setUser]           = useState(null);

  // ─── 4) Hard‐coded “viewed area” ─────────────────────────
  // (You can change these bounds however you like)
  const viewedArea = {
    southwest: { lat: -4.0, lng: -39.0 },
    northeast: { lat: -3.0, lng: -38.0 },
  };

  // ─── 5) Fetch posts via React Query (or your mock hook) ──
  const {
    data: rawPosts = [],      // raw array of posts (each has .rating, .categoryId, etc.)
    isLoading: loadingPosts,  // whether the query is in flight
    refetch: reloadPosts,     // manually trigger a re‐fetch
  } = usePosts(viewedArea);

  // ─── 6) Normalize each raw post in one pass ───────────────
  //     • Ensure `id` is a string
  //     • Turn integer categoryId → string category
  //
  //    (If `CATEGORY_ID_TO_NAME[p.categoryId]` is missing, we use 'default')
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

  // ─── 7) Dexie (IndexedDB) “closed posts” ───────────────────
  //    Every time a user closes an expanded InfoWindow, we call `addClosed(postId)`.
  //    Then `allHistory` contains records `{ postId: 'someId', … }`.
  //    We extract the set of `closedPostIds` so that they will no longer be shown.
  //
  const { allHistory, addClosed }     = useLocalHistory();
  const { allFavorites, addFavorite } = useLocalFavorites();

  const closedPostIds = React.useMemo(
    () => new Set(allHistory.map((h) => h.postId)),
    [allHistory]
  );

  // ─── 8) Hook to create a new post (unchanged) ─────────────
  const { createPost, loading: creating } = useCreatePost();

  // ─── 9) Firebase Auth listener ────────────────────────────
  useEffect(() => {
    return authService.onAuthStateChanged((u) => {
      setUser(u);
    });
  }, []);

  // ─── 10) Google Map callbacks ─────────────────────────────
  const onLoad    = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  // ─── 11) “Make a post” marker handlers ────────────────────
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
        category: 'default',  // or let user pick a real category
        userId:   user.uid,
      });
      reloadPosts();
      setIsMakePostOpen(false);
      setMarkerLocation(null);
    },
    [createPost, markerLocation, user, reloadPosts]
  );

  // ─── 12) “Toggle MINIMIZED ↔ EXPANDED” for an existing post ─
  const handleTogglePost = useCallback(
    (post) => {
      console.log('👆 Post clicked, post.id =', post.id);
      if (selectedPostId === post.id) {
        // Already expanded → collapse it
        setSelectedPostId(null);
      } else {
        // Minimized → expand it
        setSelectedPostId(post.id);
      }
    },
    [selectedPostId, setSelectedPostId]
  );

  // ─── 13) “Close an expanded InfoWindow” (mark as “closed forever”) ─
  const handleCloseInfoWindow = useCallback(
    (postId) => {
      addClosed(postId);        // record in Dexie → won’t show again
      setSelectedPostId(null);  // collapse it if it was expanded
    },
    [addClosed, setSelectedPostId]
  );

  if (!isLoaded) return <div>Loading Map…</div>;

  // ─── 14) Filter + sort + slice so that at most 5 are shown ─────────────
  //
  //   a) Sort all the normalized `posts` by `rating` descending:
  //      (you may need to adjust if `rating` is nested somewhere else)
  //   b) Filter out any whose `id` is in `closedPostIds`.
  //   c) Take `.slice(0, 5)` so that no more than 5 InfoWindows are rendered.
  //
  const displayedPosts = React.useMemo(() => {
    // (a) pure copy + sort by rating descending:
    const sortedByRating = [...posts].sort(
      (a, b) => (b.rating ?? 0) - (a.rating ?? 0)
    );

    // (b) filter out any that have been “closed”
    const stillAlive = sortedByRating.filter((p) => !closedPostIds.has(p.id));

    // (c) only show the top 5:
    return stillAlive.slice(0, 5);
  }, [posts, closedPostIds]);

  // ─── 15) Finally, render the map + markers + InfoWindows ────────────────
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
        {/* Re‐fetch from server (or mock) when clicked; disabled while loading */}
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
        onClick={handleMapClick} // click on empty map → place “new post” marker
        options={mapOptions}
      >
        {/* ─── 1) “Make a post” marker (new post) ─────────────────────────── */}
        {markerLocation && (
          <AdvancedMarker
            map={map}
            position={markerLocation}
            onClick={handleMarkerClickForNew}
          >
            <MakePostIcon />
          </AdvancedMarker>
        )}

        {/* ─── 2) InfoWindow for creating a post (MAKE_POST mode) ──────────── */}
        {markerLocation && isMakePostOpen && (
          <CustomInfoWindow
            map={map}
            position={markerLocation}
            mode={INFO_WINDOW_MODE.MAKE_POST}
            onClose={() => setIsMakePostOpen(false)}
            onSave={handleSaveCreatePost}
          />
        )}

        {/* ─── 3 & 4) For each of the (at most) 5 displayedPosts: render them ─── */}
        {displayedPosts.map((post) => {
          const isExpanded = selectedPostId === post.id;
          const mode       = isExpanded
            ? INFO_WINDOW_MODE.EXPANDED
            : INFO_WINDOW_MODE.MINIMIZED;

          // Figure out the border color for this post’s category:
          const borderHue = CATEGORY_COLORS[post.category] || CATEGORY_COLORS.default;

          console.log(
            '⏺ rendering post.id:', post.id,
            'rating:', post.rating,
            'category:', post.category,
            'selectedPostId:', selectedPostId,
            '→ isExpanded=', isExpanded ? 'YES' : 'no'
          );

          return (
            <React.Fragment key={post.id}>
              {/* a) Show the pin for this post */}
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

              {/* b) Show its CustomInfoWindow (either minimized or expanded) */}
              <CustomInfoWindow
                map={map}
                position={{
                  lat: post.postLocationLat,
                  lng: post.postLocationLong,
                }}
                post={post}
                mode={mode}
                category={post.category}       // e.g. "sports"
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