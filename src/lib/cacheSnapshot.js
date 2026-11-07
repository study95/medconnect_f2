// src/lib/cacheSnapshot.js
// Enterprise Session Snapshot Storage for 0ms Zero-Skeleton Instant Navigation
import { getActorCacheScope } from './queryKeys'

/**
 * Retrieve cached snapshot from sessionStorage for instant 0ms mount.
 */
export function getSessionSnapshot(moduleName, defaultVal = undefined) {
  if (typeof window === 'undefined') return defaultVal
  try {
    const actor = getActorCacheScope()
    const key = `mc_snap_${moduleName}_${actor}`
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      return parsed ?? defaultVal
    }
  } catch (err) {
    // Graceful fallback on parse error
  }
  return defaultVal
}

/**
 * Persist lightweight snapshot into sessionStorage.
 */
export function saveSessionSnapshot(moduleName, data) {
  if (typeof window === 'undefined' || !data) return
  try {
    const actor = getActorCacheScope()
    const key = `mc_snap_${moduleName}_${actor}`
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    // Graceful fallback on quota error
  }
}
