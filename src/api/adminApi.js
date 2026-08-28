// adminApi.js — All admin panel API calls organized by module
import axiosInstance from './axiosInstance'

// ===== DASHBOARD =====
export const getDashboardStats = () => axiosInstance.get('/admin/stats')
export const getDashboardAnalytics = (params) => axiosInstance.get('/admin/analytics', { params })

// ===== DOCTORS =====
export const getDoctors = (params) => axiosInstance.get('/doctors', { params })
export const getDoctor = (id) => axiosInstance.get(`/doctors/${id}`)
export const createDoctor = (data) => axiosInstance.post('/doctors', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateDoctor = (id, data) => axiosInstance.post(`/doctors/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteDoctor = (id) => axiosInstance.delete(`/doctors/${id}`)

// ===== HOSPITALS =====
export const getHospitals = (params) => axiosInstance.get('/hospitals', { params })
export const getHospital = (id) => axiosInstance.get(`/hospitals/${id}`)
export const createHospital = (data) => axiosInstance.post('/hospitals', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateHospital = (id, data) => axiosInstance.post(`/hospitals/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteHospital = (id) => axiosInstance.delete(`/hospitals/${id}`)

// ===== SPECIALTIES =====
export const getSpecialties = (params) => axiosInstance.get('/specialties', { params })
export const getSpecialty = (id) => axiosInstance.get(`/specialties/${id}`)
export const createSpecialty = (data) => axiosInstance.post('/specialties', data)
export const updateSpecialty = (id, data) => axiosInstance.put(`/specialties/${id}`, data)
export const deleteSpecialty = (id) => axiosInstance.delete(`/specialties/${id}`)

// ===== DIVISIONS =====
export const getDivisions = () => axiosInstance.get('/divisions')
export const getDivision = (id) => axiosInstance.get(`/divisions/${id}`)
export const createDivision = (data) => axiosInstance.post('/divisions', data)
export const updateDivision = (id, data) => axiosInstance.put(`/divisions/${id}`, data)
export const deleteDivision = (id) => axiosInstance.delete(`/divisions/${id}`)

// ===== DISTRICTS =====
export const getDistricts = (params) => axiosInstance.get('/districts', { params })
export const getDistrict = (id) => axiosInstance.get(`/districts/${id}`)
export const createDistrict = (data) => axiosInstance.post('/districts', data)
export const updateDistrict = (id, data) => axiosInstance.put(`/districts/${id}`, data)
export const deleteDistrict = (id) => axiosInstance.delete(`/districts/${id}`)

// ===== UPAZILAS =====
export const getUpazilas = (params) => axiosInstance.get('/upazilas', { params })
export const getUpazila = (id) => axiosInstance.get(`/upazilas/${id}`)
export const createUpazila = (data) => axiosInstance.post('/upazilas', data)
export const updateUpazila = (id, data) => axiosInstance.put(`/upazilas/${id}`, data)
export const deleteUpazila = (id) => axiosInstance.delete(`/upazilas/${id}`)

// ===== UNIONS =====
export const getUnions = (params) => axiosInstance.get('/unions', { params })
export const getUnion = (id) => axiosInstance.get(`/unions/${id}`)
export const createUnion = (data) => axiosInstance.post('/unions', data)
export const updateUnion = (id, data) => axiosInstance.put(`/unions/${id}`, data)
export const deleteUnion = (id) => axiosInstance.delete(`/unions/${id}`)

// ===== DOCTOR CHAMBERS =====
export const getChambers = (params) => axiosInstance.get('/doctor-chambers', { params })
export const getChamber = (id) => axiosInstance.get(`/doctor-chambers/${id}`)
export const createChamber = (data) => axiosInstance.post('/doctor-chambers', data)
export const updateChamber = (id, data) => axiosInstance.put(`/doctor-chambers/${id}`, data)
export const deleteChamber = (id) => axiosInstance.delete(`/doctor-chambers/${id}`)

// ===== APPOINTMENTS =====
export const getAppointments = (params) => axiosInstance.get('/appointments', { params })
export const getAppointment = (id) => axiosInstance.get(`/appointments/${id}`)
export const createAppointment = (data) => axiosInstance.post('/appointments', data)
export const updateAppointment = (id, data) => axiosInstance.put(`/appointments/${id}`, data)
export const deleteAppointment = (id) => axiosInstance.delete(`/appointments/${id}`)

// ===== USERS =====
export const getUsers = (params) => axiosInstance.get('/users', { params })
export const getUser = (id) => axiosInstance.get(`/users/${id}`)
export const updateUserRole = (id, role) => axiosInstance.put(`/users/${id}/role`, { role })
export const deleteUser = (id) => axiosInstance.delete(`/users/${id}`)
export const getAllPermissions = () => axiosInstance.get('/permissions')
export const updateUserPermissions = (id, permissions) => axiosInstance.put(`/users/${id}/permissions`, { permissions })

// ===== PATIENTS (Separate registration table) =====
export const getPatients = (params) => axiosInstance.get('/admin/patients', { params })
export const getAdminPatient = (id) => axiosInstance.get(`/admin/patients/${id}`)
export const createAdminPatient = (data) => axiosInstance.post('/admin/patients', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateAdminPatient = (id, data) => axiosInstance.post(`/admin/patients/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteAdminPatient = (id) => axiosInstance.delete(`/admin/patients/${id}`)

// ===== PRESCRIPTIONS =====
export const getPrescriptions = (params) => axiosInstance.get('/prescriptions', { params })
export const getPrescription = (id) => axiosInstance.get(`/prescriptions/${id}`)
export const createPrescription = (data) => axiosInstance.post('/prescriptions', data)
export const updatePrescription = (id, data) => axiosInstance.put(`/prescriptions/${id}`, data)
export const deletePrescription = (id) => axiosInstance.delete(`/prescriptions/${id}`)

export const createWalkInPatient = (data) => axiosInstance.post('/doctor/patients', data)

// ===== MEDICINES (Full CRUD + Search) =====
export const getMedicines = (params) => axiosInstance.get('/medicines', { params })
export const getMedicine = (id) => axiosInstance.get(`/medicines/${id}`)
export const createMedicine = (data) => axiosInstance.post('/medicines', data)
export const updateMedicine = (id, data) => axiosInstance.put(`/medicines/${id}`, data)
export const deleteMedicine = (id) => axiosInstance.delete(`/medicines/${id}`)
export const searchMedicines = (params) => axiosInstance.get('/medicines', { params })

// ===== PAYMENTS (filtered appointments view) =====
export const getPayments = (params) => axiosInstance.get('/appointments', { params: { ...params, per_page: 50 } })
export const updatePayment = (id, data) => axiosInstance.put(`/appointments/${id}`, data)
export const deletePayment = (id) => axiosInstance.delete(`/appointments/${id}`)

// ===== COMMISSION & SERVICE ENABLEMENT =====
// Doctor service enablement
export const getServiceEnablements = (params = {}) => axiosInstance.get('/admin/service-enablements', { params: { per_page: 500, ...params } })
export const updateServiceEnablement = (doctorId, data) => axiosInstance.put(`/admin/service-enablements/${doctorId}`, data)

// Hospital commission settings
export const getHospitalCommissions = (params = {}) => axiosInstance.get('/admin/hospital-commissions', { params: { per_page: 500, ...params } })
export const updateHospitalCommission = (hospitalId, data) => axiosInstance.put(`/admin/hospital-commissions/${hospitalId}`, data)

// Patient booking commission (global)
export const getPatientBookingCommission = () => axiosInstance.get('/admin/patient-booking-commission')
export const updatePatientBookingCommission = (data) => axiosInstance.put('/admin/patient-booking-commission', data)

// ===== COMMISSION & PURCHASE REPORTS =====
export const getCommissionReport = (params) => axiosInstance.get('/admin/commission-report', { params })
export const bulkUpdateCommissionStatus = (data) => axiosInstance.post('/admin/commission-bulk-update', data)
export const getPurchaseReport = (params) => axiosInstance.get('/admin/purchase-report', { params })

// ===== CHAMBER TOGGLE =====
export const toggleChamberActive = (id) => axiosInstance.put(`/doctor-chambers/${id}/toggle-active`)
