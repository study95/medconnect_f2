import { useState, useEffect, useCallback, useTransition } from 'react'

const GEO_STORAGE_KEY = 'medconnect_user_geo_v1'

/**
 * useUserLocation
 * Enterprise-grade hook for browser geolocation with session caching,
 * defensive permission checking, and localized user-friendly error guidance.
 */
export function useUserLocation() {
  const [location, setLocation] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
      const cached = sessionStorage.getItem(GEO_STORAGE_KEY)
      if (cached) {
        const parsed = JSON.parse(cached)
        // Ensure parsed coordinates are valid
        if (parsed?.latitude && parsed?.longitude) {
          return parsed
        }
      }
    } catch {
      // Ignore sessionStorage read failures (e.g. private browsing restrictions)
    }
    return null
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permissionStatus, setPermissionStatus] = useState('unknown') // 'unknown' | 'prompt' | 'granted' | 'denied' | 'unsupported'

  // Query browser permission status when available
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator?.permissions?.query) {
      if (typeof window !== 'undefined' && !('geolocation' in navigator)) {
        setPermissionStatus('unsupported')
      }
      return
    }

    let isMounted = true
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((permission) => {
        if (!isMounted) return
        if (permission.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              if (!isMounted) return
              const locData = {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                timestamp: pos.timestamp || Date.now(),
              }
              setLocation(locData)
              try {
                sessionStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(locData))
              } catch {
                // ignore
              }
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 5 * 60 * 1000 }
          )
        }

        permission.onchange = () => {
          if (!isMounted) return
          setPermissionStatus(permission.state)
          if (permission.state === 'denied') {
            // Permission revoked
            setLocation(null)
            try {
              sessionStorage.removeItem(GEO_STORAGE_KEY)
            } catch {
              // ignore
            }
          } else if (permission.state === 'granted') {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                if (!isMounted) return
                const locData = {
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                  timestamp: pos.timestamp || Date.now(),
                }
                setLocation(locData)
                try {
                  sessionStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(locData))
                } catch {
                  // ignore
                }
              },
              () => {},
              { enableHighAccuracy: true, timeout: 8000, maximumAge: 5 * 60 * 1000 }
            )
          }
        }
      })
      .catch(() => {
        // Permissions query not supported for geolocation in some browsers
      })

    return () => {
      isMounted = false
    }
  }, [])

  /**
   * Request user location with high accuracy, timeout protection, and detailed localized error messages
   */
  const requestLocation = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('geolocation' in navigator)) {
        const errObj = {
          code: 0,
          isPermissionDenied: false,
          message: 'আপনার ব্রাউজার বা ডিভাইসে জিপিএস লোকেশন সমর্থিত নয়।',
        }
        setError(errObj)
        setPermissionStatus('unsupported')
        reject(errObj)
        return
      }

      setLoading(true)
      setError(null)

      const geoOptions = {
        enableHighAccuracy: true,
        timeout: 12000, // 12 seconds max
        maximumAge: 5 * 60 * 1000, // 5 minutes cache acceptance
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLoading(false)
          setError(null)
          setPermissionStatus('granted')

          const locData = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: pos.timestamp || Date.now(),
          }

          setLocation(locData)

          try {
            sessionStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(locData))
          } catch {
            // ignore session storage save failure
          }

          resolve(locData)
        },
        (geoErr) => {
          setLoading(false)
          let friendlyMessage = 'লোকেশন শনাক্ত করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।'
          let isDenied = false

          if (geoErr.code === geoErr.PERMISSION_DENIED) {
            isDenied = true
            setPermissionStatus('denied')
            friendlyMessage =
              'লোকেশন পারমিশন বন্ধ আছে। অনুগ্রহ করে ব্রাউজারের অ্যাড্রেস বারের লক (🔒) আইকনে ক্লিক করে Location "Allow" করুন।'
          } else if (geoErr.code === geoErr.POSITION_UNAVAILABLE) {
            friendlyMessage = 'আপনার ডিভাইসের জিপিএস সংকেত বা নেটওয়ার্ক পাওয়া যায়নি।'
          } else if (geoErr.code === geoErr.TIMEOUT) {
            friendlyMessage = 'লোকেশন পেতে বেশি সময় লাগছে। ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।'
          }

          const errObj = {
            code: geoErr.code,
            isPermissionDenied: isDenied,
            message: friendlyMessage,
          }

          setError(errObj)
          reject(errObj)
        },
        geoOptions
      )
    })
  }, [])

  /**
   * Clear cached location manually (e.g. if user wants to reset or switch back to general view)
   */
  const clearLocation = useCallback(() => {
    setLocation(null)
    setError(null)
    try {
      sessionStorage.removeItem(GEO_STORAGE_KEY)
    } catch {
      // ignore
    }
  }, [])

  return {
    location,
    userLocation: location,
    latitude: location?.latitude || null,
    longitude: location?.longitude || null,
    hasLocation: Boolean(location?.latitude && location?.longitude),
    loading,
    error,
    permissionStatus,
    requestLocation,
    clearLocation,
  }
}

export default useUserLocation
