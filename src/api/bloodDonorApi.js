import axiosInstance from './axiosInstance'

export const getBloodDonors = (params = {}) =>
  axiosInstance.get('/blood-donors', { params })

export const getBloodDonor = (id) =>
  axiosInstance.get(`/blood-donors/${id}`)

export const revealDonorContact = (id) =>
  axiosInstance.post(`/blood-donors/${id}/reveal-contact`)

export const getMyDonorProfile = () =>
  axiosInstance.get('/user/blood-donor-profile')

export const saveDonorProfile = (formData) =>
  axiosInstance.post('/user/blood-donor-profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const toggleDonorAvailability = () =>
  axiosInstance.patch('/user/blood-donor-profile/toggle-availability')

export const logDonation = (data) =>
  axiosInstance.post('/user/blood-donor-profile/log-donation', data)
