// src/features/medicines/useAdminMedicines.js
/**
 * Enterprise Admin Medicine Query & Mutation Hooks
 *
 * Encapsulates server-state management for Medicines using TanStack React Query.
 * Features:
 * - Query Key Factory integration (queryKeys.medicines.adminList / pendingCount)
 * - staleTime / gcTime inheritance with background revalidation
 * - keepPreviousData for smooth search, pagination, and filter transitions
 * - Targeted cache invalidation on delete, bulk-delete, approve, and reject operations
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import {
  getMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  bulkDeleteMedicines,
  getMedicinesPendingCount,
  approveMedicine,
  rejectMedicine,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch paginated admin medicines list with server-side caching
 */
export function useAdminMedicines(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.medicines.adminList(filters),
    queryFn: async () => {
      const res = await getMedicines(filters)
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
  })

  return {
    items: query.data?.items || [],
    pagination: query.data?.pagination || { current_page: 1, last_page: 1, total: 0 },
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load medicines.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch pending medicines count for badge/review alerts
 */
export function useAdminMedicinesPendingCount() {
  const query = useQuery({
    queryKey: queryKeys.medicines.pendingCount(),
    queryFn: async () => {
      const res = await getMedicinesPendingCount()
      return res.data?.count ?? 0
    },
    staleTime: 60 * 1000,
  })

  return {
    pendingCount: query.data ?? 0,
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

/**
 * Hook providing medicine admin mutations with targeted cache invalidation
 */
export function useAdminMedicineMutations() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicines.all })
  }

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteMedicine(id),
    onSuccess: () => invalidate(),
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids) => bulkDeleteMedicines(ids),
    onSuccess: () => invalidate(),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, data }) => approveMedicine(id, data),
    onSuccess: () => invalidate(),
  })

  const rejectMutation = useMutation({
    mutationFn: (id) => rejectMedicine(id),
    onSuccess: () => invalidate(),
  })

  return {
    deleteMedicine: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    bulkDeleteMedicines: bulkDeleteMutation.mutateAsync,
    isBulkDeleting: bulkDeleteMutation.isPending,

    approveMedicine: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,

    rejectMedicine: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
  }
}
