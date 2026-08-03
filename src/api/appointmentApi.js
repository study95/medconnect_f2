import axiosInstance from './axiosInstance'

// POST /api/appointments  (requires login)
export const createAppointment = (data) =>
  axiosInstance.post('/appointments', data)

// GET /api/appointments  (admin sees all, user sees own)
export const getAppointments = () =>
  axiosInstance.get('/appointments')

// GET /api/appointments/:id
export const getAppointmentById = (id) =>
  axiosInstance.get(`/appointments/${id}`)

// PUT /api/appointments/:id  (user cancels their own via status update)
export const cancelAppointment = (id) =>
  axiosInstance.put(`/appointments/${id}`, { status: 'cancelled' })
