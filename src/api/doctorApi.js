// WHY THIS FILE EXISTS:
// All doctor-related API calls in one place.
// The "params" object becomes query string automatically:
//   getDoctors({ search: 'john', division_id: 2 })
//   → GET /api/doctors?search=john&division_id=2
// Axios handles the URL encoding for us.

import axiosInstance from './axiosInstance'

// GET /api/doctors  (with optional filters)
// params can include: search, division_id, district_id, specialty_id, page, per_page
export const getDoctors = (params = {}) =>
  axiosInstance.get('/doctors', { params })

// GET /api/doctors/:district/:upazila/:slug (Canonical SEO Endpoint)
export const getDoctorBySlug = (district, upazila, slug) =>
  axiosInstance.get(`/doctors/${district}/${upazila}/${slug}`)

// GET /api/doctors/:id (Legacy / Fallback Endpoint)
export const getDoctorById = (id) =>
  axiosInstance.get(`/doctors/${id}`)

// GET /api/doctor-chambers  (schedule for a specific doctor)
export const getDoctorChambers = (params = {}) =>
  axiosInstance.get('/doctor-chambers', { params })

// GET /api/specialties (fetch all active specialties, up to 200)
export const getSpecialties = (params = { all: true, per_page: 200 }) =>
  axiosInstance.get('/specialties', { params })

// GET /api/doctors/:identifier/related (Internal Linking Endpoint)
export const getDoctorRelated = (identifier) =>
  axiosInstance.get(`/doctors/${identifier}/related`)

// POST /api/doctor/verification-documents
export const uploadDoctorVerificationDocuments = (formData) =>
  axiosInstance.post('/doctor/verification-documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// DELETE /api/doctor/verification-documents
export const deleteDoctorVerificationDocument = (type) =>
  axiosInstance.delete('/doctor/verification-documents', { data: { type } })

// POST /api/doctor/verification-documents/submit
export const submitDoctorVerificationApplication = () =>
  axiosInstance.post('/doctor/verification-documents/submit')
