import Dexie from 'dexie';

export const db = new Dexie('MyAppDB');
db.version(1).stores({
  history:   '++id, postId, closedAt',     // closed / viewed posts
  favorites: '++id, postId, favoritedAt',   // user‐favorited posts
});