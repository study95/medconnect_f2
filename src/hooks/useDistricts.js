// src/hooks/useDistricts.js
// WHY: Multiple pages (TopDoctorsPage, TopHospitalsPage) need a districts
// dropdown. Instead of each page doing raw axiosInstance.get('/districts'),
// this shared hook caches districts for 30 minutes via TanStack Query.
// Districts rarely change, so long cache = zero redundant API calls.

import { useQuery } from '@tanstack/react-query'
import { getDistricts } from '../api/locationApi'

export default function useDistricts(params = {}) {
  const { data, isLoading } = useQuery({
    queryKey: ['districts', params],
    queryFn: async () => {
      const res = await getDistricts(params)
      return res.data?.data?.data || res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes — districts rarely change
    gcTime: 60 * 60 * 1000,    // 1 hour cache retention
  })

  return {
    districts: data || [],
    loading: isLoading,
  }
}
