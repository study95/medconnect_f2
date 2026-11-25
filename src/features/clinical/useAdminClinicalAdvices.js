// src/features/clinical/useAdminClinicalAdvices.js
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getClinicalAdvices,
  getClinicalAdvice,
  createClinicalAdvice,
  updateClinicalAdvice,
  deleteClinicalAdvice,
  bulkDeleteClinicalAdvices,
  toggleClinicalAdviceActive,
  getAdviceCategories,
  createAdviceCategory,
  updateAdviceCategory,
  deleteAdviceCategory,
  getGroupedClinicalAdvices,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

export function useAdminClinicalAdvices(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.clinicalAdvices.adminList(filters),
    queryFn: async () => {
      const res = await getClinicalAdvices(filters)
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
    error: query.error ? getErrorMessage(query.error, 'Failed to load clinical advice.') : null,
    refetch: query.refetch,
  }
}

export function useAdviceCategories() {
  const query = useQuery({
    queryKey: queryKeys.clinicalAdvices.categories(),
    queryFn: async () => {
      const res = await getAdviceCategories()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
  })

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useGroupedClinicalAdvices() {
  const query = useQuery({
    queryKey: queryKeys.clinicalAdvices.grouped(),
    queryFn: async () => {
      const res = await getGroupedClinicalAdvices()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour cache
  })

  return {
    grouped: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminClinicalAdviceMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.clinicalAdvices.all })
  }

  const createMutation = useMutation({
    mutationFn: (data) => createClinicalAdvice(data),
    onSuccess: () => invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateClinicalAdvice(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteClinicalAdvice(id),
    onSuccess: () => invalidate(),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteClinicalAdvices(ids),
    onSuccess: () => invalidate(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleClinicalAdviceActive(id),
    onSuccess: () => invalidate(),
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data) => createAdviceCategory(data),
    onSuccess: () => invalidate(),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => updateAdviceCategory(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => deleteAdviceCategory(id),
    onSuccess: () => invalidate(),
  })

  return {
    createClinicalAdvice: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateClinicalAdvice: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteClinicalAdvice: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    bulkDeleteClinicalAdvices: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,

    toggleActive: toggleActiveMutation.mutateAsync,
    isToggling: toggleActiveMutation.isPending,

    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
  }
}
