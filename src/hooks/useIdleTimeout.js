import { useState, useEffect, useRef, useCallback } from 'react'

const WARNING_WINDOW_MS = 60 * 1000 // Show countdown warning 60 seconds before logout
const ACTIVITY_THROTTLE_MS = 1000
const AUTH_CHANNEL_NAME = 'medconnect_auth_sync'

/**
 * Resolve role-based inactivity timeout duration in milliseconds.
 * Accepts optional live runtime overrides (in minutes) from /public/runtime-config.
 */
export function getRoleIdleTimeoutMs(userType, isAdmin, isStaff, isAgent, runtimeMinutes = null) {
  const adminMin = Math.max(5, Number(runtimeMinutes?.admin) || 15)
  const staffMin = Math.max(10, Number(runtimeMinutes?.staff) || 30)
  const agentMin = Math.max(15, Number(runtimeMinutes?.agent) || 60)
  const patientMin = Math.max(15, Number(runtimeMinutes?.patient) || 60)

  if (isAdmin || userType === 'admin') {
    return adminMin * 60 * 1000
  }
  if (isStaff || userType === 'doctor' || userType === 'hospital') {
    return staffMin * 60 * 1000
  }
  if (isAgent || userType === 'agent') {
    return agentMin * 60 * 1000
  }
  return patientMin * 60 * 1000
}

/**
 * Role-based inactivity auto-logout hook with multi-tab activity sync
 * and a 60-second grace-period warning modal.
 */
export default function useIdleTimeout({
  enabled,
  timeoutMs,
  onTimeout,
  onKeepAlive,
}) {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(60)
  const lastActivityRef = useRef(Date.now())
  const lastThrottleRef = useRef(0)
  const timedOutRef = useRef(false)
  const channelRef = useRef(null)
  const onTimeoutRef = useRef(onTimeout)
  const onKeepAliveRef = useRef(onKeepAlive)

  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    onKeepAliveRef.current = onKeepAlive
  }, [onKeepAlive])

  const recordActivity = useCallback((broadcast = true) => {
    const now = Date.now()
    lastActivityRef.current = now
    timedOutRef.current = false
    setShowWarning(false)

    if (broadcast) {
      try {
        channelRef.current?.postMessage({ type: 'ACTIVITY', timestamp: now })
      } catch {}
    }
  }, [])

  const stayLoggedIn = useCallback(() => {
    recordActivity(true)
    if (typeof onKeepAliveRef.current === 'function') {
      onKeepAliveRef.current()
    }
  }, [recordActivity])

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false)
      timedOutRef.current = false
      return
    }

    lastActivityRef.current = Date.now()
    timedOutRef.current = false

    // Multi-tab activity sync so working in Tab A keeps Tab B alive
    try {
      channelRef.current = new BroadcastChannel(AUTH_CHANNEL_NAME)
      channelRef.current.onmessage = (event) => {
        if (event?.data?.type === 'ACTIVITY' && typeof event.data.timestamp === 'number') {
          if (event.data.timestamp > lastActivityRef.current) {
            lastActivityRef.current = event.data.timestamp
            timedOutRef.current = false
            setShowWarning(false)
          }
        }
      }
    } catch {}

    const handleUserActivity = () => {
      // Do not auto-dismiss once warning modal is visible; user must explicitly click Stay Logged In
      if (Date.now() - lastActivityRef.current >= timeoutMs - WARNING_WINDOW_MS) {
        return
      }
      const now = Date.now()
      if (now - lastThrottleRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }
      lastThrottleRef.current = now
      recordActivity(true)
    }

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click']
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }))

    const ticker = setInterval(() => {
      if (timedOutRef.current) return

      const elapsed = Date.now() - lastActivityRef.current
      const remaining = timeoutMs - elapsed

      if (remaining <= 0) {
        timedOutRef.current = true
        setShowWarning(false)
        if (typeof onTimeoutRef.current === 'function') {
          onTimeoutRef.current()
        }
      } else if (remaining <= WARNING_WINDOW_MS) {
        setShowWarning(true)
        setRemainingSeconds(Math.max(1, Math.ceil(remaining / 1000)))
      } else {
        setShowWarning(false)
      }
    }, 1000)

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity))
      clearInterval(ticker)
      try {
        channelRef.current?.close()
        channelRef.current = null
      } catch {}
    }
  }, [enabled, timeoutMs, recordActivity])

  return {
    showWarning,
    remainingSeconds,
    stayLoggedIn,
  }
}
