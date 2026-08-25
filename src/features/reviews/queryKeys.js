/**
 * Centralized React Query Key Factory for Reviews Subsystem
 */
export const reviewQueryKeys = {
  all: ['reviews'],
  lists: () => [...reviewQueryKeys.all, 'list'],
  list: (filters = {}) => [...reviewQueryKeys.lists(), filters],
  doctor: (doctorId, filters = {}) => [...reviewQueryKeys.lists(), 'doctor', String(doctorId), filters],
  hospital: (hospitalId, filters = {}) => [...reviewQueryKeys.lists(), 'hospital', String(hospitalId), filters],
  details: () => [...reviewQueryKeys.all, 'detail'],
  detail: (identifier) => [...reviewQueryKeys.details(), String(identifier)],
  moderation: (filters = {}) => [...reviewQueryKeys.all, 'moderation', filters],
  reports: (filters = {}) => [...reviewQueryKeys.all, 'reports', filters],
}
