// src/MapComponent.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { INFO_WINDOW_MODE } from './constants/infoWindowModes';
import AdvancedMarker from './MarkerComponent';
import { useCreatePost } from './hooks/useCreatePost';
import { usePosts } from './hooks/usePosts';
import { useLocalHistory } from './hooks/useLocalHistory';
import { useLocalFavorites } from './hooks/useLocalFavorites';
import { useUIStore } from './store/uiStore';
import { MakePostIcon, PostMarkerIcon } from './Components/CustomMarkerIcon';
import LoginButton from './Components/loginButtonComponent';
import authService from './firebase/firebaseAuth';
import CustomInfoWindow from './Components/CustomInfoWindow';
import { CATEGORY_ID_TO_NAME } from './constants/categoryMap';

const containerStyle = { width: '375px', height: '812px' };
const initialCenter = { lat: 59.3293, lng: 18.0686 };
const libraries = ['marker'];
const mapOptions = {
  disableDefaultUI: true,
  clickableIcons: false,
  mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID,
  gestureHandling: 'greedy',
};

// Cooldown after pressing Search (ms)
const SEARCH_COOLDOWN_MS = 800;

/* === Bounds helpers (top-level) === */
function lngInRange(lng, west, east) {
  return west <= east ? (lng >= west && lng <= east) : (lng >= west || lng <= east);
}
function isInBounds(lat, lng, { southwest, northeast }) {
  return (
    lat >= southwest.lat &&
    lat <= northeast.lat &&
    lngInRange(lng, southwest.lng, northeast.lng)
  );
}

function MapComponent() {
  // ─── HOOK 1: load Google Maps JS API ────────────────────────────────
  const { isLoaded } = useJsApiLoader({
    id: import.meta.env.VITE_GOOGLE_MAPS_API_ID,
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ─── HOOK 2: Zustand UI ─────────────────────────────────────────────
  const selectedPostId = useUIStore((s) => s.selectedPostId);
  const setSelectedPostId = useUIStore((s) => s.setSelectedPostId);
  const isMakePostOpen = useUIStore((s) => s.isMakePostOpen);
  const setIsMakePostOpen = useUIStore((s) => s.setIsMakePostOpen);

  // ─── HOOKs 3–5: local state ─────────────────────────────────────────
  const [map, setMap] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [user, setUser] = useState(null);

  // ─── HOOK 6: live vs frozen bounds ──────────────────────────────────
  // liveBounds  → updates on every pan/zoom (drives on-screen filtering)
  // queryBounds → frozen snapshot used for server fetch (changes only on Search)
  const [liveBounds, setLiveBounds] = useState(null);
  const [queryBounds, setQueryBounds] = useState(null);

  // Category filter for searches (wire your real UI into this later)
  // null/undefined means "all categories"
  const [categoryFilter, setCategoryFilter] = useState(null);

  // Cooldown tracking for the Search button
  const [isCoolingDown, setIsCoolingDown] = useState(false);
  const pendingRefetch = useRef(false);
  const cooldownTimerRef = useRef(null);

  const onLoad = useCallback((m) => {
    setMap(m);
    const b = m.getBounds?.();
    if (b) {
      setLiveBounds({
        southwest: b.getSouthWest().toJSON(),
        northeast: b.getNorthEast().toJSON(),
      });
    }
  }, []);

  const onUnmount = useCallback(() => setMap(null), []);

  const handleIdle = useCallback(() => {
    if (!map) return;
    const b = map.getBounds?.();
    if (!b) return;
    setLiveBounds({
      southwest: b.getSouthWest().toJSON(),
      northeast: b.getNorthEast().toJSON(),
    });
  }, [map]);

  // ─── HOOK 7: Fetch posts for the *frozen* params only (manual trigger) ─
  const {
    data: rawPosts = [],
    isLoading: loadingPosts,
    isFetching, // fetching state after initial load
    refetch: refetchPosts,
  } = usePosts(
    queryBounds ? { bounds: queryBounds, categories: categoryFilter } : null,
    { enabled: false, keepPreviousData: true }
  );

  // When frozen params change (set by Search), run the fetch exactly once
  useEffect(() => {
    if (pendingRefetch.current && queryBounds) {
      pendingRefetch.current = false;
      refetchPosts();
    }
  }, [queryBounds, refetchPosts]);

  useEffect(() => () => clearTimeout(cooldownTimerRef.current), []);

  // ─── HOOK 8: Normalize incoming posts ───────────────────────────────
  const posts = React.useMemo(() => {
    return (rawPosts || []).map((p) => ({
      ...p,
      id: String(p.id),
      category: CATEGORY_ID_TO_NAME?.[p.categoryId] || 'default',
    }));
  }, [rawPosts]);

  // ─── HOOK 9: Dexie (IndexedDB) history & favorites ──────────────────
  // NOTE: These hooks indicate IndexedDB (Dexie) IS used in your project already.
  // They persist "closed posts" and "favorites".
  const { allHistory, addClosed } = useLocalHistory();
  const { allFavorites, addFavorite } = useLocalFavorites();

  const closedPostIds = React.useMemo(
    () => new Set(allHistory.map((h) => String(h.postId))),
    [allHistory]
  );

  // ─── HOOK 10: Create post ───────────────────────────────────────────
  const { createPost, loading: creating } = useCreatePost();

  // ─── HOOK 11: Auth listener ─────────────────────────────────────────
  useEffect(() => authService.onAuthStateChanged((u) => setUser(u)), []);

  // ─── HOOK 12: Map interactions ──────────────────────────────────────
  const handleMapClick = useCallback(
    (e) => {
      setMarkerLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      setIsMakePostOpen(false);
    },
    [setIsMakePostOpen]
  );

  const handleMarkerClickForNew = useCallback(() => setIsMakePostOpen(true), [setIsMakePostOpen]);

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
      // re-fetch only if a search area has been frozen previously
      if (queryBounds) refetchPosts();
      setIsMakePostOpen(false);
      setMarkerLocation(null);
    },
    [createPost, markerLocation, user, queryBounds, refetchPosts]
  );

  // ─── HOOK 13: Post expand/minimize/close ────────────────────────────
  const handleTogglePost = useCallback(
    (post) => {
      if (selectedPostId === post.id) setSelectedPostId(null);
      else setSelectedPostId(post.id);
    },
    [selectedPostId, setSelectedPostId]
  );

  const handleCloseInfoWindow = useCallback(
    (postId) => {
      addClosed(postId);
      setSelectedPostId(null);
    },
    [addClosed, setSelectedPostId]
  );

  // ─── HOOK 14: Compute displayed posts (local filtering every pan) ───
  const displayedPosts = React.useMemo(() => {
    const base = posts;

    // Filter by current viewport locally (no server call)
    const inView = liveBounds
      ? base.filter((p) =>
          isInBounds(Number(p.postLocationLat), Number(p.postLocationLong), liveBounds)
        )
      : base;

    // Optionally filter by currently chosen categories locally too
    const byCategory = Array.isArray(categoryFilter) && categoryFilter.length
      ? inView.filter((p) => categoryFilter.includes(p.category))
      : inView;

    // Exclude closed
    const visibleAndOpen = byCategory.filter((p) => !closedPostIds.has(String(p.id)));

    // Sort by rating, tie-breaker createdAt
    const toTime = (v) => {
      if (!v) return 0;
      const t = typeof v === 'number' ? v : new Date(v).getTime();
      return Number.isFinite(t) ? t : 0;
    };
    const sorted = [...visibleAndOpen].sort((a, b) => {
      const dr = (b.rating ?? 0) - (a.rating ?? 0);
      if (dr !== 0) return dr;
      return toTime(b.createdAt) - toTime(a.createdAt);
    });

    return sorted.slice(0, 5);
  }, [posts, liveBounds, categoryFilter, closedPostIds]);

  // ─── SEARCH button behavior ─────────────────────────────────────────
  const onSearch = useCallback(() => {
    if (!liveBounds || isCoolingDown || loadingPosts || isFetching) return;

    // Freeze the current viewport and categories for the query
    setQueryBounds(liveBounds);
    // if you add UI to set categories, ensure categoryFilter is updated before this line
    // (we already read it directly from state)
    pendingRefetch.current = true;

    // Start cooldown
    setIsCoolingDown(true);
    clearTimeout(cooldownTimerRef.current);
    cooldownTimerRef.current = setTimeout(() => setIsCoolingDown(false), SEARCH_COOLDOWN_MS);
  }, [liveBounds, isCoolingDown, loadingPosts, isFetching]);

  const searchDisabled = !liveBounds || isCoolingDown || loadingPosts || isFetching || creating;
  const searchIconStyle = searchDisabled ? { filter: 'grayscale(1)', opacity: 0.5 } : undefined;

  // ─── Early out while the Maps JS API loads ──────────────────────────
  if (!isLoaded) {
    return <div>Loading Map…</div>;
  }

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
        <button onClick={onSearch} disabled={searchDisabled} title={isCoolingDown ? 'Please wait…' : 'Search'}>
          <svg width={32} height={32} aria-hidden="true" style={searchIconStyle}>
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
        onClick={handleMapClick}
        onIdle={handleIdle}
        options={mapOptions}
      >
        {/* 1) Marker for creating a new post */}
        {markerLocation && (
          <AdvancedMarker map={map} position={markerLocation} onClick={handleMarkerClickForNew}>
            <MakePostIcon />
          </AdvancedMarker>
        )}

        {/* 2) InfoWindow for creating a new post */}
        {markerLocation && isMakePostOpen && (
          <CustomInfoWindow
            map={map}
            position={markerLocation}
            mode={INFO_WINDOW_MODE.MAKE_POST}
            onClose={() => setIsMakePostOpen(false)}
            onSave={handleSaveCreatePost}
          />
        )}

        {/* 3) Render markers + info windows for displayed posts */}
        {displayedPosts.map((post) => {
          const isExpanded = selectedPostId === post.id;
          const mode = isExpanded ? INFO_WINDOW_MODE.EXPANDED : INFO_WINDOW_MODE.MINIMIZED;

          return (
            <React.Fragment key={post.id}>
              <AdvancedMarker
                map={map}
                position={{ lat: post.postLocationLat, lng: post.postLocationLong }}
                onClick={() => handleTogglePost(post)}
              >
                <PostMarkerIcon />
              </AdvancedMarker>

              <CustomInfoWindow
                map={map}
                position={{ lat: post.postLocationLat, lng: post.postLocationLong }}
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