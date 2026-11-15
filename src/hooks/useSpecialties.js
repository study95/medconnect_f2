// src/hooks/useSpecialties.js
// WHY: Specialties rarely change. By caching for 30 min,
// we avoid refetching on every DoctorsPage visit.
// Previously fetched inside DoctorsPage with raw useEffect.

import { useQuery } from '@tanstack/react-query'
import { getSpecialties } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useSpecialties() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const res = await getSpecialties()
      return res.data?.data || res.data || []
    },
    staleTime: 2 * 60 * 1000,  // 2 minutes — fresh data on navigation
    gcTime: 30 * 60 * 1000,    // 30 min cache retention
  })

  return {
    specialties: data || [],
    loading: isLoading,
    error: isError ? getErrorMessage(error, 'বিশেষজ্ঞ বিভাগের তথ্য লোড করা সম্ভব হয়নি।') : null,
  }
}
