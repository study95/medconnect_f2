// src/lib/queryClient.js
// Enterprise TanStack Query Configuration
// Provides centralized defaults and cache lifetime management across the entire application.

import { QueryClient, keepPreviousData } from '@tanstack/react-query'
import { getHomepage } from '../api/homepageApi'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,          // 5 minutes: Data considered fresh, eliminates redundant fetches
      gcTime: 30 * 60 * 1000,            // 30 minutes: Cache retention in memory across unmounts
      retry: 2,                          // 2 retries on network/server errors
      refetchOnWindowFocus: false,        // Prevents excessive API calls on browser tab switching
      refetchOnReconnect: true,          // Automatically revalidates when network recovers
      refetchOnMount: false,              // Reuses fresh cache immediately without blocking UI
      placeholderData: keepPreviousData,  // Prevents UI flashing during pagination and filter changes
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
