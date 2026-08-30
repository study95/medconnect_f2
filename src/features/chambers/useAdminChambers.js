// src/features/chambers/useAdminChambers.js
/**
 * Enterprise Admin Chamber Query & Mutation Hooks
 *
 * Replaces legacy imperative useEffect data loading with TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.chambers.adminList)
 * - Reuse of cached Doctor and Hospital datasets
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth pagination, search, and filter transitions
 * - Targeted cache invalidation on CRUD mutations
 * - Optimistic UI updates with rollback for status toggles
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateChambers } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getChambers,
  getChamber,
  createChamber,
  updateChamber,
  deleteChamber,
  toggleChamberActive,
  getDoctors,
  getHospitals,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch admin chamber routines with server-side caching & filters
 */
export function useAdminChambers(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.chambers.adminList(filters),
    queryFn: async () => {
      const res = await getChambers(filters)
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    placeholderData: keepPreviousData,
  })

  return {
    chambers: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load chambers list.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single chamber routine details
 */
export function useAdminChamberDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.chambers.detail(id),
    queryFn: async () => {
      const res = await getChamber(id)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    chamber: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load chamber details.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook for cached doctor and hospital lookups in the Chamber module
 */
export function useAdminChamberLookups() {
  // Reusable Doctor Lookup Query
  const doctorsQuery = useLookupQuery({
    queryKey: queryKeys.doctors.list({ per_page: 500 }),
    queryFn: async () => {
      const res = await getDoctors({ per_page: 500 })
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw)
        ? raw.map((d) => ({
            ...d,
            id: String(d.public_id || d.id),
            public_id: d.public_id,
            doctor_id: d.id,
            subtext: [d.specialty?.name, d.bmdc ? `BMDC: ${d.bmdc}` : null].filter(Boolean).join(' • '),
          }))
        : []
    },
  })

  // Reusable Hospital Lookup Query
  const hospitalsQuery = useLookupQuery({
    queryKey: queryKeys.hospitals.list({ per_page: 500 }),
    queryFn: async () => {
      const res = await getHospitals({ per_page: 500 })
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw)
        ? raw.map((h) => ({
            ...h,
            id: String(h.public_id || h.id),
            public_id: h.public_id,
            hospital_id: h.id,
            subtext: [h.district?.name, h.upazila?.name, h.address].filter(Boolean).join(', '),
          }))
        : []
    },
  })

  return {
    doctors: doctorsQuery.data || [],
    hospitals: hospitalsQuery.data || [],
    isLoadingLookups: doctorsQuery.isLoading || hospitalsQuery.isLoading,
  }
}

/**
 * Mutation hooks for Chamber CRUD with targeted cache invalidation & optimistic status toggle
 */
export function useAdminChamberMutations() {
  const queryClient = useQueryClient()

  // Delete Chamber mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteChamber(id),
    onSuccess: (_, chamberId) => {
      invalidateChambers(queryClient, { chamberId })
    },
  })

  // Optimistic Toggle Chamber Status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: (id) => toggleChamberActive(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.chambers.all })

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.chambers.adminLists() })

      // Optimistically flip is_active in memory cache
      queryClient.setQueriesData({ queryKey: queryKeys.chambers.adminLists() }, (old) => {
        if (!Array.isArray(old)) return old
        return old.map((chamber) => (chamber.id === id ? { ...chamber, is_active: !chamber.is_active } : chamber))
      })

      return { previousQueries }
    },
    onError: (err, id, context) => {
      // Rollback on failure
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: (_, __, id) => {
      invalidateChambers(queryClient, { chamberId: id })
    },
  })

  // Create single Chamber mutation
  const createMutation = useMutation({
    mutationFn: (data) => createChamber(data),
    onSuccess: (_, variables) => {
      invalidateChambers(queryClient, {
        doctorId: variables.doctor_id,
        hospitalId: variables.hospital_id,
      })
    },
  })

  // Update Chamber mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateChamber(id, data),
    onSuccess: (_, { id, data }) => {
      invalidateChambers(queryClient, {
        chamberId: id,
        doctorId: data?.doctor_id,
        hospitalId: data?.hospital_id,
      })
    },
  })

  return {
    deleteChamber: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    toggleChamberActive: toggleStatusMutation.mutateAsync,
    isToggling: toggleStatusMutation.isPending,
    createChamber: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateChamber: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
