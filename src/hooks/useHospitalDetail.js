// src/hooks/useHospitalDetail.js
// WHY: Extracts the hospital fetch for HospitalDetailPage.
// Supports both canonical SEO route (/hospitals/:district/:upazila/:slug) and legacy route (/hospitals/:id).

import { useQuery } from '@tanstack/react-query'
import { getHospitalBySlug, getHospitalById } from '../api/hospitalApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useHospitalDetail(params) {
  // Support both object params { district, upazila, slug, id } and legacy single id string/number
  const { district, upazila, slug, id } = typeof params === 'object' && params !== null
    ? params
    : { id: params }

  const isSlugRoute = Boolean(district && upazila && slug)
  const isIdRoute = Boolean(id && !isSlugRoute)
  const isEnabled = isSlugRoute || isIdRoute

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: isSlugRoute ? ['hospital', district, upazila, slug] : ['hospital', id],
    queryFn: async () => {
      const res = isSlugRoute
        ? await getHospitalBySlug(district, upazila, slug)
        : await getHospitalById(id)
      return res.data?.data || res.data
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000,
  })

  return {
    hospital: data || null,
    loading: isLoading,
    error: isError ? getErrorMessage(error, 'হাসপাতালের তথ্য লোড করা সম্ভব হয়নি।') : null,
    refetch,
  }
}
