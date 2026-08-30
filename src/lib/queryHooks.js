// src/lib/queryHooks.js
/**
 * Enterprise Shared Query & Mutation Foundation
 *
 * Provides standardized wrappers around TanStack Query's useQuery and useMutation.
 * Enforces uniform error extraction, loading state semantics, and automated cache invalidation.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { getErrorMessage } from '../utils/errorHelper'

/**
 * Standard enterprise query wrapper
 * @param {Array|string} queryKey - Unique query key array from queryKeys factory
 * @param {Function} queryFn - Async API function returning promise
 * @param {Object} options - Custom React Query options
 */
export function useAppQuery({ queryKey, queryFn, enabled = true, staleTime, select, ...options }) {
  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
    placeholderData: keepPreviousData,
    select,
    ...options,
  })

  return {
    ...query,
    errorMessage: query.isError ? getErrorMessage(query.error) : null,
  }
}

/**
 * Dedicated lookup query wrapper for static/semi-static master reference data (Divisions, Specialties, etc.)
 * Configured with a long staleTime (30 min) and cache retention (2 hours).
 */
export function useLookupQuery({ queryKey, queryFn, enabled = true, ...options }) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 30 * 60 * 1000,    // 30 minutes fresh
    gcTime: 2 * 60 * 60 * 1000,   // 2 hours retention
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options,
  })
}

/**
 * Standard enterprise mutation wrapper with automated cache invalidation
 * @param {Function} mutationFn - Async mutation function
 * @param {Object} config - Configuration containing onInvalidate / onSuccess / onError
 */
export function useAppMutation({ mutationFn, onInvalidate, onSuccess, onError, ...options } = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: async (data, variables, context) => {
      if (typeof onInvalidate === 'function') {
        await onInvalidate(queryClient, data, variables, context)
      }
      if (typeof onSuccess === 'function') {
        onSuccess(data, variables, context)
      }
    },
    onError: (error, variables, context) => {
      if (typeof onError === 'function') {
        onError(error, variables, context)
      }
    },
    retry: 0,
    ...options,
  })
}

export default {
  useAppQuery,
  useLookupQuery,
  useAppMutation,
}
