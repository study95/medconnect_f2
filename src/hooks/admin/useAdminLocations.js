// src/hooks/admin/useAdminLocations.js
/**
 * Enterprise Geographic Lookup & Location Management Query Hooks
 *
 * Provides shared lookup caches across the entire application for:
 * - Divisions
 * - Districts (cascading by division)
 * - Upazilas (cascading by district)
 * - Unions (cascading by upazila)
 *
 * Features:
 * - Instant updates upon Create/Update/Delete operations
 * - Coordinated cascading lookups via `useLocationLookups()`
 * - Administrative CRUD mutations with immediate cache invalidation
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateLocations } from '../../lib/cacheInvalidation'
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
 * Hook to fetch all divisions
 */
export function useDivisions() {
  const query = useQuery({
    queryKey: queryKeys.locations.divisions(),
    queryFn: async () => {
      const res = await getDivisions()
      return res.data?.data || res.data || []
    },
    staleTime: 5000,
    refetchOnMount: true,
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
    staleTime: 5000,
    refetchOnMount: true,
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
  const query = useQuery({
    queryKey: queryKeys.locations.districts(divisionId || null),
    queryFn: async () => {
      const params = isFiltered ? { division_id: divisionId } : {}
      const res = await getDistricts(params)
      return res.data?.data || res.data || []
    },
    staleTime: 5000,
    refetchOnMount: true,
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
    staleTime: 5000,
    refetchOnMount: true,
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
  const query = useQuery({
    queryKey: queryKeys.locations.upazilas(districtId || null),
    queryFn: async () => {
      const params = isFiltered ? { district_id: districtId } : {}
      const res = await getUpazilas(params)
      return res.data?.data || res.data || []
    },
    staleTime: 5000,
    refetchOnMount: true,
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
    staleTime: 5000,
    refetchOnMount: true,
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
  const query = useQuery({
    queryKey: queryKeys.locations.unions(upazilaId || null),
    queryFn: async () => {
      const params = isFiltered ? { upazila_id: upazilaId } : {}
      const res = await getUnions(params)
      return res.data?.data || res.data || []
    },
    staleTime: 5000,
    refetchOnMount: true,
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
    staleTime: 5000,
    refetchOnMount: true,
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
    onSuccess: () => {
      invalidateLocations(queryClient, { type: 'divisions' })
    },
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
    onSuccess: () => {
      invalidateLocations(queryClient, { type: 'districts' })
    },
  })
  const updateDist = useMutation({
    mutationFn: ({ id, data }) => updateDistrict(id, data),
    onSuccess: (_, { id }) => {
      invalidateLocations(queryClient, { type: 'districts' })
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
    onSuccess: () => {
      invalidateLocations(queryClient, { type: 'upazilas' })
    },
  })
  const updateUp = useMutation({
    mutationFn: ({ id, data }) => updateUpazila(id, data),
    onSuccess: (_, { id }) => {
      invalidateLocations(queryClient, { type: 'upazilas' })
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
    onSuccess: () => {
      invalidateLocations(queryClient, { type: 'unions' })
    },
  })
  const updateUn = useMutation({
    mutationFn: ({ id, data }) => updateUnion(id, data),
    onSuccess: (_, { id }) => {
      invalidateLocations(queryClient, { type: 'unions' })
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
