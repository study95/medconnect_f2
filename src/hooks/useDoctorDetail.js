// src/hooks/useDoctorDetail.js
// WHY: Extracts the doctor+chambers fetch from DoctorDetailPage.
// Cached by doctor ID — revisiting the same doctor = instant render.
// Uses useQuery for parallel fetching of doctor data and chambers.

import { useQuery } from '@tanstack/react-query'
import { getDoctorById, getDoctorChambers } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'

import { useMemo } from 'react'

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

  const doctorData = doctorQuery.data

  // Fetch doctor chambers (schedule)
  const chambersQuery = useQuery({
    queryKey: ['doctor-chambers', id],
    queryFn: async () => {
      const res = await getDoctorChambers({ doctor_id: id })
      const d = res.data?.data || res.data || []
      const list = Array.isArray(d) ? d : []
      return list.filter(c => c.is_active !== false)
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  // Combine chambers from direct API or doctor relation
  const chambers = useMemo(() => {
    if (chambersQuery.data && chambersQuery.data.length > 0) {
      return chambersQuery.data
    }
    if (doctorData?.chambers && Array.isArray(doctorData.chambers) && doctorData.chambers.length > 0) {
      return doctorData.chambers.filter(c => c.is_active !== false)
    }
    return chambersQuery.data || []
  }, [chambersQuery.data, doctorData])

  return {
    doctor: doctorData || null,
    chambers: chambers || [],
    loading: doctorQuery.isLoading,
    loadingChambers: chambersQuery.isLoading,
    error: doctorQuery.isError
      ? getErrorMessage(doctorQuery.error, 'ডাক্তারের তথ্য লোড করা সম্ভব হয়নি।')
      : null,
    refetch: () => {
      doctorQuery.refetch()
      chambersQuery.refetch()
    },
  }
}
