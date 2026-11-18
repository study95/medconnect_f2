import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function AgentRoute({ children }) {
  const { isLoggedIn, isAgent, isAdmin, isDoctor, isManager, isPendingDoctor, isPendingHospital, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to="/login/agent" state={{ from: location }} replace />
  }

  // Redirect pending applicants to the verification status page
  if (isPendingDoctor || isPendingHospital) {
    return <Navigate to="/pending-verification" replace />
  }

  // Strictly allow only Agents and Admins into the Agent Portal
  if (isAgent || isAdmin) {
    return children
  }

  // Redirect Doctors or Hospital Managers cleanly to their respective dashboards
  if (isDoctor) {
    return <Navigate to="/doctor/dashboard" replace />
  }
  if (isManager) {
    return <Navigate to="/hospital/dashboard" replace />
  }

  return <Navigate to="/" replace />
}
