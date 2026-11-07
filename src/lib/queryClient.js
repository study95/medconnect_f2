// src/lib/queryClient.js
// Enterprise TanStack Query Configuration
// Provides centralized defaults and cache lifetime management across the entire application.

import { QueryClient, keepPreviousData } from '@tanstack/react-query'
import { getHomepage } from '../api/homepageApi'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,           // 5 minutes: Serve cache instantly without background hits
      gcTime: 30 * 60 * 1000,             // 30 minutes: Retain cache in memory across unmounts for instant 0ms render
      retry: 1,                           // 1 retry on network/server errors for swift error handling
      refetchOnWindowFocus: false,        // Prevents unnecessary background re-fetches on tab focus
      refetchOnReconnect: true,           // Automatically revalidates when internet recovers
      refetchOnMount: false,              // Prevents flash on back-navigation: serve memory cache instantly
      placeholderData: keepPreviousData,  // Retains previous data while fetching next page/filter (zero layout flash)
    },
    mutations: {
      retry: 0,                          // Prevents duplicate mutation execution on failure
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

export default queryClient
