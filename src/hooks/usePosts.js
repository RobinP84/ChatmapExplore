// src/hooks/usePosts.js
import { useQuery } from "@tanstack/react-query";
import * as PostService from "../services/postService";
import { upsertPosts } from "../db";

/**
 * Fetch posts for frozen params ({ bounds, categories }).
 * - bounds: { southwest:{lat,lng}, northeast:{lat,lng} }
 * - categories: null | string[] of normalized category names/ids your API accepts
 *
 * The query is disabled by default; call `refetch()` after setting params.
 */
export function usePosts(params, { enabled = false, keepPreviousData = true } = {}) {
  return useQuery({
    queryKey: ["posts", params], // changes only when you press Search
    queryFn: async ({ queryKey }) => {
      const [, p] = queryKey;
      if (!p || !p.bounds) return [];
      // Adjust your service to accept { bounds, categories }
      const data = await PostService.fetchPosts(p);
      return Array.isArray(data) ? data : [];
    },
    enabled,
    keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: false,
    // Persist fetched posts locally so UI can render from IndexedDB
    onSuccess: async (rows) => {
      try {
        await upsertPosts(rows);
      } catch (e) {
        console.error('Failed to persist posts to IndexedDB', e);
      }
    },
  });
}
