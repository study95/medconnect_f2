// src/hooks/useSpecialties.js
// WHY: Specialties rarely change. By caching for 30 min,
// we avoid refetching on every DoctorsPage visit.
// Previously fetched inside DoctorsPage with raw useEffect.

import { useQuery } from '@tanstack/react-query'
import { getSpecialties } from '../api/doctorApi'

export default function useSpecialties() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['specialties'],
    queryFn: async () => {
      const res = await getSpecialties()
      return res.data?.data || res.data || []
    },
    staleTime: 30 * 60 * 1000, // 30 minutes — specialties rarely change
    gcTime: 60 * 60 * 1000,    // 1 hour cache retention
  })

  return {
    specialties: data || [],
    loading: isLoading,
    error: isError ? (error?.message || 'Failed to load specialties') : null,
  }
}
