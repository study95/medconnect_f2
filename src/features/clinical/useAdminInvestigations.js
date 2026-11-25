// src/features/clinical/useAdminInvestigations.js
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getInvestigations,
  getInvestigation,
  createInvestigation,
  updateInvestigation,
  deleteInvestigation,
  bulkDeleteInvestigations,
  toggleInvestigationActive,
  getInvestigationCategories,
  createInvestigationCategory,
  updateInvestigationCategory,
  deleteInvestigationCategory,
  getGroupedInvestigations,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

export function useAdminInvestigations(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.investigations.adminList(filters),
    queryFn: async () => {
      const res = await getInvestigations(filters)
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
    error: query.error ? getErrorMessage(query.error, 'Failed to load investigations.') : null,
    refetch: query.refetch,
  }
}

export function useInvestigationCategories() {
  const query = useQuery({
    queryKey: queryKeys.investigations.categories(),
    queryFn: async () => {
      const res = await getInvestigationCategories()
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

export function useGroupedInvestigations() {
  const query = useQuery({
    queryKey: queryKeys.investigations.grouped(),
    queryFn: async () => {
      const res = await getGroupedInvestigations()
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

export function useAdminInvestigationMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.investigations.all })
  }

  const createMutation = useMutation({
    mutationFn: (data) => createInvestigation(data),
    onSuccess: () => invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateInvestigation(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteInvestigation(id),
    onSuccess: () => invalidate(),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteInvestigations(ids),
    onSuccess: () => invalidate(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleInvestigationActive(id),
    onSuccess: () => invalidate(),
  })

  const createCategoryMutation = useMutation({
    mutationFn: (data) => createInvestigationCategory(data),
    onSuccess: () => invalidate(),
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }) => updateInvestigationCategory(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id) => deleteInvestigationCategory(id),
    onSuccess: () => invalidate(),
  })

  return {
    createInvestigation: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateInvestigation: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteInvestigation: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    bulkDeleteInvestigations: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,

    toggleActive: toggleActiveMutation.mutateAsync,
    isToggling: toggleActiveMutation.isPending,

    createCategory: createCategoryMutation.mutateAsync,
    updateCategory: updateCategoryMutation.mutateAsync,
    deleteCategory: deleteCategoryMutation.mutateAsync,
  }
}
