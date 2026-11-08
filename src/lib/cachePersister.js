// src/lib/cachePersister.js
// Enterprise IndexedDB Persistent Storage Adapter for TanStack Query
// Provides 0ms instant offline-first rendering across tab closures, phone restarts, and browser reloads.

import { get, set, del, createStore } from 'idb-keyval'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { queryClient } from './queryClient'

// Custom dedicated IndexedDB database and store for Doctor Booklet
const dbStore = typeof window !== 'undefined'
  ? createStore('DoctorBookletAppDB', 'ReactQueryClientStore')
  : null

const IDB_CACHE_KEY = 'doctor_booklet_persisted_cache'

/**
 * Enterprise IDB Persister with try/catch quota guard and private browsing safety
 */
export const idbPersister = {
  persistClient: async (client) => {
    if (!dbStore || typeof window === 'undefined') return
    try {
      await set(IDB_CACHE_KEY, client, dbStore)
    } catch (err) {
      // Graceful fallback: QuotaExceededError or security restriction (e.g. strict Safari private mode)
      console.warn('[CachePersister] Write to IndexedDB skipped (quota/privacy):', err?.message || err)
    }
  },
  restoreClient: async () => {
    if (!dbStore || typeof window === 'undefined') return undefined
    try {
      return await get(IDB_CACHE_KEY, dbStore)
    } catch (err) {
      console.warn('[CachePersister] Read from IndexedDB failed, starting fresh:', err?.message || err)
      return undefined
    }
  },
  removeClient: async () => {
    if (!dbStore || typeof window === 'undefined') return
    try {
      await del(IDB_CACHE_KEY, dbStore)
    } catch (err) {
      console.warn('[CachePersister] Removal from IndexedDB failed:', err?.message || err)
    }
  },
}

/**
 * STRICT ZERO-LEAKAGE SECURITY WHITELIST (Deny by Default):
 * Only explicitly audited public directory resources are permitted to persist to client disk.
 * All sensitive medical, patient, appointment, financial, prescription, or admin data
 * is strictly ephemeral and volatile in RAM only (never written to disk).
 */
export const ALLOWED_PERSISTENT_ROOT_KEYS = new Set([
  'homepage',
  'doctors-infinite',
  'hospitals-infinite',
  'doctor',
  'hospital',
  'specialties',
  'divisions',
  'districts',
  'upazilas',
  'unions',
  'services',
  'service-detail',
  'live-search-suggestions',
  'doctor-related',
  'hospital-related',
  'public-display-board',
  'lookup',
])

/**
 * Initialize persistent storage on application startup
 */
export function initQueryPersistence() {
  if (typeof window === 'undefined') return

  try {
    persistQueryClient({
      queryClient,
      persister: idbPersister,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours persistent lifetime
      buster: 'v2.1.0-cache',       // Cache invalidation buster: bump on schema changes
      dehydrateOptions: {
        shouldDehydrateQuery: (query) => {
          // 1. Only persist successfully completed queries
          if (query.state.status !== 'success') return false

          const rootKey = String(query.queryKey[0] || '')

          // 2. Strict Whitelist Check: Deny by default
          if (!ALLOWED_PERSISTENT_ROOT_KEYS.has(rootKey)) {
            return false
          }

          // 3. User Identity Guard: Never persist queries with user-scoped or auth-scoped identifiers
          const isUserScoped = query.queryKey.some(
            k => typeof k === 'string' && (
              k.startsWith('user_') ||
              k.startsWith('patient_') ||
              k.startsWith('admin_') ||
              k.includes('token')
            )
          )
          if (isUserScoped) {
            return false
          }

          return true
        },
      },
    })
  } catch (err) {
    console.warn('[CachePersister] Initialization warning:', err)
  }
}

/**
 * Clear all persistent cache on user logout or privacy reset
 */
export async function clearPersistedCache() {
  try {
    await idbPersister.removeClient()
    queryClient.clear()
  } catch (err) {
    console.warn('[CachePersister] clearPersistedCache error:', err)
  }
}
