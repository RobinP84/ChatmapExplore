// src/hooks/useCreatePost.js
import { useCallback, useState } from 'react';
import * as PostService from '../services/postService';

export function useCreatePost() {
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(
    async ({ title, message, lat, lng, category, userId }) => {
      setLoading(true);
      try {
        await PostService.insertPost({
          userId,
          title,
          message,
          category,
          postLocationLat:  lat,
          postLocationLong: lng,
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createPost, loading };
}