// WHY THIS FILE EXISTS:
// All login/register API calls live here.
// Pages just call these functions — they don't need to know
// about URLs or headers. Clean separation of concerns.

import axiosInstance from './axiosInstance'

// ===== LEGACY (kept for backward compat) =====
// POST /api/login — simple email+password
export const loginApi = (credentials) =>
  axiosInstance.post('/login', credentials)

// POST /api/register — simple name+email+password
export const registerApi = (userData) =>
  axiosInstance.post('/register', userData)

// ===== OTP SYSTEM =====
export const sendOtp = (data) =>
  axiosInstance.post('/send-otp', data) // { mobile }

export const verifyOtp = (data) =>
  axiosInstance.post('/verify-otp', data) // { mobile, otp }

// ===== PATIENT AUTH =====
export const patientRegisterApi = (data) =>
  axiosInstance.post('/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const patientLoginApi = (data) =>
  axiosInstance.post('/login', data)

export const patientCheckIdentifier = (data) =>
  axiosInstance.post('/check-identifier', data) // { identifier }

// ===== DOCTOR AUTH =====
export const doctorRegisterApi = (data) =>
  axiosInstance.post('/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const doctorLoginApi = (data) =>
  axiosInstance.post('/login', data)

export const doctorCheckIdentifier = (data) =>
  axiosInstance.post('/check-identifier', data) // { identifier }

// ===== HOSPITAL AUTH =====
export const hospitalRegisterApi = (data) =>
  axiosInstance.post('/register', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

export const hospitalLoginApi = (data) =>
  axiosInstance.post('/login', data)

export const hospitalCheckIdentifier = (data) =>
  axiosInstance.post('/check-identifier', data)

// ===== GOOGLE AUTH =====
export const googleLoginApi = (data) =>
  axiosInstance.post('/auth/google', data)

// ===== PROFILE (unified my-profile endpoint) =====
export const getMyProfile = () =>
  axiosInstance.get('/my-profile')

export const updateMyProfile = (data) =>
  axiosInstance.post('/my-profile', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

// Legacy aliases for backward compat
export const updatePatientProfile = (data) => updateMyProfile(data)
export const updateDoctorProfile = (data) => updateMyProfile(data)
export const updateHospitalProfile = (data) => updateMyProfile(data)

export const updatePasswordApi = (data) =>
  axiosInstance.post('/update-password', data)
