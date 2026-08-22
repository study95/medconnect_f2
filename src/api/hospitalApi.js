import axiosInstance from './axiosInstance'

// GET /api/hospitals
export const getHospitals = (params = {}) =>
  axiosInstance.get('/hospitals', { params })

// GET /api/hospitals/:district/:upazila/:slug (Canonical SEO Endpoint)
export const getHospitalBySlug = (district, upazila, slug) =>
  axiosInstance.get(`/hospitals/${district}/${upazila}/${slug}`)

// GET /api/hospitals/:id (Legacy / Fallback Endpoint)
export const getHospitalById = (id) =>
  axiosInstance.get(`/hospitals/${id}`)

// GET /api/hospitals/:identifier/related (Internal Linking Endpoint)
export const getHospitalRelated = (identifier) =>
  axiosInstance.get(`/hospitals/${identifier}/related`)
