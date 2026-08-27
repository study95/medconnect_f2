import axiosInstance from './axiosInstance'

// GET /api/v1/doctor-leaves (with optional filters: doctor_id, per_page, page)
export const getDoctorLeaves = (params = {}) =>
  axiosInstance.get('/doctor-leaves', { params })

// POST /api/v1/doctor-leaves (Create new leave)
export const createDoctorLeave = (data) =>
  axiosInstance.post('/doctor-leaves', data)

// DELETE /api/v1/doctor-leaves/:id (Delete leave)
export const deleteDoctorLeave = (id) =>
  axiosInstance.delete(`/doctor-leaves/${id}`)

// GET /api/v1/doctor-leaves/check-impact (Read-only impact check for active bookings)
// params: { doctor_id, start_date, end_date, chamber_id? }
export const checkLeaveImpact = (params = {}) =>
  axiosInstance.get('/doctor-leaves/check-impact', { params })
