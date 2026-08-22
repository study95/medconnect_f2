// src/hooks/useDoctorRelated.js
import { useQuery } from '@tanstack/react-query'
import { getDoctorRelated } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useDoctorRelated(identifier) {
  const isEnabled = Boolean(identifier)

  const query = useQuery({
    queryKey: ['doctor-related', identifier],
    queryFn: async () => {
      const res = await getDoctorRelated(identifier)
      return res.data?.data || res.data || {}
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  })

  return {
    relatedDoctors: query.data?.related_doctors || [],
    hospitals: query.data?.hospitals || [],
    specialtyLink: query.data?.specialty_link || '',
    specialtyName: query.data?.specialty_name || '',
    districtLink: query.data?.district_link || '',
    districtName: query.data?.district_name || '',
    upazilaLink: query.data?.upazila_link || '',
    upazilaName: query.data?.upazila_name || '',
    loading: query.isLoading,
    error: query.isError ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  }
}
