// src/hooks/usePosts.js
import { useState, useEffect, useCallback } from "react";
import * as PostRepository from "../services/postRepository";

export function usePosts(viewedArea) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedPosts = await PostRepository.fetchPosts(viewedArea);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
    } finally {
      setLoading(false);
    }
  }, [viewedArea]);

  useEffect(() => {
    if (viewedArea) {
      loadPosts();
    }
  }, [loadPosts, viewedArea]);

  return { posts, loading, reloadPosts: loadPosts };
}