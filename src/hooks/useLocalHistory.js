import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useLocalHistory() {
  // allHistory is a live query of the `history` table, ordered by closedAt
  const allHistory = useLiveQuery(
    () => db.history.orderBy('closedAt').toArray(),
    []
  ) || [];

  // Add a `closed` entry if it doesn’t already exist
  const addClosed = async (postId) => {
    const existing = await db.history.where('postId').equals(postId).first();
    if (!existing) {
      await db.history.add({ postId, closedAt: new Date() });
    }
  };

  return { allHistory, addClosed };
}