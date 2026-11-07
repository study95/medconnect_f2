// src/hooks/useDoctorDetail.js
// WHY: Extracts doctor profile + chambers fetching for DoctorDetailPage.
// DoctorResource provides the doctor profile with precomputed chambers and grouped_chambers as SSOT.
// Supports both canonical SEO route (/doctors/:district/:upazila/:slug) and legacy route (/doctors/:id).

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { getDoctorBySlug, getDoctorById } from '../api/doctorApi'
import { getErrorMessage } from '../utils/errorHelper'
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Predictive prefetch helper to eagerly load doctor profile on card hover
 */
export const prefetchDoctor = (doctor) => {
  if (!doctor) return
  const district = doctor.district_slug || doctor.district?.slug || 'bangladesh'
  const upazila = doctor.upazila_slug || doctor.upazila?.slug || 'general'
  const slug = doctor.slug || doctor.seo_slug || doctor.id

  if (district && upazila && slug) {
    queryClient.prefetchQuery({
      queryKey: ['doctor', district, upazila, slug],
      queryFn: async () => {
        const res = await getDoctorBySlug(district, upazila, slug)
        return res.data?.data || res.data
      },
      staleTime: 5 * 60 * 1000,
    })
  } else if (doctor.id) {
    queryClient.prefetchQuery({
      queryKey: ['doctor', doctor.id],
      queryFn: async () => {
        const res = await getDoctorById(doctor.id)
        return res.data?.data || res.data
      },
      staleTime: 5 * 60 * 1000,
    })
  }
}

export default function useDoctorDetail(params, options = {}) {
  const queryClient = useQueryClient()
  const location = useLocation()

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
    gcTime: 30 * 60 * 1000,
    initialData: () => {
      // Priority 1: Explicit initial data passed in options or router state
      if (options.initialDoctor) return options.initialDoctor
      if (location.state?.initialDoctor) return location.state.initialDoctor
      if (location.state?.previewDoctor) return location.state.previewDoctor

      // Priority 2: Extract from 'doctors-infinite' listing cache in queryClient for instant 0ms open
      const infiniteQueries = queryClient.getQueriesData({ queryKey: ['doctors-infinite'] })
      for (const [, cacheData] of infiniteQueries) {
        if (!cacheData?.pages) continue
        for (const page of cacheData.pages) {
          if (!Array.isArray(page?.doctors)) continue
          const match = page.doctors.find(d => 
            (slug && (d.slug === slug || d.canonical_url?.includes(`/${slug}`))) || 
            (id && (String(d.id) === String(id) || String(d.public_id) === String(id)))
          )
          if (match) return match
        }
      }
      return undefined
    },
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
    loading: doctorQuery.isLoading && !doctorData,
    isBackgroundFetching: doctorQuery.isFetching,
    loadingChambers: doctorQuery.isLoading || (doctorQuery.isFetching && groupedChambers.length === 0),
    error: doctorQuery.isError && !doctorData
      ? getErrorMessage(doctorQuery.error, 'ডাক্তারের তথ্য লোড করা সম্ভব হয়নি।')
      : null,
    refetch: () => {
      doctorQuery.refetch()
    },
  }
}
