// src/hooks/useDoctorDetail.js
// WHY: Extracts the doctor+chambers fetch from DoctorDetailPage.
// Cached by doctor ID — revisiting the same doctor = instant render.
// Uses useQuery for parallel fetching of doctor data and chambers.

import { useQuery } from '@tanstack/react-query'
import { getDoctorById, getDoctorChambers } from '../api/doctorApi'

export default function useDoctorDetail(id) {
  // Fetch doctor profile
  const doctorQuery = useQuery({
    queryKey: ['doctor', id],
    queryFn: async () => {
      const res = await getDoctorById(id)
      return res.data?.data || res.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch doctor chambers (schedule)
  const chambersQuery = useQuery({
    queryKey: ['doctor-chambers', id],
    queryFn: async () => {
      const res = await getDoctorChambers({ doctor_id: id })
      const d = res.data?.data || res.data || []
      // Filter to only this doctor's active chambers
      return (Array.isArray(d) ? d : []).filter(
        c => String(c.doctor_id) === String(id) && c.is_active !== false
      )
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    doctor: doctorQuery.data || null,
    chambers: chambersQuery.data || [],
    loading: doctorQuery.isLoading,
    loadingChambers: chambersQuery.isLoading,
    error: doctorQuery.isError
      ? (doctorQuery.error?.message || 'Failed to load doctor')
      : null,
    refetch: () => {
      doctorQuery.refetch()
      chambersQuery.refetch()
    },
  }
}
