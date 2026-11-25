import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { getDashboardStats } from '../api/adminApi'
import { queryKeys } from '../lib/queryKeys'
import { getSeenCount, isItemSeen, pruneSeenItems } from '../utils/seenTracker'

/**
 * Universal Unread & Pending Indicators Hook.
 * Synchronizes Sidebar Green Balls with inside table row states in real time.
 * Supports Option 1: "Seen Tracking" - viewing an item immediately marks it seen
 * and clears both its inside row light and sidebar indicator.
 */
export function useUnreadIndicators() {
  const queryClient = useQueryClient()
  const [syncTick, setSyncTick] = useState(0)

  // Fetch admin stats (background poll every 20s, fresh for 15s)
  const { data: statsResponse } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      try {
        const res = await getDashboardStats()
        return res.data?.data || res.data || {}
      } catch (err) {
        return {}
      }
    },
    staleTime: 1000 * 3, // 3s fresh
    refetchInterval: 1000 * 5, // fast sync every 5s for real-time responsiveness
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
  })

  // Robust action_required extractor handling:
  // 1. Direct stats object: statsResponse.action_required
  // 2. Wrapped object: statsResponse.data.action_required
  // 3. Axios response: statsResponse.data.data.action_required
  const actionRequired = useMemo(() => {
    if (!statsResponse) return {}
    if (statsResponse?.action_required) return statsResponse.action_required
    if (statsResponse?.data?.action_required) return statsResponse.data.action_required
    if (statsResponse?.data?.data?.action_required) return statsResponse.data.data.action_required
    return {}
  }, [statsResponse])

  // Mapping of route paths to unread/pending count (with Seen offsets)
  const getUnreadCount = useCallback((path) => {
    if (!path) return 0
    const clean = path.split('?')[0].toLowerCase()

    if (clean.includes('/contact-messages')) {
      return Number(actionRequired.unread_contact_messages || 0)
    }
    if (clean.endsWith('/doctors')) {
      if (Array.isArray(actionRequired.pending_doctors)) {
        return actionRequired.pending_doctors.filter(d => !isItemSeen('doctors', d.id, d.public_id)).length
      }
      if (Array.isArray(actionRequired.pending_doctor_ids)) {
        return actionRequired.pending_doctor_ids.filter(id => !isItemSeen('doctors', id)).length
      }
      const raw = Number(actionRequired.inactive_doctors || 0)
      const seen = getSeenCount('doctors')
      return Math.max(0, raw - seen)
    }
    if (clean.endsWith('/hospitals') || clean.includes('/my-hospital')) {
      if (Array.isArray(actionRequired.pending_hospitals)) {
        return actionRequired.pending_hospitals.filter(h => !isItemSeen('hospitals', h.id, h.public_id)).length
      }
      if (Array.isArray(actionRequired.pending_hospital_ids)) {
        return actionRequired.pending_hospital_ids.filter(id => !isItemSeen('hospitals', id)).length
      }
      const raw = Number(actionRequired.inactive_hospitals || 0)
      const seen = getSeenCount('hospitals')
      return Math.max(0, raw - seen)
    }
    if (clean.includes('/doctor-leaves') || clean.includes('/my-leaves')) {
      const raw = Number(actionRequired.pending_leaves || 0)
      const seen = getSeenCount('leaves')
      return Math.max(0, raw - seen)
    }
    if (clean.includes('/appointments')) {
      if (Array.isArray(actionRequired.pending_appointments_list)) {
        return actionRequired.pending_appointments_list.filter(a => !isItemSeen('appointments', a.id, a.public_id)).length
      }
      if (Array.isArray(actionRequired.pending_appointment_ids)) {
        return actionRequired.pending_appointment_ids.filter(id => !isItemSeen('appointments', id)).length
      }
      const raw = Number(actionRequired.pending_appointments || 0)
      const seen = getSeenCount('appointments')
      return Math.max(0, raw - seen)
    }
    if (clean.includes('/services') || clean.includes('/support-tickets')) {
      const raw = Number(actionRequired.pending_tickets || 0)
      const seen = getSeenCount('services')
      return Math.max(0, raw - seen)
    }
    if (clean.includes('/reviews/reports')) {
      return Number(actionRequired.pending_reports || 0)
    }
    if (clean.includes('/reviews')) {
      return Number(actionRequired.pending_reviews || actionRequired.pending_reports || 0)
    }
    if (clean.includes('/commission') || clean.includes('/reports/commission')) {
      return Number(actionRequired.pending_commissions || 0)
    }
    if (clean.includes('/agent-payouts') || clean.includes('/payouts')) {
      const raw = Number(actionRequired.pending_payouts || 0)
      const seen = getSeenCount('payouts')
      return Math.max(0, raw - seen)
    }
    if (clean.includes('/billing/subscribers') || clean.includes('/billing/subscriptions') || clean.includes('/subscription')) {
      return Number(actionRequired.new_subscriptions || 0)
    }

    return 0
  }, [actionRequired, syncTick])

  const hasUnread = useCallback((path) => {
    return getUnreadCount(path) > 0
  }, [getUnreadCount])

  // Broadcast function to trigger instant sync across sidebar and pages
  const notifyUnreadUpdated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
    setSyncTick(t => t + 1)
    try {
      localStorage.setItem('unread-count-sync-broadcast', Date.now().toString())
    } catch {}
  }, [queryClient])

  // Listen to same-window and cross-tab sync events
  useEffect(() => {
    const handleSync = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
      queryClient.refetchQueries({ queryKey: queryKeys.dashboard.stats() })
      setSyncTick(t => t + 1)
    }
    const handleStorage = (e) => {
      if (e.key === 'unread-count-sync-broadcast') {
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.stats() })
        queryClient.refetchQueries({ queryKey: queryKeys.dashboard.stats() })
        setSyncTick(t => t + 1)
      }
    }

    window.addEventListener('unread-count-sync', handleSync)
    window.addEventListener('storage', handleStorage)

    return () => {
      window.removeEventListener('unread-count-sync', handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [queryClient])

  return {
    stats: statsResponse,
    actionRequired,
    getUnreadCount,
    hasUnread,
    notifyUnreadUpdated,
  }
}

export default useUnreadIndicators
