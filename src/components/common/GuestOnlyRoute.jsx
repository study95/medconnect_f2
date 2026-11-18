import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/**
 * GuestOnlyRoute
 *
 * Prevents an already-authenticated browser session from opening login pages
 * in additional tabs and creating conflicting overlapping sessions.
 */
export default function GuestOnlyRoute({ children }) {
  const {
    isLoggedIn,
    isAdmin,
    isDoctor,
    isManager,
    isAgent,
    isPendingDoctor,
    isPendingHospital,
    loading,
  } = useAuth()

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (isLoggedIn) {
    if (isPendingDoctor || isPendingHospital) {
      return <Navigate to="/pending-verification" replace />
    }
    if (isAdmin) {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (isDoctor) {
      return <Navigate to="/doctor/dashboard" replace />
    }
    if (isManager) {
      return <Navigate to="/hospital/dashboard" replace />
    }
    if (isAgent) {
      return <Navigate to="/agent/dashboard" replace />
    }
    return <Navigate to="/profile" replace />
  }

  return children
}
