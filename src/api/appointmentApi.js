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

// GET /api/doctors/:id/booked-slots
export const getBookedSlots = (doctorId, params) =>
  axiosInstance.get(`/doctors/${doctorId}/booked-slots`, { params })

// POST /api/appointments/:id/reschedule
export const rescheduleAppointment = (id, data) =>
  axiosInstance.post(`/appointments/${id}/reschedule`, data)

// Live Queue & Display Board APIs
export const getLiveQueue = (doctorId, chamberId, date) =>
  axiosInstance.get(`/doctor-queue/${doctorId}/${chamberId}`, { params: { date } })

export const callNextPatient = (doctorId, chamberId, date, appointmentId) =>
  axiosInstance.post(`/doctor-queue/${doctorId}/${chamberId}/call-next`, { date, appointment_id: appointmentId }, { skipGlobalToast: true })

export const completeConsultation = (id) =>
  axiosInstance.post(`/doctor-queue/appointments/${id}/complete`)

export const markNoShow = (id) =>
  axiosInstance.post(`/doctor-queue/appointments/${id}/no-show`)

export const recallNoShow = (id) =>
  axiosInstance.post(`/doctor-queue/appointments/${id}/recall`)

export const getPublicDisplayBoard = (token) =>
  axiosInstance.get(`/public-display/${token}`)

export const getHospitalLiveQueue = (hospitalId, date) =>
  axiosInstance.get(`/doctor-queue/hospital/${hospitalId}`, { params: { date } })

export const getPublicHospitalDisplayBoard = (hospitalId) =>
  axiosInstance.get(`/public-display/hospital/${hospitalId}`)

export const regenerateChamberToken = (chamberId) =>
  axiosInstance.post(`/doctor-queue/chambers/${chamberId}/regenerate-token`)

export const setChamberBreak = (chamberId, data) =>
  axiosInstance.post(`/doctor-queue/chambers/${chamberId}/break`, data)

