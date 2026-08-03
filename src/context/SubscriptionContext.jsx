// SubscriptionContext.jsx — Provides subscription status to all components
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getSubscriptionStatus, getUnreadCount, getPopupNotifications } from '../api/subscriptionApi'

if (!window.__SubscriptionContext) {
  window.__SubscriptionContext = createContext(null)
}
const SubscriptionContext = window.__SubscriptionContext

export function SubscriptionProvider({ children }) {
  const { user, isDoctor, isAdmin, isLoggedIn } = useAuth()

  const [subscriptionData, setSubscriptionData] = useState({
    hasAccess: false,
    daysRemaining: null,
    expiryDate: null,
    showWarning: false,
    isTrial: false,
    subscription: null,
    trial: null,
    loaded: false,
  })

  const [unreadCount, setUnreadCount] = useState(0)
  const [popupNotifications, setPopupNotifications] = useState([])
  const [popupDismissed, setPopupDismissed] = useState(false)

  // Load subscription status from user data (comes from /me or /login)
  useEffect(() => {
    if (user?.subscription_status) {
      const ss = user.subscription_status
      setSubscriptionData({
        hasAccess: ss.has_access || false,
        daysRemaining: ss.days_remaining,
        expiryDate: ss.expiry_date,
        showWarning: ss.show_warning || false,
        isTrial: ss.is_trial || false,
        subscription: ss.subscription,
        trial: ss.trial,
        loaded: true,
      })
    } else {
      setSubscriptionData(prev => ({ ...prev, loaded: true }))
    }
  }, [user])

  // Fetch fresh subscription status
  const refreshSubscription = useCallback(async () => {
    if (!isLoggedIn || !isDoctor) return
    try {
      const res = await getSubscriptionStatus()
      const data = res.data?.data
      if (data) {
        setSubscriptionData({
          hasAccess: data.has_access || false,
          daysRemaining: data.days_remaining,
          expiryDate: data.expiry_date,
          showWarning: data.show_warning || false,
          isTrial: !data.subscription && !!data.trial,
          subscription: data.subscription,
          trial: data.trial,
          loaded: true,
        })
      }
    } catch (err) {
      console.error('Failed to fetch subscription status', err)
    }
  }, [isLoggedIn, isDoctor])

  // Fetch unread notification count
  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn || !isDoctor) return
    try {
      const res = await getUnreadCount()
      setUnreadCount(res.data?.count || 0)
    } catch (err) {}
  }, [isLoggedIn, isDoctor])

  // Fetch popup notifications on login
  const fetchPopups = useCallback(async () => {
    if (!isLoggedIn || !isDoctor || popupDismissed) return
    try {
      const res = await getPopupNotifications()
      setPopupNotifications(res.data?.data || [])
    } catch (err) {}
  }, [isLoggedIn, isDoctor, popupDismissed])

  useEffect(() => {
    if (isLoggedIn && isDoctor) {
      refreshUnreadCount()
      fetchPopups()
    }
  }, [isLoggedIn, isDoctor, refreshUnreadCount, fetchPopups])

  const dismissPopups = () => {
    setPopupDismissed(true)
    setPopupNotifications([])
  }

  // Admins and non-doctors always have access
  const hasActiveSubscription = isAdmin || !isDoctor || subscriptionData.hasAccess

  const value = {
    ...subscriptionData,
    hasActiveSubscription,
    refreshSubscription,
    unreadCount,
    refreshUnreadCount,
    popupNotifications,
    dismissPopups,
  }

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (!context) {
    throw new Error('useSubscription must be used inside SubscriptionProvider')
  }
  return context
}
