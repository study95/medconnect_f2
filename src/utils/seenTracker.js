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
 * Check if a specific item has been seen
 */
export function isItemSeen(category, id) {
  if (!id) return false
  const ids = getSeenIds(category)
  return ids.includes(String(id))
}

/**
 * Mark an item as seen by the admin, broadcasting instant sync to UI
 */
export function markItemSeen(category, id) {
  if (!id || typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    const list = Array.isArray(data[category]) ? data[category].map(String) : []
    const strId = String(id)

    if (!list.includes(strId)) {
      list.push(strId)
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
 * Automatically prunes seen IDs that are no longer in the pending list (e.g. approved or deleted)
 */
export function pruneSeenItems(category, validPendingIds = []) {
  if (typeof window === 'undefined' || !Array.isArray(validPendingIds)) return
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
 */
export function useSeenTracker(category) {
  const [seenIds, setSeenIds] = useState(() => getSeenIds(category))

  useEffect(() => {
    const handleSync = () => {
      setSeenIds(getSeenIds(category))
    }
    window.addEventListener('unread-count-sync', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('unread-count-sync', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [category])

  const markSeen = useCallback((id) => {
    markItemSeen(category, id)
    setSeenIds(getSeenIds(category))
  }, [category])

  const isSeen = useCallback((id) => {
    return seenIds.includes(String(id))
  }, [seenIds])

  return {
    seenIds,
    markSeen,
    isSeen,
    seenCount: seenIds.length,
  }
}

export default useSeenTracker
