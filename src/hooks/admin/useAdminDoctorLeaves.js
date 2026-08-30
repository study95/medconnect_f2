// src/hooks/admin/useAdminDoctorLeaves.js
/**
 * Enterprise Admin Doctor Leave Query & Mutation Hooks
 *
 * Encapsulates all server-state logic for the Doctor Leave Admin Module using TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.leaves.adminList / byDoctor)
 * - staleTime / gcTime inheritance from QueryClient
 * - Reusable lookups for Doctors and Chambers without duplicate requests
 * - keepPreviousData for smooth pagination and doctor filter transitions
 * - Targeted cache invalidation on leave creation and deletion
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateLeaves } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getDoctorLeaves,
  createDoctorLeave,
  deleteDoctorLeave,
  checkLeaveImpact,
} from '../../api/leaveApi'
import { getDoctors, getDoctorChambers } from '../../api/doctorApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch doctor leaves list with server-side filters & caching
 */
export function useAdminDoctorLeaves(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.leaves.adminList(filters),
    queryFn: async () => {
      const res = await getDoctorLeaves(filters)
      const paginatedData = res.data?.data
      if (paginatedData?.data) {
        return {
          leaves: paginatedData.data,
          totalEntries: paginatedData.total || paginatedData.data.length,
          currentPage: paginatedData.current_page || 1,
          rawResponse: res.data,
        }
      } else if (Array.isArray(paginatedData)) {
        return {
          leaves: paginatedData,
          totalEntries: paginatedData.length,
          currentPage: 1,
          rawResponse: res.data,
        }
      }
      return {
        leaves: [],
        totalEntries: 0,
        currentPage: 1,
        rawResponse: res.data,
      }
    },
    placeholderData: keepPreviousData,
  })

  const data = query.data || { leaves: [], totalEntries: 0, currentPage: 1 }

  return {
    leaves: data.leaves,
    totalEntries: data.totalEntries,
    currentPage: data.currentPage,
    rawResponse: data.rawResponse,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'ছুটির তালিকা লোড করা সম্ভব হয়নি') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single doctor leave detail
 */
export function useAdminDoctorLeaveDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.leaves.detail(id),
    queryFn: async () => {
      const res = await getDoctorLeaves({ id })
      const list = res.data?.data?.data || res.data?.data || []
      return Array.isArray(list) ? list[0] : list
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    leave: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'ছুটির তথ্য লোড করা সম্ভব হয়নি') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook for cached lookup data (Doctors & Chambers)
 */
export function useAdminDoctorLeaveLookups({ doctorId = null } = {}) {
  // Doctors lookup (Reusing cached 200/500 doctor list)
  const doctorsQuery = useLookupQuery({
    queryKey: queryKeys.doctors.list({ per_page: 200 }),
    queryFn: async () => {
      const res = await getDoctors({ per_page: 200 })
      return res.data?.data?.data || res.data?.data || res.data || []
    },
  })

  // Doctor Chambers lookup
  const chambersQuery = useLookupQuery({
    queryKey: doctorId ? queryKeys.chambers.byDoctor(doctorId) : ['doctor-chambers', 'current-user'],
    queryFn: async () => {
      const res = await getDoctorChambers(doctorId ? { doctor_id: doctorId } : {})
      return res.data?.data?.data || res.data?.data || res.data || []
    },
  })

  return {
    doctors: doctorsQuery.data || [],
    chambers: chambersQuery.data || [],
    isLoadingLookups: doctorsQuery.isLoading || chambersQuery.isLoading,
    isError: doctorsQuery.isError || chambersQuery.isError,
  }
}

/**
 * Mutation hooks for Doctor Leave CRUD & Impact Checking
 */
export function useAdminDoctorLeaveMutations() {
  const queryClient = useQueryClient()

  // Create Leave
  const createMutation = useMutation({
    mutationFn: (data) => createDoctorLeave(data),
    onSuccess: (res, variables) => {
      invalidateLeaves(queryClient, { doctorId: variables?.doctor_id })
    },
  })

  // Delete Leave
  const deleteMutation = useMutation({
    mutationFn: ({ id, doctorId = null }) => deleteDoctorLeave(id),
    onSuccess: (_, { id, doctorId }) => {
      invalidateLeaves(queryClient, { leaveId: id, doctorId })
    },
  })

  return {
    createLeave: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    deleteLeave: (id, doctorId) => deleteMutation.mutateAsync({ id, doctorId }),
    isDeleting: deleteMutation.isPending,
  }
}
