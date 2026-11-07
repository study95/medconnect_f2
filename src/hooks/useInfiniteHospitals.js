// Infinite scroll hook for hospitals.
// Backend now returns standard Laravel paginator directly:
// { data: [...], current_page, last_page, total, per_page, ... }

import { useInfiniteQuery } from '@tanstack/react-query'
import { getHospitals } from '../api/hospitalApi'
import { getErrorMessage } from '../utils/errorHelper'

function useInfiniteHospitals(filters = {}) {
  const {
    data,
    isLoading,
    isFetching,
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
    staleTime: 5 * 60 * 1000, // 5 minutes — avoids redundant re-fetches
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  })

  const hospitals = data?.pages.flatMap((p) => p.hospitals) || []
  const total     = data?.pages[0]?.total || 0

  return {
    hospitals,
    total,
    // Instant Back Navigation: only trigger full loading skeleton if no cached items exist
    loading:      (isLoading || (isFetching && !isFetchingNextPage)) && hospitals.length === 0,
    isBackgroundFetching: isFetching && !isFetchingNextPage && hospitals.length > 0,
    fetchingNext: isFetchingNextPage,
    hasMore:      hasNextPage,
    fetchMore:    fetchNextPage,
    error:        isError ? getErrorMessage(error, 'হাসপাতালের তালিকা লোড করা সম্ভব হয়নি।') : null,
    refresh:      refetch,
  }
}

export default useInfiniteHospitals
