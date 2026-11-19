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

// POST /api/hospital/verification-documents
export const uploadHospitalVerificationDocuments = (formData) =>
  axiosInstance.post('/hospital/verification-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// DELETE /api/hospital/verification-documents
export const deleteHospitalVerificationDocument = (type) =>
  axiosInstance.delete('/hospital/verification-documents', { data: { type } })

// POST /api/hospital/verification-documents/submit
export const submitHospitalVerificationApplication = () =>
  axiosInstance.post('/hospital/verification-documents/submit')

// POST /api/hospitals/:id/verify (Admin Only)
export const verifyHospital = (id, data) =>
  axiosInstance.post(`/hospitals/${id}/verify`, data)
