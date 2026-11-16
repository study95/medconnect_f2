// WHY THIS FILE EXISTS:
// Every API call needs the same base URL and (when logged in) the same
// Authorization header.  Instead of repeating that in 20 places, we create
// ONE configured axios instance here and import it everywhere.

import axios from 'axios'
import { toast } from 'react-hot-toast'

const DEVICE_FP_STORAGE_KEY = 'db_device_fp'

/**
 * Retrieve or generate a persistent cryptographic device fingerprint ID for this browser profile.
 * Used with Device-Bound Sanctum Tokens so stolen Bearer tokens cannot be replayed from another PC/browser.
 */
export const getDeviceFingerprint = () => {
  try {
    let fp = localStorage.getItem(DEVICE_FP_STORAGE_KEY)
    if (!fp || fp.length < 32) {
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(24)
        crypto.getRandomValues(bytes)
        fp = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
      } else {
        fp = `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
      }
      localStorage.setItem(DEVICE_FP_STORAGE_KEY, fp)
    }
    return fp
  } catch {
    return 'fallback-browser-device'
  }
}

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api', // ← from .env
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.headers['X-Device-Fingerprint'] = getDeviceFingerprint()
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => Promise.reject(error)
)

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const method = (error.config?.method || '').toLowerCase()
    const url = error.config?.url || ''

    const isPublicAuthRoute = 
      url.includes('/login') ||
      url.includes('/register') ||
      url.includes('/forgot-password') ||
      url.includes('/reset-password') ||
      url.includes('/send-otp') ||
      url.includes('/verify-otp') ||
      url.includes('/cancel-send-otp') ||
      url.includes('/cancel-verify') ||
      url.includes('/check-identifier')

    // Immediately terminate session if backend reports the user account has been blocked
    if (error.response?.status === 403 && error.response?.data?.code === 'ACCOUNT_BLOCKED') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userType')
      window.dispatchEvent(new Event('auth-expired'))

      const blockedMsg = error.response?.data?.message || 'আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত (Blocked) করা হয়েছে।'
      if (!isPublicAuthRoute && !error.config?.skipGlobalToast) {
        toast.error(blockedMsg, { id: 'account-blocked-alert' })
      }
      return Promise.reject(error)
    }

    // Immediately terminate session if backend revokes token due to device mismatch / replay attempt
    if (error.response?.status === 401 && error.response?.data?.code === 'DEVICE_MISMATCH_REVOKED') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userType')
      window.dispatchEvent(new Event('auth-expired'))

      const securityMsg = error.response?.data?.message || 'নিরাপত্তা সতর্কতা: অন্য ডিভাইস থেকে সেশন ব্যবহারের চেষ্টা শনাক্ত হওয়ায় পুনরায় লগইন করুন।'
      if (!isPublicAuthRoute && !error.config?.skipGlobalToast) {
        toast.error(securityMsg, { id: 'device-mismatch-alert' })
      }
      return Promise.reject(error)
    }

    // Only expire the authentication session if the core identity endpoint explicitly returns 401
    // This prevents accidental logouts when saving content, submitting forms, or handling specific permission errors
    if (error.response?.status === 401 && (url.includes('/me') || url.includes('/auth/check'))) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('userType')

      // Dispatch custom event to notify React app
      window.dispatchEvent(new Event('auth-expired'))
    }

    const skipGlobalToast = error.config?.skipGlobalToast || isPublicAuthRoute

    if (['post', 'put', 'patch', 'delete'].includes(method) && !skipGlobalToast) {
      // Skip global toast for 422 validation errors so pages can handle inline errors & auto-scroll cleanly
      if (error.response?.status !== 422 && error.response?.status !== 401) {
        const serverErr = error.response?.data?.message || error.response?.data?.error
        const toastErr = typeof serverErr === 'string' && serverErr.trim() ? serverErr : 'An error occurred while saving changes.'
        toast.error(toastErr, { id: `err-${method}-${url}` })
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
