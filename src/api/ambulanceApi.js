import axiosInstance from './axiosInstance'

export const getAmbulances = (params = {}) =>
  axiosInstance.get('/ambulances', { params })
