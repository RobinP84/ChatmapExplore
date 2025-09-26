// src/hooks/useCreatePost.js
import { useCallback, useState } from 'react';
import * as PostService from '../services/postService';
import { upsertPosts } from '../db';

export function useCreatePost() {
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(
    async ({ title, message, lat, lng, category, userId }) => {
      setLoading(true);
      try {
        const payload = {
          userId,
          title,
          message,
          category,
          postLocationLat:  lat,
          postLocationLong: lng,
        };
        const id = await PostService.insertPost(payload);
        // Optimistic local echo into IndexedDB for instant UI update
        if (id) await upsertPosts([{ id, ...payload }]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createPost, loading };
}
