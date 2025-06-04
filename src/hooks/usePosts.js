// src/hooks/usePosts.js
import { useQuery } from "@tanstack/react-query";
import * as PostService from "../services/postService";

export function usePosts(viewedArea) {
  return useQuery({
    queryKey: ["posts", viewedArea],               // ①
    queryFn: () => PostService.fetchPosts(viewedArea), // ②
    enabled: false,                                 // ③
    staleTime: 1000 * 60 * 5,                       // ④
    retry: 2,                                       // ⑤
    refetchOnWindowFocus: false,                    // ⑥
  });
}