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

// GET /api/specialties
export const getSpecialties = () =>
  axiosInstance.get('/specialties')
