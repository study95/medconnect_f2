// src/features/pharma/useAdminDosageTypes.js
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getDosageTypes,
  getActiveDosageTypes,
  getDosageType,
  createDosageType,
  updateDosageType,
  deleteDosageType,
  bulkDeleteDosageTypes,
  toggleDosageTypeActive,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

export function useAdminDosageTypes(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.dosageTypes.adminList(filters),
    queryFn: async () => {
      const res = await getDosageTypes(filters)
      const data = res.data?.data || res.data || []
      const items = Array.isArray(data) ? data : (data?.data || [])
      const pagination = {
        current_page: data?.current_page || res.data?.current_page || filters.page || 1,
        last_page: data?.last_page || res.data?.last_page || 1,
        total: data?.total ?? res.data?.total ?? items.length,
      }
      return { items, pagination }
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
    refetchOnMount: 'always',
  })

  return {
    items: query.data?.items || [],
    pagination: query.data?.pagination || { current_page: 1, last_page: 1, total: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load dosage types.') : null,
    refetch: query.refetch,
  }
}

export function useActiveDosageTypes() {
  const query = useQuery({
    queryKey: queryKeys.dosageTypes.active(),
    queryFn: async () => {
      const res = await getActiveDosageTypes()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  return {
    dosageTypes: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminDosageTypeMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dosageTypes.all })
  }

  const createMutation = useMutation({
    mutationFn: (data) => createDosageType(data),
    onSuccess: () => invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateDosageType(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDosageType(id),
    onSuccess: () => invalidate(),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteDosageTypes(ids),
    onSuccess: () => invalidate(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleDosageTypeActive(id),
    onSuccess: () => invalidate(),
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    bulkDeleteMutation,
    toggleActiveMutation,
  }
}
