// WHY THIS FILE EXISTS:
// Every API call needs the same base URL and (when logged in) the same
// Authorization header.  Instead of repeating that in 20 places, we create
// ONE configured axios instance here and import it everywhere.

import axios from 'axios'
import { toast } from 'react-hot-toast'

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
    return config
  },
  (error) => Promise.reject(error)
)

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toLowerCase()
    const url = response.config?.url || ''

    // Automatically trigger react-hot-toast for admin panel mutations (POST, PUT, PATCH, DELETE)
    if (['post', 'put', 'patch', 'delete'].includes(method) && !url.includes('/login') && !url.includes('/register') && !url.includes('/auth/check')) {
      const defaultMsg = method === 'delete' ? 'Item deleted successfully!' : 'Changes saved successfully!'
      const serverMsg = response.data?.message || response.data?.status
      const toastMsg = typeof serverMsg === 'string' && serverMsg.trim() ? serverMsg : defaultMsg
      toast.success(toastMsg, { id: `toast-${method}-${url}` })
    }

    return response
  },
  (error) => {
    const method = error.config?.method?.toLowerCase()
    const url = error.config?.url || ''

    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Dispatch custom event to notify React app
      window.dispatchEvent(new Event('auth-expired'))
    }

    if (['post', 'put', 'patch', 'delete'].includes(method) && !url.includes('/login')) {
      // Skip global toast for 422 validation errors so pages can handle inline errors & auto-scroll cleanly
      if (error.response?.status !== 422) {
        const serverErr = error.response?.data?.message || error.response?.data?.error
        const toastErr = typeof serverErr === 'string' && serverErr.trim() ? serverErr : 'An error occurred while saving changes.'
        toast.error(toastErr, { id: `err-${method}-${url}` })
      }
    }

    return Promise.reject(error)
  }
)

export default axiosInstance
