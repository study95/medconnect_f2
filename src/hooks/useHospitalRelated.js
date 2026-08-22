// src/hooks/useHospitalRelated.js
import { useQuery } from '@tanstack/react-query'
import { getHospitalRelated } from '../api/hospitalApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useHospitalRelated(identifier) {
  const isEnabled = Boolean(identifier)

  const query = useQuery({
    queryKey: ['hospital-related', identifier],
    queryFn: async () => {
      const res = await getHospitalRelated(identifier)
      return res.data?.data || res.data || {}
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  })

  return {
    doctors: query.data?.doctors || [],
    relatedHospitals: query.data?.related_hospitals || [],
    specialties: query.data?.specialties || [],
    districtLink: query.data?.district_link || '',
    districtName: query.data?.district_name || '',
    upazilaLink: query.data?.upazila_link || '',
    upazilaName: query.data?.upazila_name || '',
    loading: query.isLoading,
    error: query.isError ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}
