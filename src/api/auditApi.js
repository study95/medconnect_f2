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
 * Preview eligible routine audit logs count vs protected security records before pruning.
 * @param {Object} params - { days, date_before }
 */
export const previewAuditPrune = (params = {}) =>
  axiosInstance.get('/admin/audit-logs/prune-preview', { params })

/**
 * Prune routine audit log entries older than N days or before date_before (admin only).
 * Permanent immunity applies to high/critical risk logs and threat alerts.
 * @param {number|Object} params - number of days or object { days, date_before }
 */
export const clearOldAuditLogs = (params = 90) => {
  const queryParams = typeof params === 'number' ? { days: params } : params
  return axiosInstance.delete('/admin/audit-logs/clear', { params: queryParams })
}
