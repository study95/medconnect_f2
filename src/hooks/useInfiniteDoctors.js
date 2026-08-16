// Infinite scroll version of useDoctors.
// Uses useInfiniteQuery to auto-fetch next pages as user scrolls.
// Per-page is fixed at 6.

import { useInfiniteQuery } from '@tanstack/react-query'
import { getDoctors } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'

function useInfiniteDoctors(filters = {}) {
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
    queryKey: ['doctors-infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await getDoctors({ ...filters, page: pageParam, per_page: 6 })
      const raw = res.data

      // Handle both paginated and non-paginated responses
      if (raw?.data && Array.isArray(raw.data)) {
        return {
          doctors: raw.data,
          currentPage: raw.current_page || raw.meta?.current_page || pageParam,
          lastPage:    raw.last_page    || raw.meta?.last_page    || 1,
          total:       raw.total        || raw.meta?.total        || raw.data.length,
        }
      } else if (Array.isArray(raw)) {
        return { doctors: raw, currentPage: 1, lastPage: 1, total: raw.length }
      }
      return { doctors: [], currentPage: 1, lastPage: 1, total: 0 }
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.currentPage < lastPage.lastPage) {
        return lastPage.currentPage + 1
      }
      return undefined // no more pages
    },
    staleTime: 2 * 60 * 1000, // 2 minutes – avoid redundant re-fetches
  })

  // Flatten all pages into one doctors array
  const doctors = data?.pages.flatMap((p) => p.doctors) || []
  const total   = data?.pages[0]?.total || 0

  return {
    doctors,
    total,
    loading: isLoading,
    fetchingNext: isFetchingNextPage,
    hasMore: hasNextPage,
    fetchMore: fetchNextPage,
    error: isError ? getErrorMessage(error, 'ডাক্তারদের তালিকা লোড করা সম্ভব হয়নি।') : null,
    refresh: refetch,
  }
}

export default useInfiniteDoctors
