import React from 'react';
import { useLocalHistory } from '../hooks/useLocalHistory';
import { useFirebasePosts } from '../hooks/useFirebasePosts';
import { db } from '../db';

export default function HistoryTab() {
  const { allHistory } = useLocalHistory();
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
      <h2>Viewed / Closed Posts</h2>
      {allHistory.length === 0 ? (
        <p>No closed posts yet.</p>
      ) : (
        <ul>
          {allHistory.map((hist) => {
            const post = postMap.get(hist.postId);
            return (
              <li key={hist.id} style={{ marginBottom: '1em' }}>
                {post ? (
                  <>
                    <strong>{post.title}</strong>{' '}
                    <em>({new Date(hist.closedAt).toLocaleString()})</em>
                    <button
                      style={{ marginLeft: '1em' }}
                      onClick={() => {
                        // Remove from history → re‐shows it on the map
                        db.history.where('postId').equals(hist.postId).delete();
                      }}
                    >
                      Re-open on Map
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