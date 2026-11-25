// src/features/clinical/useAdminChiefComplaints.js
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getChiefComplaints,
  getActiveChiefComplaints,
  getChiefComplaintCategories,
  createChiefComplaint,
  updateChiefComplaint,
  deleteChiefComplaint,
  toggleChiefComplaintActive,
  bulkDeleteChiefComplaints,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

export function useAdminChiefComplaints(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.chiefComplaints.adminList(filters),
    queryFn: async () => {
      const res = await getChiefComplaints(filters)
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
    error: query.error ? getErrorMessage(query.error, 'Failed to load chief complaints.') : null,
    refetch: query.refetch,
  }
}

export function useActiveChiefComplaints() {
  const query = useQuery({
    queryKey: queryKeys.chiefComplaints.active(),
    queryFn: async () => {
      const res = await getActiveChiefComplaints()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000, // 1 hour
  })

  return {
    complaints: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

export function useChiefComplaintCategories() {
  const query = useQuery({
    queryKey: ['chief-complaints', 'categories'],
    queryFn: async () => {
      const res = await getChiefComplaintCategories()
      return res.data?.data || []
    },
    staleTime: 60 * 60 * 1000,
  })

  return {
    categories: query.data || [],
    isLoading: query.isLoading,
  }
}

export function useAdminChiefComplaintMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.chiefComplaints.all })
  }

  const createMutation = useMutation({
    mutationFn: (data) => createChiefComplaint(data),
    onSuccess: () => invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateChiefComplaint(id, data),
    onSuccess: () => invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteChiefComplaint(id),
    onSuccess: () => invalidate(),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteChiefComplaints(ids),
    onSuccess: () => invalidate(),
  })

  const toggleActiveMutation = useMutation({
    mutationFn: (id) => toggleChiefComplaintActive(id),
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
