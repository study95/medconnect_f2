import { useEffect, useState } from 'react'
import axiosInstance from '../api/axiosInstance'

const EVENT_NAME = 'runtime-config-updated'
const CACHE_TTL_MS = 60 * 1000

const envTurnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''

let currentConfig = {
  turnstile: {
    enabled: Boolean(envTurnstileSiteKey),
    site_key: envTurnstileSiteKey,
  },
  idle_timeouts_minutes: {
    admin: 15,
    staff: 30,
    agent: 60,
    patient: 60,
  },
  maintenance: {
    enabled: false,
    title: 'সিস্টেম রক্ষণাবেক্ষণ চলছে',
    message: 'আরও উন্নত ও নিরাপদ সেবার জন্য আমাদের প্ল্যাটফর্মে সাময়িক আপগ্রেডের কাজ চলছে। অনুগ্রহ করে কিছুক্ষণ পর পুনরায় চেষ্টা করুন।',
  },
  banner: {
    enabled: false,
    type: 'info',
    text: '',
  },
  _loaded: false,
}

let lastFetchedAt = 0
let inFlightPromise = null

function notifyListeners() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: currentConfig }))
  }
}

export function getRuntimeConfig() {
  return currentConfig
}

export async function fetchRuntimeConfig(force = false) {
  const now = Date.now()
  if (!force && lastFetchedAt > 0 && now - lastFetchedAt < CACHE_TTL_MS) {
    return currentConfig
  }
  if (inFlightPromise && !force) {
    return inFlightPromise
  }

  inFlightPromise = axiosInstance
    .get('/public/runtime-config', {
      skipGlobalToast: true,
      headers: { 'X-Background-Poll': 'true' },
    })
    .then((res) => {
      const data = res?.data?.data
      if (data && typeof data === 'object') {
        const siteKey = data.turnstile?.site_key || envTurnstileSiteKey
        const turnstileEnabled = Boolean(data.turnstile?.enabled && siteKey)
        currentConfig = {
          turnstile: {
            enabled: turnstileEnabled,
            site_key: siteKey,
          },
          idle_timeouts_minutes: {
            admin: Number(data.idle_timeouts_minutes?.admin) || 15,
            staff: Number(data.idle_timeouts_minutes?.staff) || 30,
            agent: Number(data.idle_timeouts_minutes?.agent) || 60,
            patient: Number(data.idle_timeouts_minutes?.patient) || 60,
          },
          maintenance: {
            enabled: Boolean(data.maintenance?.enabled),
            title: data.maintenance?.title || currentConfig.maintenance.title,
            message: data.maintenance?.message || currentConfig.maintenance.message,
          },
          banner: {
            enabled: Boolean(data.banner?.enabled && data.banner?.text),
            type: data.banner?.type || 'info',
            text: data.banner?.text || '',
          },
          _loaded: true,
        }
        lastFetchedAt = Date.now()
        notifyListeners()
      }
      return currentConfig
    })
    .catch(() => currentConfig)
    .finally(() => {
      inFlightPromise = null
    })

  return inFlightPromise
}

export function refreshRuntimeConfig() {
  return fetchRuntimeConfig(true)
}

export function useRuntimeConfig() {
  const [config, setConfig] = useState(currentConfig)

  useEffect(() => {
    fetchRuntimeConfig(false)
    const onUpdate = (e) => {
      setConfig(e?.detail || currentConfig)
    }
    window.addEventListener(EVENT_NAME, onUpdate)
    return () => window.removeEventListener(EVENT_NAME, onUpdate)
  }, [])

  return config
}
