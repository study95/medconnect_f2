// src/hooks/admin/useAdminSpecialties.js
/**
 * Enterprise Admin Specialty Query & Mutation Hooks
 *
 * Encapsulates all server-state logic for the Specialties Admin Module using TanStack Query.
 * Features:
 * - Query Key Factory integration (queryKeys.specialties.adminList / detail)
 * - staleTime / gcTime inheritance from QueryClient
 * - keepPreviousData for smooth pagination, search, and filtering
 * - Targeted cache invalidation on specialty creation, updates, and deletions
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { queryKeys } from '../../lib/queryKeys'
import { invalidateSpecialties } from '../../lib/cacheInvalidation'
import {
  getSpecialties,
  getSpecialty,
  createSpecialty,
  updateSpecialty,
  deleteSpecialty,
} from '../../api/adminApi'
import { getErrorMessage } from '../../utils/errorHelper'

/**
 * Hook to fetch admin specialties with server-side filters & caching
 */
export function useAdminSpecialties(filters = {}) {
  const query = useQuery({
    queryKey: queryKeys.specialties.adminList(filters),
    queryFn: async () => {
      const res = await getSpecialties({ per_page: 5000, ...filters })
      const raw = res.data?.data?.data || res.data?.data || res.data || []
      return Array.isArray(raw) ? raw : []
    },
    placeholderData: keepPreviousData,
  })

  return {
    specialties: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load specialties.') : null,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch single specialty details
 */
export function useAdminSpecialtyDetail(id) {
  const query = useQuery({
    queryKey: queryKeys.specialties.detail(id),
    queryFn: async () => {
      const res = await getSpecialty(id)
      const d = res.data?.data || res.data
      if (!d) return null
      return d.specialty || d
    },
    enabled: Boolean(id),
    placeholderData: keepPreviousData,
  })

  return {
    specialty: query.data || null,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error ? getErrorMessage(query.error, 'Failed to load specialty details.') : null,
    refetch: query.refetch,
  }
}

/**
 * Mutation hooks for Specialty CRUD with targeted cache invalidation
 */
export function useAdminSpecialtyMutations() {
  const queryClient = useQueryClient()

  // Create Specialty
  const createMutation = useMutation({
    mutationFn: (data) => createSpecialty(data),
    onSuccess: (_, variables) => {
      invalidateSpecialties(queryClient, { slug: variables?.slug })
    },
  })

  // Update Specialty
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateSpecialty(id, data),
    onSuccess: (_, { id, data }) => {
      invalidateSpecialties(queryClient, { specialtyId: id, slug: data?.slug })
    },
  })

  // Delete Specialty
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteSpecialty(id),
    onSuccess: (_, specialtyId) => {
      invalidateSpecialties(queryClient, { specialtyId })
    },
  })

  return {
    createSpecialty: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateSpecialty: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteSpecialty: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  }
}
