import React from 'react';
import { useLocalFavorites } from '../hooks/useLocalFavorites';
import { useFirebasePosts } from '../hooks/useFirebasePosts';

export default function FavoritesTab() {
  const { allFavorites, removeFavorite } = useLocalFavorites();
  // Passing null (or {}) fetches all posts. Adjust as needed.
  const { data: posts = [] } = useFirebasePosts(null);

  // Build a lookup from postId → post object
  const postMap = React.useMemo(() => {
    const m = new Map();
    posts.forEach((p) => m.set(p.id, p));
    return m;
  }, [posts]);

  return (
    <div>
      <h2>Favorites</h2>
      {allFavorites.length === 0 ? (
        <p>No favorites yet.</p>
      ) : (
        <ul>
          {allFavorites.map((fav) => {
            const post = postMap.get(fav.postId);
            return (
              <li key={fav.id} style={{ marginBottom: '1em' }}>
                {post ? (
                  <>
                    <strong>{post.title}</strong>{' '}
                    <em>({new Date(fav.favoritedAt).toLocaleString()})</em>
                    <button
                      style={{ marginLeft: '1em' }}
                      onClick={() => removeFavorite(fav.postId)}
                    >
                      Unfavorite
                    </button>
                  </>
                ) : (
                  <em>Post no longer available</em>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}