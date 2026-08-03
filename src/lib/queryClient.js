// src/lib/queryClient.js
// WHY THIS FILE EXISTS:
// Centralized TanStack Query configuration. Every useQuery/useMutation
// in the app inherits these defaults. The key settings:
//
// staleTime (5 min): Data is "fresh" for 5 minutes after fetch.
//   → Navigating away and back WON'T trigger a refetch if < 5 min.
//   → This is the #1 trick for instant back-navigation.
//
// gcTime (10 min): Cached data lives in memory for 10 minutes.
//   → Even after a component unmounts, the cache persists.
//   → Re-mounting the component shows cached data immediately.
//
// refetchOnWindowFocus: false
//   → Prevents spamming the API every time the user switches tabs.

import { QueryClient } from '@tanstack/react-query'
import { getHomepage } from '../api/homepageApi'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // 5 minutes — data stays fresh
      gcTime: 10 * 60 * 1000,           // 10 minutes — cache retention
      retry: 1,                          // 1 retry on failure, then error
      refetchOnWindowFocus: false,       // Don't refetch on tab switch
      refetchOnReconnect: 'always',      // Do refetch on network reconnect
      refetchOnMount: false,             // Don't refetch if data is fresh
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
