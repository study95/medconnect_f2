// src/lib/cacheBroadcast.js
/**
 * Enterprise Cross-Tab Realtime Cache Synchronizer
 * 
 * Uses standard BroadcastChannel API (0 network bandwidth, 0 server load, 0ms latency)
 * to instantly synchronize TanStack Query caches across open browser tabs
 * when mutations (active/inactive status toggles, edits, deletes) happen.
 */

import { clearSessionSnapshot } from './cacheSnapshot'

const CHANNEL_NAME = 'medconnect_cache_sync'
const STORAGE_KEY = 'mc_cache_sync_event'

let broadcastChannel = null

// Initialize BroadcastChannel safely in browser environments
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
  } catch (e) {
    console.warn('BroadcastChannel initialization failed, falling back to storage events', e)
  }
}

/**
 * Broadcast a cache invalidation event to other open tabs
 * @param {Object} event { type: 'DOCTORS_MUTATED' | 'HOSPITALS_MUTATED', payload: any }
 */
export function broadcastCacheEvent(event) {
  if (typeof window === 'undefined') return

  const message = {
    ...event,
    timestamp: Date.now(),
    tabId: window.__MEDCONNECT_TAB_ID__ || (window.__MEDCONNECT_TAB_ID__ = Math.random().toString(36).substring(2)),
  }

  // 1. Native BroadcastChannel
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(message)
    } catch (e) {
      console.warn('BroadcastChannel postMessage error:', e)
    }
  }

  // 2. LocalStorage Fallback for older browsers or if channel blocked
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(message))
  } catch (_) {}
}

/**
 * Handle incoming cross-tab event and invalidate matching queries
 */
function handleIncomingEvent(event, queryClient) {
  if (!event || !event.type || !queryClient) return

  // Prevent processing self-emitted storage events
  if (event.tabId && event.tabId === window.__MEDCONNECT_TAB_ID__) return

  const { type, payload } = event

  if (type === 'DOCTORS_MUTATED') {
    clearSessionSnapshot('doctors')
    clearSessionSnapshot('doctor_me')

    // Invalidate all public and admin doctor queries & homepage preview
    queryClient.invalidateQueries({ queryKey: ['doctors'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['doctors-infinite'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['doctor'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['doctor-related'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['hospital'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['hospitals-infinite'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['homepage'], refetchType: 'all' })

    // Dispatch DOM event for component-internal state (like QuickAppointmentPage)
    window.dispatchEvent(new CustomEvent('medconnect:doctors-updated', { detail: payload }))
  }

  if (type === 'HOSPITALS_MUTATED') {
    clearSessionSnapshot('hospitals')
    clearSessionSnapshot('hospital_me')
    clearSessionSnapshot('doctors')

    queryClient.invalidateQueries({ queryKey: ['hospitals'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['hospitals-infinite'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['hospital'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['hospital-related'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['doctors'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['doctors-infinite'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['doctor'], refetchType: 'all' })
    queryClient.invalidateQueries({ queryKey: ['homepage'], refetchType: 'all' })

    window.dispatchEvent(new CustomEvent('medconnect:hospitals-updated', { detail: payload }))
    window.dispatchEvent(new CustomEvent('medconnect:doctors-updated', { detail: payload }))
  }
}

/**
 * Initialize cross-tab sync listener in the root App
 */
export function initCacheBroadcastListener(queryClient) {
  if (typeof window === 'undefined' || !queryClient) return () => {}

  // 1. BroadcastChannel Listener
  const onChannelMessage = (e) => {
    handleIncomingEvent(e.data, queryClient)
  }

  if (broadcastChannel) {
    broadcastChannel.addEventListener('message', onChannelMessage)
  }

  // 2. Storage Event Listener (Fallback / Cross-Origin-like safety)
  const onStorageChange = (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue)
        handleIncomingEvent(parsed, queryClient)
      } catch (_) {}
    }
  }
  window.addEventListener('storage', onStorageChange)

  // Cleanup handler
  return () => {
    if (broadcastChannel) {
      broadcastChannel.removeEventListener('message', onChannelMessage)
    }
    window.removeEventListener('storage', onStorageChange)
  }
}
