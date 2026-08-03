// Infinite scroll hook for hospitals.
// Backend now returns standard Laravel paginator directly:
// { data: [...], current_page, last_page, total, per_page, ... }

import { useInfiniteQuery } from '@tanstack/react-query'
import { getHospitals } from '../api/hospitalApi'

function useInfiniteHospitals(filters = {}) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['hospitals-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getHospitals({ ...filters, page: pageParam, per_page: 6 })
      const raw = res.data

      // Standard Laravel paginator: { data: [...], current_page, last_page, total }
      if (raw?.data && Array.isArray(raw.data)) {
        return {
          hospitals:   raw.data,
          currentPage: raw.current_page ?? pageParam,
          lastPage:    raw.last_page    ?? 1,
          total:       raw.total        ?? raw.data.length,
        }
      }

      // Fallback: direct array
      if (Array.isArray(raw)) {
        return { hospitals: raw, currentPage: 1, lastPage: 1, total: raw.length }
      }

      return { hospitals: [], currentPage: 1, lastPage: 1, total: 0 }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.lastPage) {
        return lastPage.currentPage + 1
      }
      return undefined // no more pages
    },
    staleTime: 2 * 60 * 1000, // 2 minutes — avoids redundant re-fetches
  })

  const hospitals = data?.pages.flatMap((p) => p.hospitals) || []
  const total     = data?.pages[0]?.total || 0

  return {
    hospitals,
    total,
    loading:      isLoading,
    fetchingNext: isFetchingNextPage,
    hasMore:      hasNextPage,
    fetchMore:    fetchNextPage,
    error:        isError ? (error?.message || 'Failed to load hospitals') : null,
    refresh:      refetch,
  }
}

export default useInfiniteHospitals
