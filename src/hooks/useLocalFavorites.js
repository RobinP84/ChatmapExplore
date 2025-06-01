import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useLocalFavorites() {
  // allFavorites is a live query of `favorites`, ordered by favoritedAt
  const allFavorites = useLiveQuery(
    () => db.favorites.orderBy('favoritedAt').toArray(),
    []
  ) || [];

  // Add to favorites if not already favorited
  const addFavorite = async (postId) => {
    const existing = await db.favorites.where('postId').equals(postId).first();
    if (!existing) {
      await db.favorites.add({ postId, favoritedAt: new Date() });
    }
  };

  // Remove a favorite
  const removeFavorite = async (postId) => {
    await db.favorites.where('postId').equals(postId).delete();
  };

  return { allFavorites, addFavorite, removeFavorite };
}