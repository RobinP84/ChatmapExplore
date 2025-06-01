import { useQuery } from '@tanstack/react-query';
import * as PostService from '../services/postService';

// Make sure that, at the very root of your app (e.g. in index.jsx or App.jsx),
// you have something like:
//   import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
//   const queryClient = new QueryClient();
//   <QueryClientProvider client={queryClient}> … </QueryClientProvider>
//
// Otherwise useQuery() will not work.

export function useFirebasePosts(viewedArea) {
  return useQuery({
    queryKey: ['posts', viewedArea],
    queryFn: () => PostService.fetchPosts(viewedArea),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 2,
  });
}