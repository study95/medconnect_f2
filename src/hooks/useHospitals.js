// WHY THIS FILE EXISTS:
// All hospital listing data fetching in one hook.
// Now powered by TanStack Query for automatic caching.
// Same return shape as before: { hospitals, loading, error, pagination, refresh }

import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { getHospitals } from '../api/hospitalApi'

function useHospitals(params = {}) {
  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['hospitals', params],
    queryFn: async () => {
      const res = await getHospitals(params)
      const raw = res.data

      // Handle multiple possible backend response shapes
      let items = []
      let paginationData = null

      // If the response is wrapped in { success: true, data: { ... } }
      if (raw?.success && raw?.data) {
        if (Array.isArray(raw.data)) {
          items = raw.data
        } else if (raw.data.data && Array.isArray(raw.data.data)) {
          items = raw.data.data
          paginationData = raw.data
        }
      } 
      // Standard Laravel pagination { data: [...], current_page: ... }
      else if (raw?.data && Array.isArray(raw.data)) {
        items = raw.data
        paginationData = raw
      } 
      // Direct array [...]
      else if (Array.isArray(raw)) {
        items = raw
      }

      return {
        hospitals: items,
        pagination: (paginationData?.meta || paginationData?.current_page) ? {
          currentPage: paginationData.current_page || paginationData.meta?.current_page,
          lastPage:    paginationData.last_page    || paginationData.meta?.last_page,
          total:       paginationData.total        || paginationData.meta?.total,
        } : null,
      }
    },
    placeholderData: keepPreviousData,
  })

  return {
    hospitals: data?.hospitals || [],
    loading: isLoading,
    fetching: isFetching,
    error: isError ? (error?.message || 'Failed to load hospitals') : null,
    pagination: data?.pagination || null,
    refresh: refetch,
  }
}

export default useHospitals
