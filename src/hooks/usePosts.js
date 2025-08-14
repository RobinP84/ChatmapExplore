// src/hooks/usePosts.js
import { useQuery } from "@tanstack/react-query";
import * as PostService from "../services/postService";

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
      return PostService.fetchPosts(p);
    },
    enabled,
    keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: false,
  });
}