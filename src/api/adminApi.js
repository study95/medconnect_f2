// adminApi.js — All admin panel API calls organized by module
import axiosInstance from './axiosInstance'

// ===== DASHBOARD =====
export const getDashboardStats = () => axiosInstance.get('/admin/stats')
export const getDashboardAnalytics = (params) => axiosInstance.get('/admin/analytics', { params })

// ===== DOCTORS =====
export const getDoctors = (params) => axiosInstance.get('/doctors', { params })
export const getMyDoctorProfile = () => axiosInstance.get('/doctor/me')
export const getDoctorLookup = (params) => axiosInstance.get('/lookup/doctors', { params })
export const getDoctor = (id) => axiosInstance.get(`/doctors/${id}`)
export const createDoctor = (data) => axiosInstance.post('/doctors', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
export const updateDoctor = (id, data) => axiosInstance.post(`/doctors/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
export const deleteDoctor = (id) => axiosInstance.delete(`/doctors/${id}`)
export const bulkDeleteDoctors = (ids) => axiosInstance.post('/doctors/bulk-delete', { ids })

// ===== HOSPITALS =====
export const getHospitals = (params) => axiosInstance.get('/hospitals', { params })
export const getMyHospitalProfile = () => axiosInstance.get('/hospital/me')
export const getHospitalLookup = (params) => axiosInstance.get('/lookup/hospitals', { params })
export const getHospital = (id) => axiosInstance.get(`/hospitals/${id}`)
export const createHospital = (data) => axiosInstance.post('/hospitals', data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
export const updateHospital = (id, data) => axiosInstance.post(`/hospitals/${id}`, data, data instanceof FormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined)
export const deleteHospital = (id) => axiosInstance.delete(`/hospitals/${id}`)
export const bulkDeleteHospitals = (ids) => axiosInstance.post('/hospitals/bulk-delete', { ids })

// ===== SPECIALTIES =====
export const getSpecialties = (params) => axiosInstance.get('/specialties', { params })
export const getSpecialty = (id) => axiosInstance.get(`/specialties/${id}`)
export const createSpecialty = (data) => axiosInstance.post('/specialties', data)
export const updateSpecialty = (id, data) => axiosInstance.put(`/specialties/${id}`, data)
export const deleteSpecialty = (id) => axiosInstance.delete(`/specialties/${id}`)
export const approveSpecialty = (id) => axiosInstance.post(`/specialties/${id}/approve`)
export const rejectSpecialty = (id, data) => axiosInstance.post(`/specialties/${id}/reject`, data)

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
export const getAppointmentStats = () => axiosInstance.get('/appointments/summary-stats')
export const getAppointment = (id) => axiosInstance.get(`/appointments/${id}`)
export const createAppointment = (data) => axiosInstance.post('/appointments', data)
export const updateAppointment = (id, data) => axiosInstance.put(`/appointments/${id}`, data)
export const deleteAppointment = (id) => axiosInstance.delete(`/appointments/${id}`)
export const bulkDeleteAppointments = (ids) => axiosInstance.post('/appointments/bulk-delete', { ids })

// ===== USERS =====
export const getUsers = (params) => axiosInstance.get('/users', { params })
export const getUser = (id) => axiosInstance.get(`/users/${id}`)
export const updateUserRole = (id, role) => axiosInstance.put(`/users/${id}/role`, { role }, { skipGlobalToast: true })
export const toggleBlockUser = (id, isBlocked = null) => axiosInstance.put(`/users/${id}/block`, isBlocked !== null ? { is_blocked: isBlocked } : {}, { skipGlobalToast: true })
export const deleteUser = (id) => axiosInstance.delete(`/users/${id}`, { skipGlobalToast: true })
export const bulkDeleteUsers = (ids) => axiosInstance.post('/users/bulk-delete', { ids }, { skipGlobalToast: true })
export const getAllPermissions = () => axiosInstance.get('/permissions')
export const updateUserPermissions = (id, permissions) => axiosInstance.put(`/users/${id}/permissions`, { permissions }, { skipGlobalToast: true })

// ===== PATIENTS (Separate registration table) =====
export const getPatients = (params) => axiosInstance.get('/admin/patients', { params })
export const getPatientLookup = (params) => axiosInstance.get('/lookup/patients', { params })
export const getAdminPatient = (id) => axiosInstance.get(`/admin/patients/${id}`)
export const createAdminPatient = (data) => axiosInstance.post('/admin/patients', data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateAdminPatient = (id, data) => axiosInstance.post(`/admin/patients/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
export const deleteAdminPatient = (id) => axiosInstance.delete(`/admin/patients/${id}`)
export const bulkDeleteAdminPatients = (ids) => axiosInstance.post('/admin/patients/bulk-delete', { ids })

export const getPrescriptions = (params) => axiosInstance.get('/prescriptions', { params })
export const getPrescription = (id) => axiosInstance.get(`/prescriptions/${id}`)
export const createPrescription = (data) => axiosInstance.post('/prescriptions', data)
export const updatePrescription = (id, data) => axiosInstance.put(`/prescriptions/${id}`, data)
export const deletePrescription = (id) => axiosInstance.delete(`/prescriptions/${id}`)
export const finalizePrescription = (id, data = {}) => axiosInstance.post(`/prescriptions/${id}/finalize`, data)
export const copyPrescriptionMedicines = (prescriptionId, data = {}) => axiosInstance.post(`/prescriptions/${prescriptionId}/copy-medicines`, data)

// ===== PATIENT CLINICAL TIMELINE (EMR/HIS) =====
export const getPatientClinicalTimeline = (patientId, params) => axiosInstance.get(`/patients/${patientId}/clinical-timeline`, { params })

export const createWalkInPatient = (data) => axiosInstance.post('/doctor/patients', data)
export const checkPatientPhone = (phone) => axiosInstance.get('/patients/check-phone', { params: { phone } })
export const quickRegisterPatient = (data) => axiosInstance.post('/doctor/patients/quick-register', data)

// ===== DOCTOR FAVORITE MEDICINES & QUICK TEMPLATES (DATABASE-BACKED) =====
export const getDoctorFavoriteMedicines = () => axiosInstance.get('/doctor/favorite-medicines')
export const createDoctorFavoriteMedicine = (data) => axiosInstance.post('/doctor/favorite-medicines', data)
export const updateDoctorFavoriteMedicine = (id, data) => axiosInstance.put(`/doctor/favorite-medicines/${id}`, data)
export const deleteDoctorFavoriteMedicine = (id) => axiosInstance.delete(`/doctor/favorite-medicines/${id}`)

export const getDoctorQuickTemplates = () => axiosInstance.get('/doctor/quick-templates')
export const createDoctorQuickTemplate = (data) => axiosInstance.post('/doctor/quick-templates', data)
export const deleteDoctorQuickTemplate = (id) => axiosInstance.delete(`/doctor/quick-templates/${id}`)

export const getDoctorClinicalPresets = (params) => axiosInstance.get('/doctor/clinical-presets', { params })
export const createDoctorClinicalPreset = (data) => axiosInstance.post('/doctor/clinical-presets', data)
export const deleteDoctorClinicalPreset = (id) => axiosInstance.delete(`/doctor/clinical-presets/${id}`)

export const getDoctorCustomSections = (params) => axiosInstance.get('/doctor/custom-sections', { params })
export const createDoctorCustomSection = (data) => axiosInstance.post('/doctor/custom-sections', data)
export const updateDoctorCustomSection = (id, data) => axiosInstance.put(`/doctor/custom-sections/${id}`, data)
export const deleteDoctorCustomSection = (id) => axiosInstance.delete(`/doctor/custom-sections/${id}`)

// ===== MEDICINES (Full CRUD + Search) =====
export const getMedicines = (params) => axiosInstance.get('/medicines', { params })
export const getMedicine = (id) => axiosInstance.get(`/medicines/${id}`)
export const createMedicine = (data) => axiosInstance.post('/medicines', data)
export const updateMedicine = (id, data) => axiosInstance.put(`/medicines/${id}`, data)
export const deleteMedicine = (id) => axiosInstance.delete(`/medicines/${id}`)
export const bulkDeleteMedicines = (ids) => axiosInstance.post('/medicines/bulk-delete', { ids })
export const searchMedicines = (params) => axiosInstance.get('/medicines', { params })
export const getMedicineSuggestions = (params) => axiosInstance.get('/medicines/suggestions', { params })
export const getMedicineCompanies = () => axiosInstance.get('/medicines/companies')
export const getMedicinesPendingCount = () => axiosInstance.get('/medicines/pending-count')
export const importMedicinesCsv = (formData) => axiosInstance.post('/medicines/import-csv', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const approveMedicine = (id, data) => axiosInstance.put(`/medicines/${id}/approve`, data)
export const rejectMedicine = (id) => axiosInstance.put(`/medicines/${id}/reject`)

// ===== CLINICAL MASTERS (Investigations & Categories) =====
export const getInvestigations = (params) => axiosInstance.get('/investigations', { params })
export const getInvestigation = (id) => axiosInstance.get(`/investigations/${id}`)
export const createInvestigation = (data) => axiosInstance.post('/investigations', data)
export const updateInvestigation = (id, data) => axiosInstance.put(`/investigations/${id}`, data)
export const deleteInvestigation = (id) => axiosInstance.delete(`/investigations/${id}`)
export const bulkDeleteInvestigations = (ids) => axiosInstance.post('/investigations/bulk-delete', { ids })
export const toggleInvestigationActive = (id) => axiosInstance.patch(`/investigations/${id}/toggle-active`)
export const getInvestigationCategories = () => axiosInstance.get('/investigations/categories')
export const createInvestigationCategory = (data) => axiosInstance.post('/investigations/categories', data)
export const updateInvestigationCategory = (id, data) => axiosInstance.put(`/investigations/categories/${id}`, data)
export const deleteInvestigationCategory = (id) => axiosInstance.delete(`/investigations/categories/${id}`)
export const getGroupedInvestigations = () => axiosInstance.get('/investigations/grouped')
export const getInvestigationSuggestions = (params) => axiosInstance.get('/investigations/suggestions', { params })

// ===== CLINICAL MASTERS (Clinical Advice & Categories) =====
export const getClinicalAdvices = (params) => axiosInstance.get('/clinical-advices', { params })
export const getClinicalAdvice = (id) => axiosInstance.get(`/clinical-advices/${id}`)
export const createClinicalAdvice = (data) => axiosInstance.post('/clinical-advices', data)
export const updateClinicalAdvice = (id, data) => axiosInstance.put(`/clinical-advices/${id}`, data)
export const deleteClinicalAdvice = (id) => axiosInstance.delete(`/clinical-advices/${id}`)
export const bulkDeleteClinicalAdvices = (ids) => axiosInstance.post('/clinical-advices/bulk-delete', { ids })
export const toggleClinicalAdviceActive = (id) => axiosInstance.patch(`/clinical-advices/${id}/toggle-active`)
export const getAdviceCategories = () => axiosInstance.get('/clinical-advices/categories')
export const createAdviceCategory = (data) => axiosInstance.post('/clinical-advices/categories', data)
export const updateAdviceCategory = (id, data) => axiosInstance.put(`/clinical-advices/categories/${id}`, data)
export const deleteAdviceCategory = (id) => axiosInstance.delete(`/clinical-advices/categories/${id}`)
export const getGroupedClinicalAdvices = () => axiosInstance.get('/clinical-advices/grouped')
export const getClinicalAdviceSuggestions = (params) => axiosInstance.get('/clinical-advices/suggestions', { params })

// ===== PHARMACEUTICAL MASTERS (Companies & Dosage Types) =====
export const getCompanies = (params) => axiosInstance.get('/companies', { params })
export const getActiveCompanies = () => axiosInstance.get('/companies/active')
export const getCompany = (id) => axiosInstance.get(`/companies/${id}`)
export const createCompany = (data) => axiosInstance.post('/companies', data)
export const updateCompany = (id, data) => axiosInstance.put(`/companies/${id}`, data)
export const deleteCompany = (id) => axiosInstance.delete(`/companies/${id}`)
export const bulkDeleteCompanies = (ids) => axiosInstance.post('/companies/bulk-delete', { ids })
export const toggleCompanyActive = (id) => axiosInstance.patch(`/companies/${id}/toggle-active`)

export const getDosageTypes = (params) => axiosInstance.get('/dosage-types', { params })
export const getActiveDosageTypes = () => axiosInstance.get('/dosage-types/active')
export const getDosageType = (id) => axiosInstance.get(`/dosage-types/${id}`)
export const createDosageType = (data) => axiosInstance.post('/dosage-types', data)
export const updateDosageType = (id, data) => axiosInstance.put(`/dosage-types/${id}`, data)
export const deleteDosageType = (id) => axiosInstance.delete(`/dosage-types/${id}`)
export const bulkDeleteDosageTypes = (ids) => axiosInstance.post('/dosage-types/bulk-delete', { ids })
export const toggleDosageTypeActive = (id) => axiosInstance.patch(`/dosage-types/${id}/toggle-active`)

// ===== PACKAGE C: CLINICAL PRESETS & CREDENTIALS =====
// Chief Complaints
export const getChiefComplaints = (params) => axiosInstance.get('/chief-complaints', { params })
export const getActiveChiefComplaints = () => axiosInstance.get('/chief-complaints/active')
export const getChiefComplaintCategories = () => axiosInstance.get('/chief-complaints/categories')
export const createChiefComplaint = (data) => axiosInstance.post('/chief-complaints', data)
export const updateChiefComplaint = (id, data) => axiosInstance.put(`/chief-complaints/${id}`, data)
export const deleteChiefComplaint = (id) => axiosInstance.delete(`/chief-complaints/${id}`)
export const toggleChiefComplaintActive = (id) => axiosInstance.patch(`/chief-complaints/${id}/toggle-active`)
export const bulkDeleteChiefComplaints = (ids) => axiosInstance.post('/chief-complaints/bulk-delete', { ids })

// Dosage Frequencies
export const getDosageFrequencies = (params) => axiosInstance.get('/dosage-frequencies', { params })
export const getActiveDosageFrequencies = () => axiosInstance.get('/dosage-frequencies/active')
export const createDosageFrequency = (data) => axiosInstance.post('/dosage-frequencies', data)
export const updateDosageFrequency = (id, data) => axiosInstance.put(`/dosage-frequencies/${id}`, data)
export const deleteDosageFrequency = (id) => axiosInstance.delete(`/dosage-frequencies/${id}`)
export const toggleDosageFrequencyActive = (id) => axiosInstance.patch(`/dosage-frequencies/${id}/toggle-active`)

// Dosage Timings
export const getDosageTimings = (params) => axiosInstance.get('/dosage-timings', { params })
export const getActiveDosageTimings = (type = 'meal') => axiosInstance.get('/dosage-timings/active', { params: { type } })
export const createDosageTiming = (data) => axiosInstance.post('/dosage-timings', data)
export const updateDosageTiming = (id, data) => axiosInstance.put(`/dosage-timings/${id}`, data)
export const deleteDosageTiming = (id) => axiosInstance.delete(`/dosage-timings/${id}`)
export const toggleDosageTimingActive = (id) => axiosInstance.patch(`/dosage-timings/${id}/toggle-active`)

// Medical Degrees
export const getMedicalDegrees = (params) => axiosInstance.get('/medical-degrees', { params })
export const getActiveMedicalDegrees = () => axiosInstance.get('/medical-degrees/active')
export const createMedicalDegree = (data) => axiosInstance.post('/medical-degrees', data)
export const updateMedicalDegree = (id, data) => axiosInstance.put(`/medical-degrees/${id}`, data)
export const deleteMedicalDegree = (id) => axiosInstance.delete(`/medical-degrees/${id}`)
export const toggleMedicalDegreeActive = (id) => axiosInstance.patch(`/medical-degrees/${id}/toggle-active`)

// Doctor Designations
export const getDoctorDesignations = (params) => axiosInstance.get('/doctor-designations', { params })
export const getActiveDoctorDesignations = () => axiosInstance.get('/doctor-designations/active')
export const createDoctorDesignation = (data) => axiosInstance.post('/doctor-designations', data)
export const updateDoctorDesignation = (id, data) => axiosInstance.put(`/doctor-designations/${id}`, data)
export const deleteDoctorDesignation = (id) => axiosInstance.delete(`/doctor-designations/${id}`)
export const toggleDoctorDesignationActive = (id) => axiosInstance.patch(`/doctor-designations/${id}/toggle-active`)

// ===== PAYMENTS (filtered appointments view) =====
export const getPayments = (params) => axiosInstance.get('/appointments', { params: { ...params, per_page: 50 } })
export const updatePayment = (id, data) => axiosInstance.put(`/appointments/${id}`, data)
export const deletePayment = (id) => axiosInstance.delete(`/appointments/${id}`)
export const bulkDeletePayments = (ids) => axiosInstance.post('/appointments/bulk-delete', { ids })

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
export const getHospitalCommissionReport = (params) => axiosInstance.get('/hospital/commission-report', { params })
export const getDoctorCommissionReport = (params) => axiosInstance.get('/doctor/commission-report', { params })
export const bulkUpdateCommissionStatus = (data) => axiosInstance.post('/admin/commission-bulk-update', data)
export const getCommissionRequests = (params) => axiosInstance.get('/admin/commission-requests', { params })
export const getCommissionRequestDetails = (id) => axiosInstance.get(`/admin/commission-requests/${id}`)
export const approveCommissionRequest = (id, data = {}) => axiosInstance.post(`/admin/commission-requests/${id}/approve`, data)
export const rejectCommissionRequest = (id, data = {}) => axiosInstance.post(`/admin/commission-requests/${id}/reject`, data)
export const sendCommissionReminder = (data) => axiosInstance.post('/admin/commission-send-reminder', data)
export const doctorPayCommission = (data) => axiosInstance.post('/doctor/finance/pay-commission', data)
export const getDoctorCommissionRequests = (params) => axiosInstance.get('/doctor/finance/commission-requests', { params })
export const doctorRequestPayout = (data) => axiosInstance.post('/doctor/finance/withdraw', data)
export const hospitalPayCommission = (data) => axiosInstance.post('/hospital/finance/pay-commission', data)
export const getHospitalCommissionRequests = (params) => axiosInstance.get('/hospital/finance/commission-requests', { params })
export const hospitalRequestPayout = (data) => axiosInstance.post('/hospital/finance/withdraw', data)
export const getPurchaseReport = (params) => axiosInstance.get('/admin/purchase-report', { params })

// ===== CHAMBER TOGGLE =====
export const toggleChamberActive = (id) => axiosInstance.put(`/doctor-chambers/${id}/toggle-active`)

// ===== SMS & OTP GATEWAY SETTINGS =====
export const getAdminSmsSettings = () => axiosInstance.get('/admin/sms/settings')
export const updateAdminSmsSettings = (data) => axiosInstance.post('/admin/sms/settings', data)
export const sendAdminTestSms = (data) => axiosInstance.post('/admin/sms/test', data)
export const resetAdminSmsQuota = (data) => axiosInstance.post('/admin/sms/reset-quota', data)
export const getAdminSmsLogs = (params = {}) => axiosInstance.get('/admin/sms/logs', { params })
export const getAdminSmsBalance = (provider) => axiosInstance.get('/admin/sms/balance', { params: { provider } })
export const previewAdminSmsPrune = (data) => axiosInstance.post('/admin/sms/prune-preview', data)
export const executeAdminSmsPrune = (data) => axiosInstance.post('/admin/sms/prune-execute', data)
export const exportAdminSmsPrune = (params = {}) => axiosInstance.get('/admin/sms/prune-export', { params, responseType: 'blob' })

// ===== ENTERPRISE OBSERVABILITY & MONITORING SSO =====
export const getMonitoringSsoTicket = (target = 'pulse') => axiosInstance.post('/admin/monitoring/sso-ticket', { target })
export const getSystemTelemetry = (params = {}) => axiosInstance.get('/admin/telemetry', { params })


