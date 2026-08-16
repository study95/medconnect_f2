// WHY THIS FILE EXISTS:
// Doctors Page and Home Page both need to fetch doctors.
// Now powered by TanStack Query for automatic caching.
//
// KEY BEHAVIOR:
// - Query key includes params → auto-refetches when filters change
// - staleTime from global config → no refetch on back-navigation
// - Returns the SAME shape as before: { doctors, loading, error, pagination, refresh }
//   so no page code needs to change its destructuring.

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getDoctors } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'

function useDoctors(params = {}) {
  // Stable key: TanStack Query deep-compares objects,
  // so { search: 'a' } and { search: 'a' } are the same key.
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['doctors', params],
    queryFn: async () => {
      const res = await getDoctors(params)
      const raw = res.data

      // Handle both paginated and non-paginated responses
      if (raw?.data && Array.isArray(raw.data)) {
        return {
          doctors: raw.data,
          pagination: (raw.meta || raw.current_page) ? {
            currentPage: raw.current_page || raw.meta?.current_page,
            lastPage:    raw.last_page    || raw.meta?.last_page,
            total:       raw.total        || raw.meta?.total,
          } : null,
        }
      } else if (Array.isArray(raw)) {
        return { doctors: raw, pagination: null }
      }
      return { doctors: [], pagination: null }
    },
    // keepPreviousData: When switching pages, the OLD page data stays
    // visible until the NEW page loads. No content flash.
    placeholderData: keepPreviousData,
  })

  return {
    doctors: data?.doctors || [],
    loading: isLoading,
    fetching: isFetching,  // true during background refetch (page switch)
    error: isError ? getErrorMessage(error, 'ডাক্তারদের তথ্য লোড করা সম্ভব হয়নি।') : null,
    pagination: data?.pagination || null,
    refresh: refetch,
  }
}

export default useDoctors
