// WHY THIS FILE EXISTS:
// Divisions and Districts power the chained dropdown filters.
// When a user picks a division, we call getDistricts({ division_id })
// to load only that division's districts — not all districts.

import axiosInstance from './axiosInstance'

export const getDivisions = () =>
  axiosInstance.get('/divisions')

// Pass division_id to get only districts for that division
export const getDistricts = (params = {}) =>
  axiosInstance.get('/districts', { params })

export const getUpazilas = (params = {}) =>
  axiosInstance.get('/upazilas', { params })

export const getUnions = (params = {}) =>
  axiosInstance.get('/unions', { params })
