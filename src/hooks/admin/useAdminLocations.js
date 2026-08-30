// src/hooks/admin/useAdminLocations.js
/**
 * Enterprise Geographic Lookup & Location Management Query Hooks
 *
 * Provides shared, long-lived lookup caches across the entire application for:
 * - Divisions
 * - Districts (cascading by division)
 * - Upazilas (cascading by district)
 * - Unions (cascading by upazila)
 *
 * Features:
 * - Master-data 30-minute staleTime / 60-minute gcTime caching
 * - Instant memory lookup across all Admin modules (Doctors, Hospitals, Patients, Chambers, etc.)
 * - Zero duplicate requests for same division/district/upazila IDs
 * - Coordinated cascading lookups via `useLocationLookups()`
 * - Administrative CRUD mutations with targeted cache invalidation
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateLocations } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getDivisions,
  getDivision,
  createDivision,
  updateDivision,
  deleteDivision,
  getDistricts,
  getDistrict,
  createDistrict,
  updateDistrict,
  deleteDistrict,
  getUpazilas,
  getUpazila,
  createUpazila,
  updateUpazila,
  deleteUpazila,
  getUnions,
  getUnion,
  createUnion,
  updateUnion,
  deleteUnion,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch all divisions (Long-lived lookup cache)
 */
export function useDivisions() {
  const query = useLookupQuery({
    queryKey: queryKeys.locations.divisions(),
    queryFn: async () => {
      const res = await getDivisions()
      return res.data?.data || res.data || []
    },
  })

  return {
    divisions: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load divisions') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single division detail
 */
export function useDivisionDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.locations.division(id),
    queryFn: async () => {
      const res = await getDivision(id)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    division: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load division') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch districts (optionally filtered by division_id)
 */
export function useDistricts(divisionId = null) {
  const isFiltered = divisionId !== null && divisionId !== undefined && divisionId !== ''
  const query = useLookupQuery({
    queryKey: queryKeys.locations.districts(divisionId || null),
    queryFn: async () => {
      const params = isFiltered ? { division_id: divisionId } : {}
      const res = await getDistricts(params)
      return res.data?.data || res.data || []
    },
  })

  return {
    districts: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load districts') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single district detail
 */
export function useDistrictDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.locations.district(id),
    queryFn: async () => {
      const res = await getDistrict(id)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    district: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load district') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch upazilas (optionally filtered by district_id)
 */
export function useUpazilas(districtId = null) {
  const isFiltered = districtId !== null && districtId !== undefined && districtId !== ''
  const query = useLookupQuery({
    queryKey: queryKeys.locations.upazilas(districtId || null),
    queryFn: async () => {
      const params = isFiltered ? { district_id: districtId } : {}
      const res = await getUpazilas(params)
      return res.data?.data || res.data || []
    },
  })

  return {
    upazilas: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load upazilas') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single upazila detail
 */
export function useUpazilaDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.locations.upazila(id),
    queryFn: async () => {
      const res = await getUpazila(id)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    upazila: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load upazila') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch unions (optionally filtered by upazila_id)
 */
export function useUnions(upazilaId = null) {
  const isFiltered = upazilaId !== null && upazilaId !== undefined && upazilaId !== ''
  const query = useLookupQuery({
    queryKey: queryKeys.locations.unions(upazilaId || null),
    queryFn: async () => {
      const params = isFiltered ? { upazila_id: upazilaId } : {}
      const res = await getUnions(params)
      return res.data?.data || res.data || []
    },
  })

  return {
    unions: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load unions') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single union detail
 */
export function useUnionDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.locations.union(id),
    queryFn: async () => {
      const res = await getUnion(id)
      return res.data?.data || res.data || null
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    union: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load union') : null,
    refetch: query.refetch,
  }
}

/**
 * Coordinated cascading lookups hook for geographic selections
 */
export function useLocationLookups({ divisionId = null, districtId = null, upazilaId = null } = {}) {
  const divisions = useDivisions()
  const districts = useDistricts(divisionId)
  const upazilas = useUpazilas(districtId)
  const unions = useUnions(upazilaId)

  return {
    divisions: divisions.divisions,
    districts: districts.districts,
    upazilas: upazilas.upazilas,
    unions: unions.unions,
    isLoadingDivisions: divisions.isLoading,
    isLoadingDistricts: districts.isLoading,
    isLoadingUpazilas: upazilas.isLoading,
    isLoadingUnions: unions.isLoading,
    isLoadingLocations:
      divisions.isLoading || districts.isLoading || upazilas.isLoading || unions.isLoading,
  }
}

/**
 * Mutation hooks for Location master-data CRUD
 */
export function useAdminLocationMutations() {
  const queryClient = useQueryClient()

  // Division mutations
  const createDiv = useMutation({
    mutationFn: (data) => createDivision(data),
    onSuccess: () => invalidateLocations(queryClient, { type: 'divisions' }),
  })
  const updateDiv = useMutation({
    mutationFn: ({ id, data }) => updateDivision(id, data),
    onSuccess: (_, { id }) => {
      invalidateLocations(queryClient, { type: 'divisions' })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.division(id) })
    },
  })
  const deleteDiv = useMutation({
    mutationFn: (id) => deleteDivision(id),
    onSuccess: (_, id) => {
      invalidateLocations(queryClient, { type: 'divisions' })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.division(id) })
    },
  })

  // District mutations
  const createDist = useMutation({
    mutationFn: (data) => createDistrict(data),
    onSuccess: (_, data) => invalidateLocations(queryClient, { type: 'districts', divisionId: data?.division_id }),
  })
  const updateDist = useMutation({
    mutationFn: ({ id, data }) => updateDistrict(id, data),
    onSuccess: (_, { id, data }) => {
      invalidateLocations(queryClient, { type: 'districts', divisionId: data?.division_id })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.district(id) })
    },
  })
  const deleteDist = useMutation({
    mutationFn: (id) => deleteDistrict(id),
    onSuccess: (_, id) => {
      invalidateLocations(queryClient, { type: 'districts' })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.district(id) })
    },
  })

  // Upazila mutations
  const createUp = useMutation({
    mutationFn: (data) => createUpazila(data),
    onSuccess: (_, data) => invalidateLocations(queryClient, { type: 'upazilas', districtId: data?.district_id }),
  })
  const updateUp = useMutation({
    mutationFn: ({ id, data }) => updateUpazila(id, data),
    onSuccess: (_, { id, data }) => {
      invalidateLocations(queryClient, { type: 'upazilas', districtId: data?.district_id })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.upazila(id) })
    },
  })
  const deleteUp = useMutation({
    mutationFn: (id) => deleteUpazila(id),
    onSuccess: (_, id) => {
      invalidateLocations(queryClient, { type: 'upazilas' })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.upazila(id) })
    },
  })

  // Union mutations
  const createUn = useMutation({
    mutationFn: (data) => createUnion(data),
    onSuccess: (_, data) => invalidateLocations(queryClient, { type: 'unions', upazilaId: data?.upazila_id }),
  })
  const updateUn = useMutation({
    mutationFn: ({ id, data }) => updateUnion(id, data),
    onSuccess: (_, { id, data }) => {
      invalidateLocations(queryClient, { type: 'unions', upazilaId: data?.upazila_id })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.union(id) })
    },
  })
  const deleteUn = useMutation({
    mutationFn: (id) => deleteUnion(id),
    onSuccess: (_, id) => {
      invalidateLocations(queryClient, { type: 'unions' })
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.union(id) })
    },
  })

  return {
    createDivision: createDiv.mutateAsync,
    updateDivision: (id, data) => updateDiv.mutateAsync({ id, data }),
    deleteDivision: deleteDiv.mutateAsync,
    isCreatingDivision: createDiv.isPending,
    isUpdatingDivision: updateDiv.isPending,
    isDeletingDivision: deleteDiv.isPending,

    createDistrict: createDist.mutateAsync,
    updateDistrict: (id, data) => updateDist.mutateAsync({ id, data }),
    deleteDistrict: deleteDist.mutateAsync,
    isCreatingDistrict: createDist.isPending,
    isUpdatingDistrict: updateDist.isPending,
    isDeletingDistrict: deleteDist.isPending,

    createUpazila: createUp.mutateAsync,
    updateUpazila: (id, data) => updateUp.mutateAsync({ id, data }),
    deleteUpazila: deleteUp.mutateAsync,
    isCreatingUpazila: createUp.isPending,
    isUpdatingUpazila: updateUp.isPending,
    isDeletingUpazila: deleteUp.isPending,

    createUnion: createUn.mutateAsync,
    updateUnion: (id, data) => updateUn.mutateAsync({ id, data }),
    deleteUnion: deleteUn.mutateAsync,
    isCreatingUnion: createUn.isPending,
    isUpdatingUnion: updateUn.isPending,
    isDeletingUnion: deleteUn.isPending,
  }
}
