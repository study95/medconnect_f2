// src/hooks/useDoctorDetail.js
// WHY: Extracts doctor profile + chambers fetching for DoctorDetailPage.
// DoctorResource provides the doctor profile with precomputed chambers and grouped_chambers as SSOT.
// Supports both canonical SEO route (/doctors/:district/:upazila/:slug) and legacy route (/doctors/:id).

import { useQuery } from '@tanstack/react-query'
import { getDoctorBySlug, getDoctorById } from '../api/doctorApi'
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

  // 1. Fetch doctor profile (includes precomputed chambers & grouped_chambers as SSOT)
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

  const chambers = useMemo(() => {
    if (doctorData?.chambers && Array.isArray(doctorData.chambers)) {
      return doctorData.chambers.filter(c => c.is_active !== false)
    }
    return []
  }, [doctorData?.chambers])

  const groupedChambers = useMemo(() => {
    if (doctorData?.grouped_chambers && Array.isArray(doctorData.grouped_chambers)) {
      return doctorData.grouped_chambers
    }
    return []
  }, [doctorData?.grouped_chambers])

  return {
    doctor: doctorData || null,
    chambers: chambers || [],
    groupedChambers: groupedChambers || [],
    loading: doctorQuery.isLoading,
    loadingChambers: doctorQuery.isLoading,
    error: doctorQuery.isError
      ? getErrorMessage(doctorQuery.error, 'ডাক্তারের তথ্য লোড করা সম্ভব হয়নি।')
      : null,
    refetch: () => {
      doctorQuery.refetch()
    },
  }
}
