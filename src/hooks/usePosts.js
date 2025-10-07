// src/hooks/usePosts.js
import { useEffect } from "react";
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
  const query = useQuery({
    queryKey: ["posts", params], // changes only when you press Search
    queryFn: async ({ queryKey }) => {
      const [, p] = queryKey;
      if (!p || !p.bounds) {
        if (import.meta.env.DEV) console.info('[usePosts] queryFn skipped because params missing', p);
        return [];
      }
      // Adjust your service to accept { bounds, categories }
      const data = await PostService.fetchPosts(p);
      if (import.meta.env.DEV) console.info('[usePosts] queryFn received rows', Array.isArray(data) ? data.length : data);
      return Array.isArray(data) ? data : [];
    },
    enabled,
    keepPreviousData,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    refetchOnWindowFocus: false,
    // (We sync to IndexedDB via the side-effect below instead)
  });

  useEffect(() => {
    const rows = query.data;
    if (!Array.isArray(rows) || rows.length === 0) return;

    const sync = async () => {
      try {
        if (import.meta.env.DEV) {
          console.info('[usePosts] syncing posts to Dexie', rows.length);
        }
        await upsertPosts(rows);
      } catch (e) {
        console.error('Failed to persist posts to IndexedDB', e);
      }
    };

    sync();
  }, [query.data]);

  return query;
}
