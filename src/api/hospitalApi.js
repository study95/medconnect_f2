import axiosInstance from './axiosInstance'

// GET /api/hospitals
export const getHospitals = (params = {}) =>
  axiosInstance.get('/hospitals', { params })

// GET /api/hospitals/:id
export const getHospitalById = (id) =>
  axiosInstance.get(`/hospitals/${id}`)
