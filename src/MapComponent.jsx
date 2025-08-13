// src/MapComponent.jsx
import React, { useState, useCallback, useEffect } from 'react';
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

  // ─── HOOK 6: live view bounds (used for fetching + filtering) ───────
  const [viewBounds, setViewBounds] = React.useState(null);

  const onLoad = useCallback((m) => {
    setMap(m);
    // Seed bounds immediately if available
    const b = m.getBounds?.();
    if (b) {
      setViewBounds({
        southwest: b.getSouthWest().toJSON(),
        northeast: b.getNorthEast().toJSON(),
      });
    }
  }, []);

  const onUnmount = useCallback(() => setMap(null), []);

  const handleIdle = React.useCallback(() => {
    if (!map) return;
    const b = map.getBounds?.();
    if (!b) return;
    setViewBounds({
      southwest: b.getSouthWest().toJSON(),
      northeast: b.getNorthEast().toJSON(),
    });
  }, [map]);

  // ─── HOOK 7: Fetch posts for the current bounds ─────────────────────
  // Ensure your usePosts hook handles null/undefined bounds (e.g., using React Query's enabled: !!bounds)
  const {
    data: rawPosts = [],
    isLoading: loadingPosts,
    refetch: reloadPosts,
  } = usePosts(viewBounds);

  // ─── HOOK 8: Normalize incoming posts ───────────────────────────────
  const posts = React.useMemo(() => {
    return rawPosts.map((p) => {
      const idStr = String(p.id);
      const categoryStr = CATEGORY_ID_TO_NAME[p.categoryId] || 'default';
      return {
        ...p,
        id: idStr,
        category: categoryStr,
      };
    });
  }, [rawPosts]);

  // ─── HOOK 9: Dexie (IndexedDB) history & favorites ──────────────────
  const { allHistory, addClosed } = useLocalHistory();
  const { allFavorites, addFavorite } = useLocalFavorites();

  const closedPostIds = React.useMemo(
    () => new Set(allHistory.map((h) => String(h.postId))),
    [allHistory]
  );

  // ─── HOOK 10: Create post ───────────────────────────────────────────
  const { createPost, loading: creating } = useCreatePost();

  // ─── HOOK 11: Auth listener ─────────────────────────────────────────
  useEffect(() => {
    return authService.onAuthStateChanged((u) => setUser(u));
  }, []);

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
      reloadPosts();
      setIsMakePostOpen(false);
      setMarkerLocation(null);
    },
    [createPost, markerLocation, user, reloadPosts]
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

  // ─── HOOK 14: Compute displayed posts (filter in-view → exclude closed → sort → slice) ─
  const displayedPosts = React.useMemo(() => {
    // 1) Only posts in the current viewport
    const inView = viewBounds
      ? posts.filter((p) =>
          isInBounds(Number(p.postLocationLat), Number(p.postLocationLong), viewBounds)
        )
      : posts;

    // 2) Exclude posts the user has closed
    const visibleAndOpen = inView.filter((p) => !closedPostIds.has(String(p.id)));

    // 3) Sort by rating, then createdAt (if present)
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

    // 4) Cap how many to show at once
    return sorted.slice(0, 5);
  }, [posts, viewBounds, closedPostIds]);

  // ─── Early out while the Maps JS API loads ──────────────────────────
  if (!isLoaded) {
    return <div>Loading Map…</div>;
  }

  // ─── Render ─────────────────────────────────────────────────────────
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
        <button onClick={reloadPosts} disabled={loadingPosts || creating}>
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