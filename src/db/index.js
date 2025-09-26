// src/db/index.js
import Dexie, { liveQuery } from 'dexie';

export const db = new Dexie('MyAppDB');

// v1: history + favorites
// v2: add posts store for caching fetched posts
db.version(1).stores({
  history:   '++id, postId, closedAt',     // closed / viewed posts
  favorites: '++id, postId, favoritedAt',  // user-favorited posts
});

db.version(2).stores({
  history:   '++id, postId, closedAt',
  favorites: '++id, postId, favoritedAt',
  // Primary key: id (string from server). Index lat to enable efficient range queries,
  // additional indexes assist local filtering/sorting.
  posts: 'id, postLocationLat, postLocationLong, category, categoryId, createdAt, rating',
});

// --- Helpers for posts cache ---

function toNumberOrNull(v) {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Upsert an array of posts into IndexedDB. */
export async function upsertPosts(posts) {
  if (!Array.isArray(posts) || posts.length === 0) return;
  const normalized = posts.map((p) => ({
    ...p,
    // Ensure lat/lng are numbers so our indexed range queries work reliably
    postLocationLat: toNumberOrNull(p.postLocationLat),
    postLocationLong: toNumberOrNull(p.postLocationLong),
  }));
  await db.table('posts').bulkPut(normalized);
}

function lngInRange(lng, west, east) {
  return west <= east ? (lng >= west && lng <= east) : (lng >= west || lng <= east);
}

/** Live query posts in bounds (and optional categories). */
export function livePostsInBounds(bounds, categories = null) {
  if (!bounds) return liveQuery(async () => []);

  const { southwest, northeast } = bounds;
  const swLat = Number(southwest.lat);
  const neLat = Number(northeast.lat);
  const swLng = Number(southwest.lng);
  const neLng = Number(northeast.lng);

  return liveQuery(async () => {
    // Narrow by latitude first via index, then filter by longitude in JS
    const latSlice = await db.table('posts')
      .where('postLocationLat')
      .between(Math.min(swLat, neLat), Math.max(swLat, neLat), true, true)
      .toArray();

    let result = latSlice.filter((p) =>
      lngInRange(Number(p.postLocationLong), swLng, neLng)
    );

    if (Array.isArray(categories) && categories.length) {
      const set = new Set(categories);
      result = result.filter((p) => set.has(p.category) || set.has(p.categoryId));
    }

    return result;
  });
}
