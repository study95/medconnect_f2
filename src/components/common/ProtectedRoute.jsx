// WHY THIS FILE EXISTS:
// Some pages (Book Appointment, My Appointments, Profile) should only
// be accessible when the user is logged in.
// Instead of adding an "if not logged in, redirect" check in EVERY page,
// we wrap those routes with this component once in App.jsx.
// Clean, DRY (Don't Repeat Yourself) approach.
//
// HOW IT WORKS:
// <ProtectedRoute> checks isLoggedIn from AuthContext.
// If true  → renders the page normally (children)
// If false → redirects to /login, but saves where the user was going
//            so after login we can send them back there (state={{ from }})

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth()
  const location = useLocation()

  // While checking localStorage on app start, show nothing
  // to avoid a flash of the redirect
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    // Save current location so we can redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute
