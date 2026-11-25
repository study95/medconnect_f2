// src/features/pharma/useAdminCompanies.js
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getCompanies,
  getActiveCompanies,
  getCompany,
  createCompany,
  updateCompany,
  deleteCompany,
  bulkDeleteCompanies,
  toggleCompanyActive,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

export function useAdminCompanies(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.companies.adminList(filters),
    queryFn: async () => {
      const res = await getCompanies(filters)
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
    error: query.error ? getErrorMessage(query.error, 'Failed to load companies.') : null,
    refetch: query.refetch,
  }
}

export function useActiveCompanies() {
  const query = useQuery({
    queryKey: queryKeys.companies.active(),
    queryFn: async () => {
      const res = await getActiveCompanies()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  return {
    companies: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useAdminCompanyMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.all })
  }

  const createMutation = useMutation({
    mutationFn: (data) => createCompany(data),
    onSuccess: () => invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateCompany(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteCompany(id),
    onSuccess: () => invalidate(),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteCompanies(ids),
    onSuccess: () => invalidate(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleCompanyActive(id),
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
