// SubscriptionContext.jsx — Provides subscription status to all components
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getSubscriptionStatus, getHospitalBillingOverview, getUnreadCount, getPopupNotifications } from '../api/subscriptionApi'

if (!window.__SubscriptionContext) {
  window.__SubscriptionContext = createContext(null)
}
const SubscriptionContext = window.__SubscriptionContext

export function SubscriptionProvider({ children }) {
  const { user, isDoctor, isAdmin, isManager, getRoles, isLoggedIn } = useAuth()
  const roles = getRoles ? getRoles() : []
  const isHospital = roles.includes('hospital') || roles.includes('manager') || Boolean(isManager)

  const [subscriptionData, setSubscriptionData] = useState({
    hasAccess: true,
    daysRemaining: null,
    expiryDate: null,
    showWarning: false,
    isTrial: false,
    isExpired: false,
    entityType: null,
    planName: null,
    subscription: null,
    trial: null,
    loaded: false,
  })

  const [unreadCount, setUnreadCount] = useState(0)
  const [popupNotifications, setPopupNotifications] = useState([])
  const [popupDismissed, setPopupDismissed] = useState(false)

  // Load initial subscription status from user data if available
  useEffect(() => {
    if (user?.subscription_status) {
      const ss = user.subscription_status
      const isTrial = Boolean(ss.is_trial)
      const daysRemaining = ss.days_remaining != null ? Number(ss.days_remaining) : null
      const hasAccess = Boolean(ss.has_access)
      const isExpired = !hasAccess || (daysRemaining !== null && daysRemaining <= 0)

      setSubscriptionData({
        hasAccess,
        daysRemaining,
        expiryDate: ss.expiry_date || null,
        showWarning: Boolean(ss.show_warning) || (daysRemaining !== null && daysRemaining <= 3),
        isTrial,
        isExpired,
        entityType: isDoctor ? 'doctor' : (isHospital ? 'hospital' : null),
        planName: ss.subscription?.name || null,
        subscription: ss.subscription,
        trial: ss.trial,
        loaded: true,
      })
    }
  }, [user, isDoctor, isHospital])

  // Fetch fresh subscription status for either Doctor or Hospital
  const refreshSubscription = useCallback(async () => {
    if (!isLoggedIn || isAdmin) return

    if (isDoctor) {
      try {
        const res = await getSubscriptionStatus()
        const data = res.data?.data
        if (data) {
          const isTrial = Boolean(data.is_trial || (!data.subscription && data.trial) || data.subscription?.plan?.tier === 'free')
          const daysRemaining = data.days_remaining != null ? Number(data.days_remaining) : null
          const hasAccess = Boolean(data.has_access)
          const isExpired = !hasAccess || (daysRemaining !== null && daysRemaining <= 0)

          setSubscriptionData({
            hasAccess,
            daysRemaining,
            expiryDate: data.expiry_date || null,
            showWarning: Boolean(data.show_warning) || (daysRemaining !== null && daysRemaining <= 3),
            isTrial,
            isExpired,
            entityType: 'doctor',
            planName: data.subscription?.package?.name || data.subscription?.plan?.name || (isTrial ? 'ডাক্তার ফ্রি ট্রায়াল' : null),
            subscription: data.subscription,
            trial: data.trial,
            loaded: true,
          })
        }
      } catch (err) {
        console.error('Failed to fetch doctor subscription status', err)
      }
    } else if (isHospital) {
      try {
        const res = await getHospitalBillingOverview()
        const overview = res?.data || res
        if (overview) {
          const banners = overview.banners || {}
          const status = overview.status || overview.current_plan?.status
          const isTrial = Boolean(banners.is_trial) || status === 'trialing' || overview.current_plan?.plan?.tier === 'free'
          const daysRemaining = banners.days_remaining != null ? Number(banners.days_remaining) : null
          const isExpired = Boolean(banners.is_expired) || status === 'expired' || (daysRemaining !== null && daysRemaining <= 0)
          const hasAccess = (status === 'active' || status === 'trialing') && !isExpired

          setSubscriptionData({
            hasAccess,
            daysRemaining,
            expiryDate: banners.ends_at ? new Date(banners.ends_at).toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : null,
            showWarning: Boolean(banners.is_expiring_soon) || (daysRemaining !== null && daysRemaining <= 3),
            isTrial,
            isExpired,
            entityType: 'hospital',
            planName: overview.current_plan?.plan?.name || (isTrial ? 'হাসপাতাল ফ্রি ট্রায়াল' : null),
            subscription: overview.current_plan,
            trial: isTrial ? overview.current_plan : null,
            loaded: true,
          })
        }
      } catch (err) {
        console.error('Failed to fetch hospital subscription status', err)
      }
    }
  }, [isLoggedIn, isAdmin, isDoctor, isHospital])

  // Fetch unread notification count
  const refreshUnreadCount = useCallback(async () => {
    if (!isLoggedIn) return
    try {
      const res = await getUnreadCount()
      const count = Number(res.data?.unread_count ?? res.data?.count ?? res.data?.data?.unread_count ?? res.data?.data?.count ?? 0)
      setUnreadCount(count)
    } catch (err) {}
  }, [isLoggedIn])

  // Fetch popup notifications on login
  const fetchPopups = useCallback(async () => {
    if (!isLoggedIn || popupDismissed) return
    try {
      const res = await getPopupNotifications()
      setPopupNotifications(res.data?.data || [])
    } catch (err) {}
  }, [isLoggedIn, popupDismissed])

  useEffect(() => {
    if (isLoggedIn) {
      refreshSubscription()
      refreshUnreadCount()
      fetchPopups()
    }
  }, [isLoggedIn, refreshSubscription, refreshUnreadCount, fetchPopups])

  const dismissPopups = () => {
    setPopupDismissed(true)
    setPopupNotifications([])
  }

  // Admins and non-provider roles always have access
  const hasActiveSubscription = isAdmin || (!isDoctor && !isHospital) || subscriptionData.hasAccess

  const value = {
    ...subscriptionData,
    hasActiveSubscription,
    isDoctor,
    isHospital,
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
