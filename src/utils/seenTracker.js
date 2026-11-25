import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'medconnect_admin_seen_items_v1'

/**
 * Low-level getter for seen IDs of a category
 */
export function getSeenIds(category) {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    return Array.isArray(data[category]) ? data[category].map(String) : []
  } catch {
    return []
  }
}

/**
 * Check if a specific item (or any of its alternative IDs, e.g. id or public_id) has been seen
 */
export function isItemSeen(category, ...ids) {
  if (!ids || ids.length === 0) return false
  const seen = getSeenIds(category)
  return ids.some(id => id && seen.includes(String(id)))
}

/**
 * Mark item(s) as seen by the admin, broadcasting instant sync to UI
 * Accepts multiple IDs (e.g. markItemSeen('doctors', doctor.id, doctor.public_id))
 */
export function markItemSeen(category, ...ids) {
  if (typeof window === 'undefined' || !ids || ids.length === 0) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const list = Array.isArray(data[category]) ? data[category].map(String) : []

    let changed = false
    ids.forEach(id => {
      if (id !== null && id !== undefined && id !== '') {
        const strId = String(id)
        if (!list.includes(strId)) {
          list.push(strId)
          changed = true
        }
      }
    })

    if (changed) {
      data[category] = list
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))

      // Broadcast to current window and other tabs
      window.dispatchEvent(new Event('unread-count-sync'))
      try {
        localStorage.setItem('unread-count-sync-broadcast', Date.now().toString())
      } catch {}
    }
  } catch (e) {
    console.error('Failed to mark item seen:', e)
  }
}

/**
 * Get total seen count for a category
 */
export function getSeenCount(category) {
  return getSeenIds(category).length
}

/**
 * Safe prune: only prune when explicitly provided a non-empty list of valid IDs
 */
export function pruneSeenItems(category, validPendingIds = []) {
  if (typeof window === 'undefined' || !Array.isArray(validPendingIds) || validPendingIds.length === 0) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const list = Array.isArray(data[category]) ? data[category].map(String) : []
    const validSet = new Set(validPendingIds.map(String))
    const pruned = list.filter(id => validSet.has(id))
    if (pruned.length !== list.length) {
      data[category] = pruned
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }
  } catch {}
}

/**
 * Reset or prune seen IDs for a category
 */
export function clearSeenItems(category) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    if (category) {
      delete data[category]
    } else {
      localStorage.removeItem(STORAGE_KEY)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new Event('unread-count-sync'))
  } catch {}
}

/**
 * React Hook for components (DoctorListPage, HospitalListPage, etc.)
 * Provides reactive `isSeen` and `markSeen` that trigger instant component re-render.
 * Also synchronizes on window focus and pageshow (bfcache navigation).
 */
export function useSeenTracker(category) {
  const [seenIds, setSeenIds] = useState(() => getSeenIds(category))

  useEffect(() => {
    const handleSync = () => {
      setSeenIds(getSeenIds(category))
    }
    window.addEventListener('unread-count-sync', handleSync)
    window.addEventListener('storage', handleSync)
    window.addEventListener('focus', handleSync)
    window.addEventListener('pageshow', handleSync)

    return () => {
      window.removeEventListener('unread-count-sync', handleSync)
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('focus', handleSync)
      window.removeEventListener('pageshow', handleSync)
    }
  }, [category])

  const markSeen = useCallback((...ids) => {
    markItemSeen(category, ...ids)
    setSeenIds(getSeenIds(category))
  }, [category])

  const isSeen = useCallback((...ids) => {
    if (!ids || ids.length === 0) return false
    // Check both local reactive state and live localStorage for zero-latency accuracy
    const liveIds = getSeenIds(category)
    return ids.some(id => id && (seenIds.includes(String(id)) || liveIds.includes(String(id))))
  }, [category, seenIds])

  return {
    seenIds,
    markSeen,
    isSeen,
    seenCount: seenIds.length,
  }
}

export default useSeenTracker
