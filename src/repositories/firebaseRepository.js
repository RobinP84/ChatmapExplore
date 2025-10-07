// src/repositories/firebaseRepository.js
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  where,
  query,
  GeoPoint,
} from "firebase/firestore";
import { firebaseApp } from "../firebase/firebaseConfig";
import { encodeGeohash } from "../utils/geohash";

const db = getFirestore(firebaseApp);

function lngInRange(lng, west, east) {
  return west <= east ? (lng >= west && lng <= east) : (lng >= west || lng <= east);
}

/**
 * Fetch posts with optional bounds/categories params.
 * For now, we apply a latitude range on Firestore and filter longitude client-side.
 * If no params supplied, fetch all.
 *
 * params = {
 *   bounds: { southwest:{lat,lng}, northeast:{lat,lng} },
 *   categories: null | string[]
 * }
 */
export async function fetchPosts(params) {
  if (import.meta.env.DEV) {
    console.info('[firebaseRepository] fetchPosts called with params', params);
  }
  const postsRef = collection(db, "posts");

  if (params?.bounds) {
    const { southwest, northeast } = params.bounds;
    const minLat = Math.min(Number(southwest.lat), Number(northeast.lat));
    const maxLat = Math.max(Number(southwest.lat), Number(northeast.lat));
    const swLng = Number(southwest.lng);
    const neLng = Number(northeast.lng);

    try {
      // Latitude band query to reduce read volume; requires index on postLocationLat
      const q = query(
        postsRef,
        where('postLocationLat', '>=', minLat),
        where('postLocationLat', '<=', maxLat)
      );
      const snapshot = await getDocs(q);
      let rows = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      // Client-side filters for longitude and categories
      rows = rows.filter((p) => lngInRange(Number(p.postLocationLong), swLng, neLng));
      if (Array.isArray(params.categories) && params.categories.length) {
        const set = new Set(params.categories);
        rows = rows.filter((p) => set.has(p.category) || set.has(p.categoryId));
      }
      return rows;
    } catch (e) {
      console.warn('Bounds query failed; falling back to full collection fetch', e);
      // fall through to full fetch below
    }
  }

  // Fallback: fetch all posts
  const snapshot = await getDocs(postsRef);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function insertPost(postData) {
  const postsRef = collection(db, "posts");

  const lat = Number(postData.postLocationLat ?? postData.lat);
  const lng = Number(postData.postLocationLong ?? postData.lng);
  const geohash = Number.isFinite(lat) && Number.isFinite(lng) ? encodeGeohash(lat, lng, 9) : null;

  const dataToSend = {
    ...postData,
    // Ensure canonical fields exist for querying
    postLocationLat: Number.isFinite(lat) ? lat : postData.postLocationLat,
    postLocationLong: Number.isFinite(lng) ? lng : postData.postLocationLong,
    geo: Number.isFinite(lat) && Number.isFinite(lng) ? new GeoPoint(lat, lng) : undefined,
    geohash: geohash || undefined,
    added: serverTimestamp(),
  };

  const docRef = await addDoc(postsRef, dataToSend);
  return docRef.id;
}
