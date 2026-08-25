import axiosInstance from './axiosInstance'

/**
 * Pure API Client for DoctorBooklet Review & Rating Subsystem
 */
const reviewApi = {
  /**
   * Get paginated public reviews (optionally filtered by doctor_id, hospital_id, rating, sort)
   */
  getReviews: (params = {}) => axiosInstance.get('/v1/reviews', { params }),

  /**
   * Get single review by numeric ID or ULID public_id
   */
  getReview: (identifier) => axiosInstance.get(`/v1/reviews/${identifier}`),

  /**
   * Submit a new patient review for a completed appointment
   */
  createReview: (data) => axiosInstance.post('/v1/reviews', data),

  /**
   * Update an existing review within allowed edit window
   */
  updateReview: (identifier, data) => axiosInstance.put(`/v1/reviews/${identifier}`, data),

  /**
   * Soft-delete a review
   */
  deleteReview: (identifier) => axiosInstance.delete(`/v1/reviews/${identifier}`),

  /**
   * Post an official doctor or hospital reply to a review
   */
  createReply: (reviewIdentifier, data) =>
    axiosInstance.post(`/v1/reviews/${reviewIdentifier}/replies`, data),

  /**
   * Delete an official reply
   */
  deleteReply: (replyIdentifier) =>
    axiosInstance.delete(`/v1/review-replies/${replyIdentifier}`),

  /**
   * Flag/report a review for abuse or dispute
   */
  createReport: (reviewIdentifier, data) =>
    axiosInstance.post(`/v1/reviews/${reviewIdentifier}/reports`, data),

  /**
   * Admin: List reviews for moderation triage
   */
  getModerationReviews: (params = {}) =>
    axiosInstance.get('/v1/admin/reviews/moderation', { params }),

  /**
   * Admin: Moderate review status (approve, reject, hide, flag)
   */
  moderateReview: (identifier, data) =>
    axiosInstance.patch(`/v1/admin/reviews/${identifier}/moderate`, data),

  /**
   * Admin: List dispute reports
   */
  getModerationReports: (params = {}) =>
    axiosInstance.get('/v1/admin/reviews/reports', { params }),

  /**
   * Admin: Resolve a review report/dispute
   */
  resolveReport: (reportIdentifier, data) =>
    axiosInstance.patch(`/v1/admin/reviews/reports/${reportIdentifier}/resolve`, data),
}

export default reviewApi
