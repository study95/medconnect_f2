import { useEffect, useRef } from 'react'

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export function isTurnstileEnabled() {
  return Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY)
}

/**
 * Reusable Cloudflare Turnstile anti-bot widget.
 * Renders nothing when VITE_TURNSTILE_SITE_KEY is not configured (safe for local dev).
 * When enabled in production, loads the official Turnstile script (permitted by Strict CSP)
 * and invokes onVerify(token) / onExpire() automatically.
 */
export default function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  resetKey = 0,
  theme = 'light',
  size = 'flexible',
  className = '',
}) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
  const containerRef = useRef(null)
  const widgetIdRef = useRef(null)
  const callbacksRef = useRef({ onVerify, onExpire, onError })

  useEffect(() => {
    callbacksRef.current = { onVerify, onExpire, onError }
  }, [onVerify, onExpire, onError])

  useEffect(() => {
    if (!siteKey || !containerRef.current) return

    let cancelled = false

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
        widgetIdRef.current = null
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        theme,
        size,
        callback: (token) => {
          callbacksRef.current.onVerify?.(token)
        },
        'expired-callback': () => {
          callbacksRef.current.onVerify?.('')
          callbacksRef.current.onExpire?.()
        },
        'error-callback': () => {
          callbacksRef.current.onVerify?.('')
          callbacksRef.current.onError?.()
        },
      })
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      let script = document.getElementById(TURNSTILE_SCRIPT_ID)
      if (!script) {
        script = document.createElement('script')
        script.id = TURNSTILE_SCRIPT_ID
        script.src = TURNSTILE_SCRIPT_SRC
        script.async = true
        script.defer = true
        document.head.appendChild(script)
      }
      script.addEventListener('load', renderWidget)
      return () => {
        cancelled = true
        script.removeEventListener('load', renderWidget)
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
          } catch {}
          widgetIdRef.current = null
        }
      }
    }

    return () => {
      cancelled = true
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {}
        widgetIdRef.current = null
      }
    }
  }, [siteKey, theme, size, resetKey])

  if (!siteKey) return null

  return <div ref={containerRef} className={className} style={{ marginTop: 8, marginBottom: 8 }} />
}
