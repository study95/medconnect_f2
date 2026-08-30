// src/hooks/admin/useAdminUsers.js
/**
 * Enterprise Admin User Management & Permissions Query & Mutation Hooks
 *
 * Encapsulates all server-state logic for the User Management Module using TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.users.adminList / permissions)
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth search, role filter, registration type filter, and pagination
 * - Targeted cache invalidation on role updates, permission changes, and user deletions
 * - Optimistic updates where safe
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateUsers } from '../../lib/cacheInvalidation'
import { useLookupQuery } from '../../lib/queryHooks'
import {
  getUsers,
  getUser,
  updateUserRole,
  deleteUser,
  getAllPermissions,
  updateUserPermissions,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch admin users list with server-side filters & caching
 */
export function useAdminUsers(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.users.adminList(filters),
    queryFn: async () => {
      const res = await getUsers({ per_page: 500, ...filters })
      const raw =
        res.data?.data?.data ||
        res.data?.data ||
        res.data?.users ||
        (Array.isArray(res.data) ? res.data : [])
      return Array.isArray(raw) ? raw : []
    },
    placeholderData: keepPreviousData,
  })

  return {
    users: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load users.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch all available permissions (30m lookup cache)
 */
export function useAdminPermissions() {
  const query = useLookupQuery({
    queryKey: queryKeys.users.permissions(),
    queryFn: async () => {
      const res = await getAllPermissions()
      return res.data?.data || res.data || []
    },
  })

  return {
    permissions: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/**
 * Mutation hooks for User Role, Permissions, and Deletion
 */
export function useAdminUserMutations() {
  const queryClient = useQueryClient()

  // Update Role Mutation
  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: (res, { userId }) => {
      invalidateUsers(queryClient, { userId })
    },
  })

  // Update Permissions Mutation
  const permissionsMutation = useMutation({
    mutationFn: ({ userId, permissions }) => updateUserPermissions(userId, permissions),
    onSuccess: (res, { userId }) => {
      invalidateUsers(queryClient, { userId, includePermissions: true })
    },
  })

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: (_, userId) => {
      invalidateUsers(queryClient, { userId })
    },
  })

  return {
    updateUserRole: roleMutation.mutateAsync,
    isUpdatingRole: roleMutation.isPending,
    updateUserPermissions: permissionsMutation.mutateAsync,
    isUpdatingPermissions: permissionsMutation.isPending,
    deleteUser: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
