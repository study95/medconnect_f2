import axiosInstance from './axiosInstance'

// ===== PUBLIC PHARMACY DIRECTORY =====
export const getPublicPharmacies = (params = {}) =>
  axiosInstance.get('/pharmacies', { params })

export const getPublicPharmacy = (slugOrId) =>
  axiosInstance.get(`/pharmacies/${slugOrId}`)

export const revealPharmacyContact = (id) =>
  axiosInstance.post(`/pharmacies/${id}/reveal-contact`, {}, { skipGlobalToast: true })

// ===== PATIENT / USER PHARMACY SELF-MANAGEMENT =====
export const getMyPharmacy = () =>
  axiosInstance.get('/user/pharmacy')

export const savePharmacy = (formData) =>
  axiosInstance.post('/user/pharmacy', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipGlobalToast: true,
  })

// ===== ADMIN PHARMACY VERIFICATION DESK =====
export const getAdminPharmacies = (params = {}) =>
  axiosInstance.get('/admin/pharmacies', { params })

export const getAdminPharmacyStats = () =>
  axiosInstance.get('/admin/pharmacies/stats')

export const getAdminPharmacy = (id) =>
  axiosInstance.get(`/admin/pharmacies/${id}`)

export const verifyAdminPharmacy = (id) =>
  axiosInstance.post(`/admin/pharmacies/${id}/verify`, {}, { skipGlobalToast: true })

export const rejectAdminPharmacy = (id, data) =>
  axiosInstance.post(`/admin/pharmacies/${id}/reject`, data, { skipGlobalToast: true })

export const updateAdminPharmacyStatus = (id, data) =>
  axiosInstance.patch(`/admin/pharmacies/${id}/status`, data, { skipGlobalToast: true })

export const deleteAdminPharmacy = (id) =>
  axiosInstance.delete(`/admin/pharmacies/${id}`, { skipGlobalToast: true })
