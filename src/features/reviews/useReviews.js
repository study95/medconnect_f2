import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import reviewApi from '../../api/reviewApi'
import { reviewQueryKeys } from './queryKeys'

/**
 * React Query Hook for fetching Doctor's public reviews
 */
export function useDoctorReviews(doctorId, filters = {}, options = {}) {
  return useQuery({
    queryKey: reviewQueryKeys.doctor(doctorId, filters),
    queryFn: async () => {
      const res = await reviewApi.getReviews({ doctor_id: doctorId, ...filters })
      return res.data
    },
    enabled: Boolean(doctorId),
    staleTime: 1000 * 60 * 2, // 2 minutes
    ...options,
  })
}

/**
 * React Query Hook for fetching Hospital's public reviews
 */
export function useHospitalReviews(hospitalId, filters = {}, options = {}) {
  return useQuery({
    queryKey: reviewQueryKeys.hospital(hospitalId, filters),
    queryFn: async () => {
      const res = await reviewApi.getReviews({ hospital_id: hospitalId, ...filters })
      return res.data
    },
    enabled: Boolean(hospitalId),
    staleTime: 1000 * 60 * 2,
    ...options,
  })
}

/**
 * React Query Hook for fetching a single review detail
 */
export function useReview(identifier, options = {}) {
  return useQuery({
    queryKey: reviewQueryKeys.detail(identifier),
    queryFn: async () => {
      const res = await reviewApi.getReview(identifier)
      return res.data
    },
    enabled: Boolean(identifier),
    ...options,
  })
}

/**
 * Mutation Hook for Patient creating a new review
 */
export function useCreateReview(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => reviewApi.createReview(payload),
    onSuccess: (data, variables) => {
      // Invalidate review feeds & moderation lists
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all })
      // Invalidate doctor & hospital profiles (refreshes rating_avg and reviews_count)
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
      queryClient.invalidateQueries({ queryKey: ['hospital'] })
      // Invalidate appointments queries so reviewed status updates immediately
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment'] })
    },
    ...options,
  })
}

/**
 * Mutation Hook for Patient updating a review
 */
export function useUpdateReview(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, data }) => reviewApi.updateReview(identifier, data),
    onSuccess: (data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
      queryClient.invalidateQueries({ queryKey: ['hospital'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment'] })
    },
    ...options,
  })
}

/**
 * Mutation Hook for deleting a review
 */
export function useDeleteReview(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (identifier) => reviewApi.deleteReview(identifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all })
      queryClient.invalidateQueries({ queryKey: ['doctor'] })
      queryClient.invalidateQueries({ queryKey: ['hospital'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] })
      queryClient.invalidateQueries({ queryKey: ['appointment'] })
    },
    ...options,
  })
}

/**
 * Mutation Hook for posting an official doctor/hospital reply
 */
export function useReplyReview(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reviewIdentifier, data }) => reviewApi.createReply(reviewIdentifier, data),
    onSuccess: (data, { reviewIdentifier }) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(reviewIdentifier) })
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() })
    },
    ...options,
  })
}

/**
 * Mutation Hook for deleting an official reply
 */
export function useDeleteReply(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (replyIdentifier) => reviewApi.deleteReply(replyIdentifier),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.all })
    },
    ...options,
  })
}

/**
 * Mutation Hook for reporting a review (flagging dispute/abuse)
 */
export function useReportReview(options = {}) {
  return useMutation({
    mutationFn: ({ reviewIdentifier, data }) => reviewApi.createReport(reviewIdentifier, data),
    ...options,
  })
}

/**
 * React Query Hook for Admin moderation review list
 */
export function useModerationReviews(filters = {}, options = {}) {
  return useQuery({
    queryKey: reviewQueryKeys.moderation(filters),
    queryFn: async () => {
      const res = await reviewApi.getModerationReviews(filters)
      return res.data
    },
    staleTime: 1000 * 30, // 30 seconds
    ...options,
  })
}

/**
 * Mutation Hook for Admin moderating a review
 */
export function useModerateReview(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ identifier, data }) => reviewApi.moderateReview(identifier, data),
    onSuccess: (data, { identifier }) => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.moderation() })
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.detail(identifier) })
    },
    ...options,
  })
}

/**
 * React Query Hook for Admin dispute reports list
 */
export function useModerationReports(filters = {}, options = {}) {
  return useQuery({
    queryKey: reviewQueryKeys.reports(filters),
    queryFn: async () => {
      const res = await reviewApi.getModerationReports(filters)
      return res.data
    },
    staleTime: 1000 * 30,
    ...options,
  })
}

/**
 * Mutation Hook for Admin resolving a dispute report
 */
export function useResolveReport(options = {}) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reportIdentifier, data }) => reviewApi.resolveReport(reportIdentifier, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.moderation() })
      queryClient.invalidateQueries({ queryKey: reviewQueryKeys.reports() })
    },
    ...options,
  })
}
