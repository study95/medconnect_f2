import { useQuery } from '@tanstack/react-query'
import { searchUnified } from '../api/searchApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useSearch(params = {}) {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['unified-search', params],
    queryFn: async () => {
      const res = await searchUnified(params)
      return res.data?.data || null
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 10 * 60 * 1000,
  })

  return {
    results: data,
    type: data?.type || 'all',
    counts: data?.counts || { total: 0, doctors: 0, hospitals: 0, specialties: 0 },
    doctors: data?.doctors?.data || [],
    doctorMeta: data?.doctors?.meta || null,
    hospitals: data?.hospitals?.data || [],
    hospitalMeta: data?.hospitals?.meta || null,
    specialties: data?.specialties?.data || [],
    specialtyMeta: data?.specialties?.meta || null,
    loading: isLoading,
    fetching: isFetching,
    error: isError ? getErrorMessage(error, 'অনুসন্ধানের তথ্য লোড করা সম্ভব হয়নি।') : null,
    refetch,
  }
}
