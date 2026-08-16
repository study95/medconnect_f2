// src/hooks/useHospitalDetail.js
// WHY: Extracts the hospital fetch from HospitalDetailPage.
// Cached by hospital ID — revisiting the same hospital = instant render.

import { useQuery } from '@tanstack/react-query'
import { getHospitalById } from '../api/hospitalApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useHospitalDetail(id) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hospital', id],
    queryFn: async () => {
      const res = await getHospitalById(id)
      return res.data?.data || res.data
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

  return {
    hospital: data || null,
    loading: isLoading,
    error: isError ? getErrorMessage(error, 'হাসপাতালের তথ্য লোড করা সম্ভব হয়নি।') : null,
    refetch,
  }
}
