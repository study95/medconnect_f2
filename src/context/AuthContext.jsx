// AuthContext.jsx — Updated with dual patient/doctor auth flows and role-based helpers
// Every component can call useAuth() to check user role

import { createContext, useContext, useState, useEffect } from 'react'
import { loginApi, logoutApi, logoutAllApi, registerApi, patientLoginApi, doctorLoginApi, patientRegisterApi, doctorRegisterApi, hospitalLoginApi, hospitalRegisterApi } from '../api/authApi'
import axiosInstance from '../api/axiosInstance'
import { getErrorMessage } from '../utils/errorHelper'
import { toast } from 'react-hot-toast'
import { subscribeToUserChannel, subscribeToPublicDirectory, disconnectEcho, isWebSocketConnected, onConnectionStateChange } from '../utils/echoService'
import { queryClient } from '../lib/queryClient'
import { invalidateDoctors, invalidateHospitals } from '../lib/cacheInvalidation'
import { clearPersistedCache } from '../lib/cachePersister'
import useIdleTimeout, { getRoleIdleTimeoutMs } from '../hooks/useIdleTimeout'
import IdleWarningModal from '../components/auth/IdleWarningModal'
import SudoVerifyModal from '../components/auth/SudoVerifyModal'

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

let sharedAuthChannel = null
function getAuthSyncChannel() {
  if (typeof BroadcastChannel === 'undefined') return null
  if (!sharedAuthChannel) {
    try {
      sharedAuthChannel = new BroadcastChannel('medconnect_auth_sync')
    } catch {
      return null
    }
  }
  return sharedAuthChannel
}

function postAuthSync(payload) {
  try {
    getAuthSyncChannel()?.postMessage(payload)
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

    const clearLocalSession = () => {
      purgeClientSessionState()
      setUser(null)
      setUserType(null)
    }

    const syncSessionFromBroadcast = (userData, resolvedType) => {
      if (!userData) return
      setUser((prev) => {
        if (prev?.id && String(prev.id) !== String(userData.id)) {
          try {
            queryClient.clear()
            disconnectEcho()
          } catch {}
        }
        return userData
      })
      setUserType(resolvedType || null)
    }

    const handleAuthExpired = () => {
      clearLocalSession()
      postAuthSync({ type: 'LOGOUT' })
    }

    // Multi-tab auth sync via persistent BroadcastChannel
    const authChannel = getAuthSyncChannel()
    const handleChannelMessage = (event) => {
      if (event?.data?.type === 'LOGOUT') {
        clearLocalSession()
      } else if (event?.data?.type === 'LOGIN') {
        syncSessionFromBroadcast(event.data.user, event.data.userType)
      }
    }
    if (authChannel) {
      authChannel.addEventListener('message', handleChannelMessage)
    }

    // Fallback multi-tab sync via localStorage 'storage' event
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (!e.newValue) {
          clearLocalSession()
        } else {
          try {
            const rawUser = localStorage.getItem('user')
            const parsedUser = rawUser ? JSON.parse(rawUser) : null
            const storedType = localStorage.getItem('userType') || null
            syncSessionFromBroadcast(parsedUser, storedType)
          } catch {}
        }
      }
    }

    // Guard against browser back-forward cache (bfcache) showing stale authenticated UI after logout
    const handlePageShow = (e) => {
      if (e.persisted && !localStorage.getItem('token')) {
        clearLocalSession()
      }
    }

    window.addEventListener('auth-expired', handleAuthExpired)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('pageshow', handlePageShow)
    return () => {
      window.removeEventListener('auth-expired', handleAuthExpired)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('pageshow', handlePageShow)
      if (authChannel) {
        authChannel.removeEventListener('message', handleChannelMessage)
      }
    }
  }, [])

  const fetchCurrentUser = async (isBackgroundPoll = false) => {
    try {
      const response = await axiosInstance.get(
        '/me',
        isBackgroundPoll ? { headers: { 'X-Background-Poll': 'true' } } : undefined
      )
      if (response.data?.success) {
        const userData = response.data.user
        const rolesList = Array.isArray(userData.roles) 
          ? userData.roles.map(r => typeof r === 'object' ? (r.name || '') : String(r)).map(s => s.toLowerCase())
          : (userData.role ? [String(userData.role).toLowerCase()] : ['user'])
        const resolvedType = rolesList.includes('admin') || rolesList.includes('super-admin') ? 'admin' 
          : rolesList.includes('doctor') ? 'doctor' 
          : (rolesList.includes('manager') || rolesList.includes('hospital')) ? 'hospital' 
          : (userData?.registration_type === 'doctor' ? 'doctor' : userData?.registration_type === 'hospital' ? 'hospital' : 'user')

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
      if (err.response?.status >= 500) {
        console.warn('Backend server error on /me. Keeping current session alive.', err)
      }
    }
  }

  // Reverb WebSocket-First Sync with Throttled Focus & Disconnected Fallback Polling
  useEffect(() => {
    if (!user?.id) return

    let lastFocusFetch = 0
    const handleFocus = () => {
      const now = Date.now()
      if (now - lastFocusFetch >= 60000 && document.visibilityState === 'visible') {
        lastFocusFetch = now
        fetchCurrentUser(true)
      }
    }
    window.addEventListener('focus', handleFocus)

    let interval = null
    const syncPollingMode = (connected) => {
      if (interval) {
        clearInterval(interval)
        interval = null
      }
      // Only poll /me (every 60s) when Reverb WebSocket is disconnected
      if (!connected) {
        interval = setInterval(() => {
          if (document.visibilityState === 'visible') {
            fetchCurrentUser(true)
          }
        }, 60000)
      }
    }

    syncPollingMode(isWebSocketConnected())
    const unsubConn = onConnectionStateChange((state) => {
      syncPollingMode(state === 'connected')
    })

    return () => {
      window.removeEventListener('focus', handleFocus)
      unsubConn()
      if (interval) clearInterval(interval)
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
        },
        (e) => {
          toast.error(e?.message || 'নিরাপত্তা বা অ্যাকাউন্ট পরিবর্তনের কারণে আপনার সেশনটি বন্ধ করা হয়েছে।', {
            duration: 6000,
            id: 'force-logout-ws',
          })
          logout()
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
      : (userData?.registration_type === 'doctor' ? 'doctor' : userData?.registration_type === 'hospital' ? 'hospital' : (type || 'user'))
    localStorage.setItem('userType', resolvedType)
    setUser(userData)
    setUserType(resolvedType)
    postAuthSync({ type: 'LOGIN', user: userData, userType: resolvedType })
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

      // If backend triggers 2FA (Google Authenticator TOTP or SMS OTP)
      if (response.data?.requires_2fa) {
        return {
          success: false,
          requires_2fa: true,
          method: response.data.method || 'sms',
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

  const verifyDoctor2Fa = async ({ session_key, otp, code, trust_device = false }) => {
    try {
      const deviceName = typeof navigator !== 'undefined' && navigator.userAgent 
        ? (navigator.userAgent.includes('Windows') ? 'Windows PC' : navigator.userAgent.includes('Mac') ? 'Mac' : 'Mobile Browser') 
        : 'Web Browser'

      const inputVal = code || otp
      const response = await axiosInstance.post('/doctor-verify-2fa', {
        session_key,
        otp: inputVal,
        code: inputVal,
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

  const loginAsAgent = async (identifier, password) => {
    return login(identifier, password, 'agent')
  }

  const register = async (name, email, password) => {
    try {
      const response = await registerApi({ name, email, password, role: 'patient' })
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
        formData.append('role', 'patient')
        formData.append('type', 'patient')
      } else {
        formData.role = 'patient'
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
      return { 
        success: false, 
        message, 
        errors, 
        is_otp_expired: error.response?.data?.is_otp_expired || false,
        status: error.response?.status 
      }
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
      return { 
        success: false, 
        message, 
        errors, 
        is_otp_expired: error.response?.data?.is_otp_expired || false,
        status: error.response?.status 
      }
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
      return { 
        success: false, 
        message, 
        errors, 
        is_otp_expired: error.response?.data?.is_otp_expired || false,
        status: error.response?.status 
      }
    }
  }

  const performLogout = async (apiCall = logoutApi) => {
    const activeToken = localStorage.getItem('token')
    purgeClientSessionState()
    setUser(null)
    setUserType(null)
    postAuthSync({ type: 'LOGOUT' })

    if (activeToken) {
      try {
        await apiCall(activeToken)
      } catch {
        // Ignore network errors so client logout always succeeds immediately
      }
    }
  }

  const logout = () => performLogout(logoutApi)
  const logoutAll = () => performLogout(logoutAllApi)

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
  
  const isSuperAdmin = hasRole('super-admin');

  const isAdmin = 
    isSuperAdmin || hasRole('admin') || user?.role_id === 1;
    
  const isDoctor = 
    !isAdmin && (hasRole('doctor') || user?.role_id === 2 || String(user?.role_id) === 'doctor' || 
    Boolean(user?.is_doctor) || Boolean(user?.isDoctor));
    
  const isManager = 
    !isAdmin && !isDoctor && (hasRole('manager') || hasRole('hospital') || user?.role_id === 3 || String(user?.role_id) === 'manager' || String(user?.role_id) === 'hospital' ||
    Boolean(user?.is_manager) || Boolean(user?.isManager));

  // Determine pending verification status for Doctor or Hospital applicant
  const isPendingDoctor = 
    !isAdmin && !isDoctor && (
      user?.registration_type === 'doctor' ||
      (Boolean(user?.doctor) && user?.doctor?.is_active === false)
    );

  const isPendingHospital = 
    !isAdmin && !isManager && (
      user?.registration_type === 'hospital' ||
      (Boolean(user?.hospital) && user?.hospital?.is_active === false)
    );

  const isPendingVerification = isPendingDoctor || isPendingHospital;

  const isAgent = hasRole('agent') || Boolean(user?.agent);

  const isPatient = !isAdmin && !isDoctor && !isManager && !isAgent && !isPendingVerification;
    
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
    loginAsAgent,
    register,
    registerPatient,
    registerDoctor,
    registerHospital,
    logout,
    logoutAll,
    fetchCurrentUser,
    hasRole,
    hasPermission,
    isSuperAdmin,
    isAdmin,
    isDoctor,
    isDoctorOnly,
    isPendingDoctor,
    isPendingHospital,
    isPendingVerification,
    isPatient,
    isManager,
    isStaff,
    isAgent,
    getRoles,
  }

  const idleTimeoutMs = getRoleIdleTimeoutMs(userType, isAdmin, isStaff)
  const { showWarning, remainingSeconds, stayLoggedIn } = useIdleTimeout({
    enabled: !!user?.id,
    timeoutMs: idleTimeoutMs,
    onTimeout: () => {
      toast.error('দীর্ঘক্ষণ নিষ্ক্রিয় থাকায় নিরাপত্তার স্বার্থে আপনার সেশনটি স্বয়ংক্রিয়ভাবে বন্ধ করা হয়েছে।', {
        id: 'idle-auto-logout',
      })
      logout()
    },
    onKeepAlive: () => {
      // Non-poll request so backend resets last_activity_at
      fetchCurrentUser(false)
    },
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
      <IdleWarningModal
        show={showWarning}
        remainingSeconds={remainingSeconds}
        onStayLoggedIn={stayLoggedIn}
        onLogoutNow={logout}
      />
      <SudoVerifyModal />
    </AuthContext.Provider>
  )
}

const defaultAuth = {
  user: null,
  isLoggedIn: false,
  isAdmin: false,
  isDoctor: false,
  isPendingDoctor: false,
  isPendingHospital: false,
  isPendingVerification: false,
  isManager: false,
  isPatient: false,
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
