import { useEffect, useMemo, useState } from 'react';
import { livePostsInBounds } from '../db';

/**
 * Returns posts from IndexedDB that match current bounds/categories.
 * Updates live whenever the DB changes (e.g., after a Search fetch upserts posts).
 */
export function useLocalPosts(bounds, categories) {
  const [posts, setPosts] = useState([]);

  // Stable key for categories array dependency
  const catsKey = useMemo(
    () => (Array.isArray(categories) ? categories.join('|') : ''),
    [categories]
  );

  useEffect(() => {
    const sub = livePostsInBounds(bounds, categories).subscribe({
      next: (rows) => setPosts(rows),
      error: (err) => {
        console.error('livePostsInBounds error', err);
        setPosts([]);
      },
    });
    return () => sub.unsubscribe();
  }, [bounds, catsKey]);

  return posts;
}

export default useLocalPosts;

