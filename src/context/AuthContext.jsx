// AuthContext.jsx — Updated with dual patient/doctor auth flows and role-based helpers
// Every component can call useAuth() to check user role

import { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, logoutApi, registerApi, patientLoginApi, doctorLoginApi, patientRegisterApi, doctorRegisterApi, hospitalLoginApi, hospitalRegisterApi } from '../api/authApi'
import axiosInstance from '../api/axiosInstance'
import { getErrorMessage } from '../utils/errorHelper'
import { toast } from 'react-hot-toast'
import { subscribeToUserChannel, subscribeToPublicDirectory, disconnectEcho } from '../utils/echoService'
import { queryClient } from '../lib/queryClient'
import { invalidateDoctors, invalidateHospitals } from '../lib/cacheInvalidation'
import { clearPersistedCache } from '../lib/cachePersister'

/**
 * Purge all client-side session, draft, WebSocket, and TanStack Query caches.
 * Prevents cross-tenant data leakage when switching between Admin, Doctor,
 * Hospital, and Patient accounts in the same browser.
 */
function purgeClientSessionState() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  localStorage.removeItem('userType')

  try {
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('dr_rx_draft_') || key.startsWith('dr_notes_'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  } catch {}

  try {
    sessionStorage.clear()
  } catch {}

  try {
    queryClient.clear()
    clearPersistedCache()
  } catch {}

  try {
    disconnectEcho()
  } catch {}
}

// Singleton pattern for AuthContext to prevent duplicate instances during HMR or module resolution mismatches
if (!window.__AuthContext) {
  window.__AuthContext = createContext(null)
}
export const AuthContext = window.__AuthContext

export function AuthProvider({ children }) {
  // Synchronous session hydration for instant 0ms mount (eliminates blank spinner/guest mismatch on reload)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    return !(savedToken && savedUser)
  })
  const [userType, setUserType] = useState(() => {
    return localStorage.getItem('userType') || null
  })

  // On app start: restore and verify session from localStorage
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
          purgeClientSessionState()
          setUser(null)
          setUserType(null)
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    init()

    const handleAuthExpired = () => {
      purgeClientSessionState()
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
        const rolesList = Array.isArray(userData.roles) 
          ? userData.roles.map(r => typeof r === 'object' ? (r.name || '') : String(r)).map(s => s.toLowerCase())
          : (userData.role ? [String(userData.role).toLowerCase()] : ['user'])
        const resolvedType = rolesList.includes('admin') || rolesList.includes('super-admin') ? 'admin' 
          : rolesList.includes('doctor') ? 'doctor' 
          : (rolesList.includes('manager') || rolesList.includes('hospital')) ? 'hospital' 
          : 'user'

        setUser((prevUser) => {
          if (prevUser && prevUser.id === userData.id) {
            const prevDocActive = prevUser.doctor?.is_active
            const newDocActive = userData.doctor?.is_active
            if (prevDocActive !== undefined && newDocActive !== undefined && prevDocActive !== newDocActive) {
              invalidateDoctors(queryClient, { doctorId: userData?.doctor?.id, includeChambers: true })
              queryClient.invalidateQueries({ queryKey: ['doctor', 'my-profile'] })
              queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] })
              window.dispatchEvent(new CustomEvent('profile-status-updated', { detail: { is_active: newDocActive, doctor_id: userData?.doctor?.id, role: resolvedType } }))
            }
          }
          return userData
        })

        setUserType(resolvedType)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('userType', resolvedType)
      }
    } catch (err) {
      if (err.response?.status === 401 || (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_BLOCKED')) {
        console.warn('Session unauthorized or blocked. Clearing session.')
        logout()
        return
      }
      if (err.response?.status === 500) {
        console.warn('Backend crashed reading token on /me. Forcing logout to self-heal.')
        purgeClientSessionState()
        setUser(null)
        setUserType(null)
      }
    }
  }

  // Automatic Background Fallback & Tab Focus Sync (Guarantee zero-reload updates)
  useEffect(() => {
    if (!user?.id) return

    const handleFocus = () => {
      fetchCurrentUser()
    }
    window.addEventListener('focus', handleFocus)

    // Fallback polling every 8s when the tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchCurrentUser()
      }
    }, 8000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [user?.id])

  // Live Status Synchronization (WebSockets via Reverb & Laravel Echo)
  useEffect(() => {
    // 1. Subscribe to Public Directory Channel (Updates cached directory lists for everyone live)
    const unsubPublic = subscribeToPublicDirectory(
      (e) => {
        invalidateDoctors(queryClient, { doctorId: e.doctor_id, includeChambers: true })
        queryClient.invalidateQueries({ queryKey: ['doctors-infinite'] })
        queryClient.invalidateQueries({ queryKey: ['doctors'] })
        window.dispatchEvent(new CustomEvent('directory-doctor-updated', { detail: e }))
      },
      (e) => {
        invalidateHospitals(queryClient, { hospitalId: e.hospital_id, includeChambers: true })
        queryClient.invalidateQueries({ queryKey: ['hospitals-infinite'] })
        queryClient.invalidateQueries({ queryKey: ['hospitals'] })
        window.dispatchEvent(new CustomEvent('directory-hospital-updated', { detail: e }))
      }
    )

    // 2. Subscribe to Private User Channel (Only if user is logged in)
    let unsubUser = null
    if (user?.id) {
      unsubUser = subscribeToUserChannel(
        user.id,
        (e) => {
          fetchCurrentUser()
          invalidateDoctors(queryClient, { doctorId: e.doctor_id, includeChambers: true })
          queryClient.invalidateQueries({ queryKey: ['doctor', 'my-profile'] })
          queryClient.invalidateQueries({ queryKey: ['doctor', 'dashboard'] })
          window.dispatchEvent(new CustomEvent('profile-status-updated', { detail: e }))

          if (e.is_active) {
            toast.success(e.message || 'আপনার ডাক্তার প্রোফাইলটি সক্রিয় করা হয়েছে এবং ১৪ দিনের ফ্রি ট্রায়াল চালু হয়েছে!', { duration: 6000, id: `doc-active-${e.doctor_id}` })
          } else {
            toast.error(e.message || 'আপনার ডাক্তার প্রোফাইলটি নিষ্ক্রিয় করা হয়েছে।', { duration: 6000, id: `doc-inactive-${e.doctor_id}` })
          }
        },
        (e) => {
          fetchCurrentUser()
          invalidateHospitals(queryClient, { hospitalId: e.hospital_id, includeChambers: true })
          queryClient.invalidateQueries({ queryKey: ['hospital', 'billing', 'overview'] })
          queryClient.invalidateQueries({ queryKey: ['hospital', 'subscription'] })
          window.dispatchEvent(new CustomEvent('profile-status-updated', { detail: e }))

          if (e.is_active) {
            toast.success(e.message || 'আপনার হাসপাতাল প্রোফাইলটি সক্রিয় করা হয়েছে এবং ১৪ দিনের ফ্রি ট্রায়াল চালু হয়েছে!', { duration: 6000, id: `hosp-active-${e.hospital_id}` })
          } else {
            toast.error(e.message || 'আপনার হাসপাতাল প্রোফাইলটি নিষ্ক্রিয় করা হয়েছে।', { duration: 6000, id: `hosp-inactive-${e.hospital_id}` })
          }
        }
      )
    }

    return () => {
      if (typeof unsubPublic === 'function') unsubPublic()
      if (typeof unsubUser === 'function') unsubUser()
    }
  }, [user?.id])

  const storeAuth = (token, userData, type = null) => {
    // If switching between different user accounts in the same browser tab,
    // immediately purge the previous account's TanStack Query cache & WebSocket channels.
    try {
      const prevRaw = localStorage.getItem('user')
      const prevUser = prevRaw ? JSON.parse(prevRaw) : null
      if (prevUser?.id && String(prevUser.id) !== String(userData?.id)) {
        queryClient.clear()
        disconnectEcho()
      }
    } catch {}

    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    const rolesList = Array.isArray(userData?.roles) 
      ? userData.roles.map(r => typeof r === 'object' ? (r.name || '') : String(r)).map(s => s.toLowerCase())
      : (userData?.role ? [String(userData.role).toLowerCase()] : [])
    const resolvedType = rolesList.includes('admin') || rolesList.includes('super-admin') ? 'admin' 
      : rolesList.includes('doctor') ? 'doctor' 
      : (rolesList.includes('manager') || rolesList.includes('hospital')) ? 'hospital' 
      : (type || 'user')
    localStorage.setItem('userType', resolvedType)
    setUser(userData)
    setUserType(resolvedType)
  }

  const login = async (email, password, role = null) => {
    try {
      const deviceToken = localStorage.getItem('doctor_trusted_device_token') || 
                          localStorage.getItem('hospital_trusted_device_token') || 
                          localStorage.getItem('provider_trusted_device_token') || null
      const response = await loginApi({ 
        email, 
        identifier: email, 
        password, 
        role, 
        type: role,
        device_token: deviceToken
      })

      // If backend triggers 2FA for New Device on Doctor or Hospital role
      if (response.data?.requires_2fa) {
        return {
          success: false,
          requires_2fa: true,
          role: response.data.role || role,
          session_key: response.data.session_key,
          masked_mobile: response.data.masked_mobile,
          message: response.data.message
        }
      }

      const { token, user: userData } = response.data
      storeAuth(token, userData)
      return { success: true, user: userData }
    } catch (error) {
      const message = getErrorMessage(error, 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      return { success: false, message }
    }
  }

  const verifyDoctor2Fa = async ({ session_key, otp, trust_device = false }) => {
    try {
      const deviceName = typeof navigator !== 'undefined' && navigator.userAgent 
        ? (navigator.userAgent.includes('Windows') ? 'Windows PC' : navigator.userAgent.includes('Mac') ? 'Mac' : 'Mobile Browser') 
        : 'Web Browser'

      const response = await axiosInstance.post('/doctor-verify-2fa', {
        session_key,
        otp,
        trust_device,
        device_name: deviceName
      })

      if (response.data?.success) {
        const { token, user: userData, trusted_device_token } = response.data
        if (trusted_device_token) {
          localStorage.setItem('doctor_trusted_device_token', trusted_device_token)
          localStorage.setItem('hospital_trusted_device_token', trusted_device_token)
          localStorage.setItem('provider_trusted_device_token', trusted_device_token)
        }
        storeAuth(token, userData)
        return { success: true, user: userData }
      }
      return { success: false, message: response.data?.message || 'যাচাইকরণ ব্যর্থ হয়েছে।' }
    } catch (error) {
      const message = getErrorMessage(error, 'ভুল সিকিউরিটি কোড! সঠিক কোডটি দিন।')
      return { success: false, message }
    }
  }

  const loginAsPatient = async (identifier, password) => {
    return login(identifier, password, 'patient')
  }

  const loginAsDoctor = async (identifier, password) => {
    return login(identifier, password, 'doctor')
  }

  const loginAsHospital = async (identifier, password) => {
    return login(identifier, password, 'hospital')
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
        formData.append('role', 'doctor')
        formData.append('type', 'doctor')
      } else {
        formData.role = 'doctor'
        formData.type = 'doctor'
      }
 
      const response = await doctorRegisterApi(formData)
      if (response.data?.token) {
        const { token, user: userData } = response.data
        storeAuth(token, userData, 'user')
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
        formData.append('role', 'hospital')
        formData.append('type', 'hospital')
      } else {
        formData.role = 'hospital'
        formData.type = 'hospital'
      }
 
      const response = await hospitalRegisterApi(formData)
      if (response.data?.token) {
        const { token, user: userData } = response.data
        storeAuth(token, userData, 'user')
      }
      return { success: true, data: response.data }
    } catch (error) {
      const message = getErrorMessage(error, 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।')
      const errors = error.response?.data?.errors || {}
      return { success: false, message, errors }
    }
  }

  const logout = () => {
    const activeToken = localStorage.getItem('token')
    purgeClientSessionState()
    setUser(null)
    setUserType(null)

    // Revoke Sanctum token(s) server-side asynchronously without blocking UI navigation
    if (activeToken) {
      logoutApi(activeToken).catch(() => {})
    }
  }

  const isLoggedIn = !!user

  const getRoles = () => {
    if (!user) return []
    
    let roles = []
    const rawRoles = user.roles || user.role
    
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
    hasRole('admin') || hasRole('super-admin') || user?.role_id === 1;
    
  const isDoctor = 
    !isAdmin && (hasRole('doctor') || user?.role_id === 2 || String(user?.role_id) === 'doctor' || 
    Boolean(user?.is_doctor) || Boolean(user?.isDoctor));
    
  const isManager = 
    !isAdmin && !isDoctor && (hasRole('manager') || hasRole('hospital') || user?.role_id === 3 || String(user?.role_id) === 'manager' || String(user?.role_id) === 'hospital' ||
    Boolean(user?.is_manager) || Boolean(user?.isManager));

  const isPatient = !isAdmin && !isDoctor && !isManager;
    
  const isStaff = isAdmin || isDoctor || isManager;

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
    verifyDoctor2Fa,
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

const defaultAuth = {
  user: null,
  isLoggedIn: false,
  isAdmin: false,
  isDoctor: false,
  isManager: false,
  loading: false,
  getRoles: () => [],
  hasRole: () => false,
  hasPermission: () => false,
  login: () => Promise.resolve(),
  logout: () => {},
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    return defaultAuth
  }
  return context
}
