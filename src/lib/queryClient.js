// src/lib/queryClient.js
// WHY THIS FILE EXISTS:
// Centralized TanStack Query configuration. Every useQuery/useMutation
// in the app inherits these defaults. The key settings:
//
// staleTime (5 min): Data is "fresh" for 5 minutes after fetch.
//   → Navigating away and back WON'T trigger a refetch if < 5 min.
//   → This is the #1 trick for instant back-navigation.
//
// gcTime (15 min): Cached data lives in memory for 15 minutes.
//   → Even after a component unmounts, the cache persists.
//   → Re-mounting the component shows cached data immediately.
//
// refetchOnWindowFocus: false
//   → Prevents spamming the API every time the user switches tabs.
//
// refetchOnMount: false
//   → If data is fresh, don't refetch when component mounts again.
//
// retry: 1 (not 3)
//   → Faster failure. Don't hammer a slow endpoint 3x.

import { QueryClient, keepPreviousData } from '@tanstack/react-query'
import { getHomepage } from '../api/homepageApi'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes — data stays fresh
      gcTime: 15 * 60 * 1000,          // 15 minutes — cache retention (up from 10)
      retry: 1,                         // 1 retry on failure, then error
      refetchOnWindowFocus: false,      // Don't refetch on tab switch
      refetchOnReconnect: 'always',     // Do refetch on network reconnect
      refetchOnMount: false,            // Don't refetch if data is fresh
      // keepPreviousData while new data loads → no content flash on filter change
      placeholderData: keepPreviousData,
    },
    mutations: {
      retry: 0, // mutations should never auto-retry (prevent duplicate form submits)
    },
  },
})

// Prefetch homepage data to make first load or navigation instant
export const prefetchHomepage = () => {
  queryClient.prefetchQuery({
    queryKey: ['homepage'],
    queryFn: async () => {
      const res = await getHomepage()
      return res.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
