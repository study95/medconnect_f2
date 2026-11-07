// src/features/hospitals/useAdminHospitals.js
/**
 * Enterprise Admin Hospital Query & Mutation Hooks
 *
 * Replaces legacy imperative useEffect data loading with TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.hospitals.adminList)
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth pagination, search, and filter transitions
 * - Targeted cache invalidation on CRUD mutations
 * - Optimistic UI updates with rollback for status toggles
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateHospitals } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import { getSessionSnapshot, saveSessionSnapshot } from '../../lib/cacheSnapshot'
import {
  getHospitals,
  getMyHospitalProfile,
  getHospitalLookup,
  getHospital,
  createHospital,
  updateHospital,
  deleteHospital,
  bulkDeleteHospitals,
  getDivisions,
  getDistricts,
  getUpazilas,
  getUnions,
  getDoctors,
  getChambers,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Dedicated hook for authenticated Hospital portal to load ONLY own facility (/hospital/me)
 */
export function useMyHospitalProfile({ enabled = true } = {}) {
  const query = useQuery({
    queryKey: queryKeys.hospitals.me(),
    queryFn: async () => {
      const res = await getMyHospitalProfile()
      const data = res.data?.data ?? null
      if (data) {
        saveSessionSnapshot('hospital_me', data)
      }
      return data
    },
    initialData: () => getSessionSnapshot('hospital_me'),
    enabled,
  })

  return {
    hospital: query.data ?? null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load hospital profile.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch admin hospital listings with true server-side pagination & caching
 */
export function useAdminHospitals(filters = {}, { enabled = true } = {}) {
  const isDefaultView = (!filters.search && !filters.division_id && !filters.district_id && !filters.upazila_id && !filters.union_id && !filters.hospital_id && (!filters.page || filters.page === 1))

  const query = useQuery({
    queryKey: queryKeys.hospitals.adminList(filters),
    queryFn: async () => {
      const params = { per_page: 20, admin_view: 1, ...filters }
      const res = await getHospitals(params)
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      const items = Array.isArray(raw) ? raw : []
      const meta = res.data?.meta || res.data?.data?.meta || {
        total: res.data?.total ?? res.data?.data?.total ?? items.length,
        current_page: res.data?.current_page ?? res.data?.data?.current_page ?? (params.page || 1),
        last_page: res.data?.last_page ?? res.data?.data?.last_page ?? 1,
        per_page: res.data?.per_page ?? res.data?.data?.per_page ?? params.per_page,
      }
      const result = { items, meta }
      if (isDefaultView && items.length > 0) {
        saveSessionSnapshot('hospitals', result)
      }
      return result
    },
    initialData: () => {
      if (isDefaultView) {
        return getSessionSnapshot('hospitals')
      }
      return undefined
    },
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: 3 * 60 * 1000,
    refetchIntervalInBackground: false,
  })

  const items = query.data?.items || (Array.isArray(query.data) ? query.data : [])
  const meta = query.data?.meta || null

  return {
    hospitals: items,
    total: meta?.total ?? items.length,
    currentPage: meta?.current_page ?? 1,
    lastPage: meta?.last_page ?? 1,
    meta,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load hospitals list.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single hospital profile details, associated doctors, and chambers
 */
export function useAdminHospitalDetail(id, { initialHospital = null } = {}) {
  const query = useQuery({
    queryKey: queryKeys.hospitals.detail(id),
    queryFn: async () => {
      const [hospRes, docRes, chamRes] = await Promise.all([
        initialHospital ? Promise.resolve({ data: { data: initialHospital } }) : getHospital(id),
        getDoctors({ hospital_id: id, admin_view: 1, per_page: 100 }),
        getChambers({ hospital_id: id }),
      ])
      const hospital = hospRes.data?.data || hospRes.data
      const doctors = docRes.data?.data?.data || docRes.data?.data || []
      const chambers = chamRes.data?.data || chamRes.data || []
      return { hospital, doctors, chambers }
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    hospital: query.data?.hospital || initialHospital || null,
    doctors: query.data?.doctors || [],
    chambers: query.data?.chambers || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load hospital details.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook for cached hospital location lookups and dropdown options
 */
export function useAdminHospitalLookups({ divisionId, districtId, upazilaId, enabled = true } = {}) {
  // Master Divisions
  const divisionsQuery = useLookupQuery({
    queryKey: queryKeys.locations.divisions(),
    queryFn: async () => {
      const res = await getDivisions()
      return res.data?.data || res.data || []
    },
    enabled,
  })

  // Cascading Districts
  const districtsQuery = useLookupQuery({
    queryKey: queryKeys.locations.districts(divisionId),
    queryFn: async () => {
      if (!divisionId) return []
      const res = await getDistricts({ division_id: divisionId })
      return res.data?.data || res.data || []
    },
    enabled: enabled && Boolean(divisionId),
  })

  // Cascading Upazilas
  const upazilasQuery = useLookupQuery({
    queryKey: queryKeys.locations.upazilas(districtId),
    queryFn: async () => {
      if (!districtId) return []
      const res = await getUpazilas({ district_id: districtId })
      return res.data?.data || res.data || []
    },
    enabled: enabled && Boolean(districtId),
  })

  // Cascading Unions
  const unionsQuery = useLookupQuery({
    queryKey: queryKeys.locations.unions(upazilaId),
    queryFn: async () => {
      if (!upazilaId) return []
      const res = await getUnions({ upazila_id: upazilaId })
      return res.data?.data || res.data || []
    },
    enabled: enabled && Boolean(upazilaId),
  })

  // Lightweight filter option hospitals list (scoped by geographical hierarchy)
  const hospitalOptionsQuery = useLookupQuery({
    queryKey: queryKeys.hospitals.lookup({
      limit: 200,
      division_id: divisionId || undefined,
      district_id: districtId || undefined,
      upazila_id: upazilaId || undefined,
    }),
    queryFn: async () => {
      const params = { limit: 200 }
      if (divisionId) params.division_id = divisionId
      if (districtId) params.district_id = districtId
      if (upazilaId) params.upazila_id = upazilaId
      const res = await getHospitalLookup(params)
      return res.data?.data || res.data || []
    },
    enabled,
  })

  return {
    divisions: divisionsQuery.data || [],
    districts: districtsQuery.data || [],
    upazilas: upazilasQuery.data || [],
    unions: unionsQuery.data || [],
    hospitalsOptions: hospitalOptionsQuery.data || [],
    loadingLookups: divisionsQuery.isLoading || hospitalOptionsQuery.isLoading,
  }
}

/**
 * Mutation hooks for Hospital CRUD with targeted cache invalidation & optimistic status toggle
 */
export function useAdminHospitalMutations() {
  const queryClient = useQueryClient()

  // Delete hospital mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteHospital(id),
    onSuccess: (_, hospitalId) => {
      invalidateHospitals(queryClient, { hospitalId, includeChambers: true })
    },
  })

  // Optimistic Toggle Status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, is_active }) => updateHospital(id, { is_active: is_active ? 1 : 0 }),
    onMutate: async ({ id, is_active }) => {
      // Cancel ongoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.hospitals.all })

      // Snapshot previous caches for rollback
      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.hospitals.adminLists() })

      // Optimistically update matching admin lists in cache
      queryClient.setQueriesData({ queryKey: queryKeys.hospitals.adminLists() }, (old) => {
        if (Array.isArray(old)) {
          return old.map((hosp) => (hosp.id === id ? { ...hosp, is_active } : hosp))
        }
        if (old && Array.isArray(old.items)) {
          return {
            ...old,
            items: old.items.map((hosp) => (hosp.id === id ? { ...hosp, is_active } : hosp)),
          }
        }
        return old
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
      invalidateHospitals(queryClient, { hospitalId: id })
    },
  })

  // Create hospital mutation
  const createMutation = useMutation({
    mutationFn: (formData) => createHospital(formData),
    onSuccess: () => {
      invalidateHospitals(queryClient, { includeChambers: true })
    },
  })

  // Update hospital mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, formData }) => updateHospital(id, formData),
    onSuccess: (_, { id }) => {
      invalidateHospitals(queryClient, { hospitalId: id, includeChambers: true })
    },
  })

  // Bulk delete hospitals mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteHospitals(ids),
    onSuccess: () => {
      invalidateHospitals(queryClient, { includeChambers: true })
      queryClient.invalidateQueries({ queryKey: queryKeys.hospitals.all, refetchType: 'all' })
    },
  })

  return {
    deleteHospital: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    bulkDeleteHospitals: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    isToggling: toggleStatusMutation.isPending,
    createHospital: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateHospital: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  }
}
