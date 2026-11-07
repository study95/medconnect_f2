// src/hooks/useHospitalDetail.js
// WHY: Extracts the hospital fetch for HospitalDetailPage.
// Supports both canonical SEO route (/hospitals/:district/:upazila/:slug) and legacy route (/hospitals/:id).

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryClient } from '../lib/queryClient'
import { getHospitalBySlug, getHospitalById } from '../api/hospitalApi'
import { getErrorMessage } from '../utils/errorHelper'
import { useLocation } from 'react-router-dom'

/**
 * Predictive prefetch helper to eagerly load hospital profile on card hover
 */
export const prefetchHospital = (hospital) => {
  if (!hospital) return
  const district = hospital.district_slug || hospital.district?.slug || 'bangladesh'
  const upazila = hospital.upazila_slug || hospital.upazila?.slug || 'general'
  const slug = hospital.slug || hospital.seo_slug || hospital.id

  if (district && upazila && slug) {
    queryClient.prefetchQuery({
      queryKey: ['hospital', district, upazila, slug],
      queryFn: async () => {
        const res = await getHospitalBySlug(district, upazila, slug)
        return res.data?.data || res.data
      },
      staleTime: 5 * 60 * 1000,
    })
  } else if (hospital.id) {
    queryClient.prefetchQuery({
      queryKey: ['hospital', hospital.id],
      queryFn: async () => {
        const res = await getHospitalById(hospital.id)
        return res.data?.data || res.data
      },
      staleTime: 5 * 60 * 1000,
    })
  }
}

export default function useHospitalDetail(params, options = {}) {
  const queryClient = useQueryClient()
  const location = useLocation()

  // Support both object params { district, upazila, slug, id } and legacy single id string/number
  const { district, upazila, slug, id } = typeof params === 'object' && params !== null
    ? params
    : { id: params }

  const isSlugRoute = Boolean(district && upazila && slug)
  const isIdRoute = Boolean(id && !isSlugRoute)
  const isEnabled = isSlugRoute || isIdRoute

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: isSlugRoute ? ['hospital', district, upazila, slug] : ['hospital', id],
    queryFn: async () => {
      const res = isSlugRoute
        ? await getHospitalBySlug(district, upazila, slug)
        : await getHospitalById(id)
      return res.data?.data || res.data
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    initialData: () => {
      // 1. Explicit initial data from props/options or router location state
      if (options.initialHospital) return options.initialHospital
      if (location.state?.initialHospital) return location.state.initialHospital
      if (location.state?.previewHospital) return location.state.previewHospital

      // 2. Lookup existing hospital from 'hospitals-infinite' listing cache in queryClient
      const infiniteQueries = queryClient.getQueriesData({ queryKey: ['hospitals-infinite'] })
      for (const [, cacheData] of infiniteQueries) {
        if (!cacheData?.pages) continue
        for (const page of cacheData.pages) {
          if (!Array.isArray(page?.hospitals)) continue
          const match = page.hospitals.find(h => 
            (slug && (h.slug === slug || h.canonical_url?.includes(`/${slug}`))) || 
            (id && (String(h.id) === String(id) || String(h.public_id) === String(id)))
          )
          if (match) return match
        }
      }
      return undefined
    },
  })

  return {
    hospital: data || null,
    loading: isLoading && !data,
    isBackgroundFetching: isFetching,
    error: isError && !data ? getErrorMessage(error, 'হাসপাতালের তথ্য লোড করা সম্ভব হয়নি।') : null,
    refetch,
  }
}
