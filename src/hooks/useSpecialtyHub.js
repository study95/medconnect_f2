import { useQuery } from '@tanstack/react-query'
import { getSpecialtyHub } from '../api/specialtyApi'
import { getErrorMessage } from '../utils/errorHelper'

export default function useSpecialtyHub(slug, district = null, upazila = null, params = {}) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['specialty-hub', slug, district, upazila, params],
    queryFn: async () => {
      if (!slug) return null
      const res = await getSpecialtyHub(slug, district, upazila, params)
      return res.data?.data || null
    },
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  })

  return {
    hubData: data,
    specialty: data?.specialty || null,
    doctors: data?.doctors?.data || [],
    doctorTotal: data?.doctors?.meta?.total ?? (data?.doctors?.data?.length || 0),
    hospitals: data?.hospitals?.data || [],
    hospitalTotal: data?.hospitals?.meta?.total ?? (data?.hospitals?.data?.length || 0),
    relatedSpecialties: data?.related_specialties || [],
    loading: isLoading,
    error: isError ? getErrorMessage(error, 'বিশেষজ্ঞ বিভাগের তথ্য লোড করা সম্ভব হয়নি।') : null,
    refetch,
  }
}
