// src/hooks/useDoctorDetail.js
// WHY: Extracts doctor profile + chambers fetching for DoctorDetailPage.
// Supports both canonical SEO route (/doctors/:district/:upazila/:slug) and legacy route (/doctors/:id).

import { useQuery } from '@tanstack/react-query'
import { getDoctorBySlug, getDoctorById, getDoctorChambers } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'
import { useMemo } from 'react'

export default function useDoctorDetail(params) {
  // Support both object params { district, upazila, slug, id } and legacy single id string/number
  const { district, upazila, slug, id } = typeof params === 'object' && params !== null
    ? params
    : { id: params }

  const isSlugRoute = Boolean(district && upazila && slug)
  const isIdRoute = Boolean(id && !isSlugRoute)
  const isEnabled = isSlugRoute || isIdRoute

  // 1. Fetch doctor profile
  const doctorQuery = useQuery({
    queryKey: isSlugRoute ? ['doctor', district, upazila, slug] : ['doctor', id],
    queryFn: async () => {
      const res = isSlugRoute
        ? await getDoctorBySlug(district, upazila, slug)
        : await getDoctorById(id)
      return res.data?.data || res.data
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  })

  const doctorData = doctorQuery.data
  const doctorIdentifier = doctorData?.id || doctorData?.public_id || id

  // 2. Fetch doctor chambers (schedule)
  const chambersQuery = useQuery({
    queryKey: ['doctor-chambers', doctorIdentifier],
    queryFn: async () => {
      const res = await getDoctorChambers({ doctor_id: doctorIdentifier })
      const d = res.data?.data || res.data || []
      const list = Array.isArray(d) ? d : []
      return list.filter(c => c.is_active !== false)
    },
    enabled: Boolean(doctorIdentifier),
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
