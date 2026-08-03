// WHY THIS FILE EXISTS:
// Every API call needs the same base URL and (when logged in) the same
// Authorization header.  Instead of repeating that in 20 places, we create
// ONE configured axios instance here and import it everywhere.

import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api', // ← from .env
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// REQUEST INTERCEPTOR
// This runs automatically BEFORE every request is sent.
// If the user is logged in, it grabs the token from localStorage
// and adds it to the Authorization header so protected routes work.
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
// This runs automatically AFTER every response comes back.
// If the server returns 401 (Unauthorized / token expired),
// we clear the stored login data and trigger an event
// so the UI can redirect cleanly without a hard page reload.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')

      // Dispatch custom event to notify React app
      window.dispatchEvent(new Event('auth-expired'))
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
