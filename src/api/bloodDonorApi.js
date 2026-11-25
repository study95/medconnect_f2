import axiosInstance from './axiosInstance'

export const getBloodDonors = (params = {}) =>
  axiosInstance.get('/blood-donors', { params })

export const getBloodDonor = (id) =>
  axiosInstance.get(`/blood-donors/${id}`)

export const revealDonorContact = (id) =>
  axiosInstance.post(`/blood-donors/${id}/reveal-contact`, {}, { skipGlobalToast: true })

export const getMyDonorProfile = () =>
  axiosInstance.get('/user/blood-donor-profile')

export const saveDonorProfile = (formData) =>
  axiosInstance.post('/user/blood-donor-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    skipGlobalToast: true,
  })

export const toggleDonorAvailability = () =>
  axiosInstance.patch('/user/blood-donor-profile/toggle-availability', {}, { skipGlobalToast: true })

export const logDonation = (data) =>
  axiosInstance.post('/user/blood-donor-profile/log-donation', data, { skipGlobalToast: true })

// ===== ADMIN BLOOD DONOR MANAGEMENT & COOLDOWN REVERT =====
export const getAdminBloodDonors = (params = {}) =>
  axiosInstance.get('/admin/blood-donors', { params })

export const getAdminBloodDonorStats = () =>
  axiosInstance.get('/admin/blood-donors/stats')

export const revertDonorDonation = (id) =>
  axiosInstance.post(`/admin/blood-donors/${id}/revert-donation`)

export const updateAdminDonorStatus = (id, data) =>
  axiosInstance.patch(`/admin/blood-donors/${id}/status`, data)

export const deleteAdminDonor = (id) =>
  axiosInstance.delete(`/admin/blood-donors/${id}`)
