import axiosInstance from './axiosInstance'

/**
 * Get paginated, filterable audit logs (admin only).
 * @param {Object} params - { search, module, action, user_id, risk_level, ip_address, date_from, date_to, per_page, page }
 */
export const getAuditLogs = (params = {}) =>
  axiosInstance.get('/admin/audit-logs', { params })

/**
 * Get a single audit log entry with full diff detail.
 * @param {number|string} id
 */
export const getAuditLog = (id) =>
  axiosInstance.get(`/admin/audit-logs/${id}`)

/**
 * Get summary stats for the audit log dashboard widget.
 */
export const getAuditStats = () =>
  axiosInstance.get('/admin/audit-logs/stats')

/**
 * Export filtered audit logs as CSV.
 * @param {Object} params - same filters as getAuditLogs
 */
export const exportAuditLogs = (params = {}) =>
  axiosInstance.get('/admin/audit-logs/export', {
    params,
    responseType: 'blob',
  })

/**
 * Delete audit log entries older than N days (admin only).
 * @param {number} days - minimum 30, default 365
 */
export const clearOldAuditLogs = (days = 365) =>
  axiosInstance.delete('/admin/audit-logs/clear', { params: { days } })
