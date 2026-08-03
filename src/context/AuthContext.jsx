// AuthContext.jsx — Updated with dual patient/doctor auth flows and role-based helpers
// Every component can call useAuth() to check user role

import { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, registerApi, patientLoginApi, doctorLoginApi, patientRegisterApi, doctorRegisterApi, hospitalLoginApi, hospitalRegisterApi } from '../api/authApi'
import axiosInstance from '../api/axiosInstance'
import { getErrorMessage } from '../utils/errorHelper'

// Singleton pattern for AuthContext to prevent duplicate instances during HMR or module resolution mismatches
if (!window.__AuthContext) {
  window.__AuthContext = createContext(null)
}
export const AuthContext = window.__AuthContext

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userType, setUserType] = useState(null) // 'patient' | 'doctor' | null

  // On app start: restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    const savedUserType = localStorage.getItem('userType')
    
    const init = async () => {
      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser)
          setUser(parsed)
          setUserType(savedUserType || null)
          setLoading(false)
          fetchCurrentUser()
        } catch (e) {
          console.error("Auth init error:", e)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          localStorage.removeItem('userType')
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    init()

    const handleAuthExpired = () => {
      setUser(null)
      setUserType(null)
    }
    window.addEventListener('auth-expired', handleAuthExpired)
    return () => window.removeEventListener('auth-expired', handleAuthExpired)
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const response = await axiosInstance.get('/me')
      if (response.data?.success) {
        const userData = response.data.user
        setUser(userData)
        setUserType(userData.registration_type || null)
        localStorage.setItem('user', JSON.stringify(userData))
        if (userData.registration_type) localStorage.setItem('userType', userData.registration_type)
      }
    } catch (err) {
      if (err.response?.status === 401) {
        console.warn('Unauthorized. Clearing session.')
        logout()
        return
      }
      if (err.response?.status === 500) {
        console.warn('Backend crashed reading token on /me. Forcing logout to self-heal.')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userType')
        setUser(null)
        setUserType(null)
      }
    }
  }

  const storeAuth = (token, userData, type = null) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    if (type) localStorage.setItem('userType', type)
    setUser(userData)
    setUserType(type)
  }

  const login = async (email, password) => {
    try {
      const response = await loginApi({ email, password })
      const { token, user: userData } = response.data
      storeAuth(token, userData)
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error, 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      return { success: false, message }
    }
  }

  const loginAsPatient = async (identifier, password) => {
    try {
      const response = await patientLoginApi({ identifier, password })
      const { token, user: userData } = response.data
      storeAuth(token, userData, 'patient')
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error, 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      return { success: false, message }
    }
  }

  const loginAsDoctor = async (identifier, password) => {
    try {
      const response = await doctorLoginApi({ identifier, password })
      const { token, user: userData } = response.data
      storeAuth(token, userData, 'doctor')
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error, 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      return { success: false, message }
    }
  }

  const loginAsHospital = async (identifier, password) => {
    try {
      const response = await hospitalLoginApi({ identifier, password })
      const { token, user: userData } = response.data
      storeAuth(token, userData, 'hospital')
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error, 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      return { success: false, message }
    }
  }

  const register = async (name, email, password) => {
    try {
      const response = await registerApi({ name, email, password, role: 'user' })
      if (response.data?.token) {
        const { token, user: userData } = response.data
        storeAuth(token, userData)
      }
      return { success: true }
    } catch (error) {
      const message = getErrorMessage(error, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      return { success: false, message }
    }
  }

  const registerPatient = async (formData) => {
    try {
      if (formData instanceof FormData) {
        formData.append('role', 'user')
        formData.append('type', 'patient')
      } else {
        formData.role = 'user'
        formData.type = 'patient'
      }
      
      const response = await patientRegisterApi(formData)
      if (response.data?.token) {
        const { token, user: userData } = response.data
        storeAuth(token, userData, 'patient')
      }
      return { success: true, data: response.data }
    } catch (error) {
      const message = getErrorMessage(error, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      const errors = error.response?.data?.errors || {}
      return { success: false, message, errors }
    }
  }

  const registerDoctor = async (formData) => {
    try {
      if (formData instanceof FormData) {
        formData.append('role', 'user')
        formData.append('type', 'doctor')
      } else {
        formData.role = 'user'
        formData.type = 'doctor'
      }
 
      const response = await doctorRegisterApi(formData)
      if (response.data?.token) {
        const { token, user: userData } = response.data
        storeAuth(token, userData, 'doctor')
      }
      return { success: true, data: response.data }
    } catch (error) {
      const message = getErrorMessage(error, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      const errors = error.response?.data?.errors || {}
      return { success: false, message, errors }
    }
  }

  const registerHospital = async (formData) => {
    try {
      if (formData instanceof FormData) {
        formData.append('role', 'user')
        formData.append('type', 'hospital')
      } else {
        formData.role = 'user'
        formData.type = 'hospital'
      }
 
      const response = await hospitalRegisterApi(formData)
      if (response.data?.token) {
        const { token, user: userData } = response.data
        storeAuth(token, userData, 'hospital')
      }
      return { success: true, data: response.data }
    } catch (error) {
      const message = getErrorMessage(error, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      const errors = error.response?.data?.errors || {}
      return { success: false, message, errors }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('userType')
    setUser(null)
    setUserType(null)
  }

  const isLoggedIn = !!user

  const getRoles = () => {
    if (!user) return []
    
    let roles = []
    const rawRoles = user.roles || user.role || user.type || user.user_type
    
    if (Array.isArray(rawRoles)) {
      roles = rawRoles
    } else if (rawRoles) {
      roles = [rawRoles]
    }
    
    return roles.map(r => {
      if (typeof r === 'object' && r !== null) {
        return String(r.name || r.role || '').toLowerCase()
      }
      return String(r).toLowerCase()
    }).filter(Boolean)
  }

  const hasRole = (role) => getRoles().includes(role.toLowerCase())
  
  const isAdmin = 
    hasRole('admin') || user?.role_id === 1 || String(user?.role_id) === 'admin' || 
    Boolean(user?.is_admin) || Boolean(user?.isAdmin) || userType === 'admin';
    
  const isDoctor = 
    hasRole('doctor') || user?.role_id === 2 || String(user?.role_id) === 'doctor' || 
    Boolean(user?.is_doctor) || Boolean(user?.isDoctor) || userType === 'doctor';
  
  const isPatient =
    hasRole('patient') || hasRole('user') || userType === 'patient';
    
  const isManager = 
    hasRole('manager') || user?.role_id === 3 || String(user?.role_id) === 'manager' || 
    Boolean(user?.is_manager) || Boolean(user?.isManager) || userType === 'hospital' || userType === 'manager';
    
  const isStaff = isAdmin || isDoctor || isManager

  const hasPermission = (permissionName) => {
    if (isAdmin) return true;
    if (!user) return false;
    
    const permissions = user.permissions || [];
    if (Array.isArray(permissions)) {
      const perms = permissions.map(p => typeof p === 'object' ? p.name : p);
      if (perms.includes(permissionName)) return true;
    }

    return false;
  }

  const isDoctorOnly = isDoctor && !isAdmin && !isManager

  const value = {
    user,
    userType,
    isLoggedIn,
    loading,
    storeAuth,
    login,
    loginAsPatient,
    loginAsDoctor,
    loginAsHospital,
    register,
    registerPatient,
    registerDoctor,
    registerHospital,
    logout,
    fetchCurrentUser,
    hasRole,
    hasPermission,
    isAdmin,
    isDoctor,
    isDoctorOnly,
    isPatient,
    isManager,
    isStaff,
    getRoles,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    console.error('AuthContext is null. Component tree mismatch detected.');
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
