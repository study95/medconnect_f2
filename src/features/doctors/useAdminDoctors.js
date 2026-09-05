// src/features/doctors/useAdminDoctors.js
/**
 * Enterprise Admin Doctor Query & Mutation Hooks
 *
 * Replaces imperative useEffect data fetching with TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.doctors.adminList)
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth filter & search transitions
 * - Targeted cache invalidation on CRUD mutations
 * - Optimistic UI updates for quick status toggles
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateDoctors } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDivisions,
  getDistricts,
  getUpazilas,
  getUnions,
  getSpecialties,
  getChambers,
  getHospitals,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch admin doctor listings with server filter caching
 */
export function useAdminDoctors(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.doctors.adminList(filters),
    queryFn: async () => {
      const params = { per_page: 5000, admin_view: 1, ...filters }
      const res = await getDoctors(params)
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    placeholderData: keepPreviousData,
  })

  return {
    doctors: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load doctors list.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single doctor details and associated chambers
 */
export function useAdminDoctorDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.doctors.detail(id),
    queryFn: async () => {
      const [docRes, chamRes] = await Promise.all([
        getDoctor(id),
        getChambers({ doctor_id: id }),
      ])
      const doctor = docRes.data?.data || docRes.data
      const allChambers = chamRes.data?.data || chamRes.data || []
      const chambers = allChambers.length > 0 ? allChambers : (doctor?.chambers || [])
      return { doctor, chambers }
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    doctor: query.data?.doctor || null,
    chambers: query.data?.chambers || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load doctor details.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook for cached doctor filter & form lookups (divisions, districts, upazilas, unions, specialties)
 */
export function useAdminDoctorLookups({ divisionId, districtId, upazilaId } = {}) {
  // Master Divisions
  const divisionsQuery = useLookupQuery({
    queryKey: queryKeys.locations.divisions(),
    queryFn: async () => {
      const res = await getDivisions()
      return res.data?.data || res.data || []
    },
  })

  // Master Specialties
  const specialtiesQuery = useLookupQuery({
    queryKey: queryKeys.specialties.lists(),
    queryFn: async () => {
      const res = await getSpecialties({ per_page: 5000 })
      return res.data?.data?.data || res.data?.data || res.data || []
    },
  })

  // Cascading Districts
  const districtsQuery = useLookupQuery({
    queryKey: queryKeys.locations.districts(divisionId),
    queryFn: async () => {
      if (!divisionId) return []
      const res = await getDistricts({ division_id: divisionId })
      return res.data?.data || res.data || []
    },
    enabled: Boolean(divisionId),
  })

  // Cascading Upazilas
  const upazilasQuery = useLookupQuery({
    queryKey: queryKeys.locations.upazilas(districtId),
    queryFn: async () => {
      if (!districtId) return []
      const res = await getUpazilas({ district_id: districtId })
      return res.data?.data || res.data || []
    },
    enabled: Boolean(districtId),
  })

  // Cascading Unions
  const unionsQuery = useLookupQuery({
    queryKey: queryKeys.locations.unions(upazilaId),
    queryFn: async () => {
      if (!upazilaId) return []
      const res = await getUnions({ upazila_id: upazilaId })
      return res.data?.data || res.data || []
    },
    enabled: Boolean(upazilaId),
  })

  // Master Hospitals
  const hospitalsQuery = useLookupQuery({
    queryKey: queryKeys.hospitals.lists(),
    queryFn: async () => {
      const res = await getHospitals({ per_page: 5000, admin_view: 1 })
      return res.data?.data?.data || res.data?.data || res.data || []
    },
  })

  return {
    divisions: divisionsQuery.data || [],
    specialties: specialtiesQuery.data || [],
    districts: districtsQuery.data || [],
    upazilas: upazilasQuery.data || [],
    unions: unionsQuery.data || [],
    hospitals: hospitalsQuery.data || [],
    loadingLookups: divisionsQuery.isLoading || specialtiesQuery.isLoading || hospitalsQuery.isLoading,
  }
}

/**
 * Mutation hooks for Doctor CRUD with targeted cache invalidation & optimistic status toggling
 */
export function useAdminDoctorMutations() {
  const queryClient = useQueryClient()

  // Delete doctor mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDoctor(id),
    onSuccess: (_, doctorId) => {
      invalidateDoctors(queryClient, { doctorId, includeChambers: true })
    },
  })

  // Optimistic Toggle Status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateDoctor(id, { is_active: is_active ? 1 : 0 }),
    onMutate: async ({ id, is_active }) => {
      // Cancel ongoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.doctors.all })

      // Snapshot previous caches for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.doctors.adminLists() })

      // Optimistically update all matching admin lists in cache
      queryClient.setQueriesData({ queryKey: queryKeys.doctors.adminLists() }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((doc) => (doc.id === id ? { ...doc, is_active } : doc))
      })

      return { previousQueries }
    },
    onError: (err, variables, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (_, __, { id }) => {
      invalidateDoctors(queryClient, { doctorId: id })
    },
  })

  // Create doctor mutation
  const createMutation = useMutation({
    mutationFn: (formData) => createDoctor(formData),
    onSuccess: () => {
      invalidateDoctors(queryClient, { includeChambers: true })
    },
  })

  // Update doctor mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => updateDoctor(id, formData),
    onSuccess: (_, { id }) => {
      invalidateDoctors(queryClient, { doctorId: id, includeChambers: true })
    },
  })

  return {
    deleteDoctor: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isToggling: toggleStatusMutation.isPending,
    createDoctor: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateDoctor: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
