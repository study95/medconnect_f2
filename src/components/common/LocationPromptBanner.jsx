import { useState, useEffect } from 'react'
import { IconMapPin, IconNavigation, IconLock, IconX, IconCheck, IconLoader2 } from '@tabler/icons-react'

/**
 * LocationPromptBanner
 * A sleek, high-converting slide-up banner that gently prompts users
 * to enable live location on discovery pages (Doctors, Hospitals).
 *
 * Designed with mobile thumb ergonomics (sits safely above FloatingBottomNav)
 * and defensive browser permission handling (guidance if blocked).
 */
export default function LocationPromptBanner({
  userLocation = null,
  loading = false,
  error = null,
  permissionStatus = 'unknown',
  onRequestLocation,
  entityType = 'doctor', // 'doctor' | 'hospital'
  onSuccess,
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('medconnect_loc_prompt_dismissed') === '1'
    } catch {
      return false
    }
  })
  const [justActivated, setJustActivated] = useState(false)

  const isDenied = permissionStatus === 'denied' || error?.isPermissionDenied
  const hasLocation = Boolean(userLocation?.latitude && userLocation?.longitude)

  // Trigger delayed entrance (1.5 seconds) if location not yet active and not dismissed
  useEffect(() => {
    if (hasLocation || dismissed) {
      setIsVisible(false)
      return
    }

    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [hasLocation, dismissed])

  // Handle immediate dismiss
  const handleDismiss = () => {
    setIsVisible(false)
    setDismissed(true)
    try {
      sessionStorage.setItem('medconnect_loc_prompt_dismissed', '1')
    } catch {
      // ignore
    }
  }

  // Handle location activation click
  const handleActivate = async () => {
    if (onRequestLocation) {
      try {
        const res = await onRequestLocation()
        if (res?.latitude && res?.longitude) {
          setJustActivated(true)
          if (onSuccess) onSuccess(res)
          // Hide smoothly after 1.4 seconds showing the success checkmark
          setTimeout(() => {
            setIsVisible(false)
          }, 1400)
        }
      } catch (err) {
        // Handled via permissionStatus / error state
      }
    }
  }

  if (!isVisible && !justActivated) {
    return null
  }

  const isHospital = entityType === 'hospital'
  const title = isHospital ? 'নিকটস্থ হাসপাতাল খুঁজছেন?' : 'নিকটস্থ ডাক্তার ও চেম্বার খুঁজছেন?'
  const subtitle = isHospital
    ? 'লাইভ লোকেশন সেট করলে আপনার সবচেয়ে কাছের হাসপাতালগুলো দূরত্বসহ সহজে দেখতে পাবেন।'
    : 'লাইভ লোকেশন সেট করলে আপনার সবচেয়ে কাছের ডাক্তার ও চেম্বারগুলো সহজে দেখতে পাবেন।'

  return (
    <>
      <div
        className="location-prompt-banner-wrapper"
        style={{
          position: 'fixed',
          zIndex: 1045,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          animation: 'slideUpPrompt 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: isDenied ? '1.5px solid #FCA5A5' : '1.5px solid #E2E8F0',
            boxShadow: '0 16px 36px -6px rgba(15, 23, 42, 0.16), 0 6px 16px rgba(15, 23, 42, 0.08)',
            padding: '16px 18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle Accent Glow on Left */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 5,
              background: isDenied ? '#EF4444' : justActivated ? '#10B981' : '#00B875',
            }}
          />

          {justActivated ? (
            /* Success State */
            <div className="d-flex align-items-center gap-3 py-1">
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#ECFDF5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <IconCheck size={22} stroke={2.5} />
              </div>
              <div>
                <h6 style={{ margin: 0, fontWeight: 700, fontSize: 14.5, color: '#065F46' }}>
                  লোকেশন সফলভাবে সক্রিয় হয়েছে!
                </h6>
                <p style={{ margin: 0, fontSize: 12.5, color: '#047857' }}>
                  আপনার নিকটস্থ তালিকা প্রস্তুত করা হচ্ছে...
                </p>
              </div>
            </div>
          ) : isDenied ? (
            /* Blocked/Denied Guidance State */
            <div>
              <div className="d-flex align-items-start gap-3">
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: '#FEF2F2',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <IconLock size={20} />
                </div>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <h6 style={{ margin: '0 0 3px 0', fontWeight: 700, fontSize: 14, color: '#991B1B' }}>
                    লোকেশন পারমিশন বন্ধ আছে
                  </h6>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#475569', lineHeight: 1.45 }}>
                    ব্রাউজার অ্যাড্রেস বারের <strong>লক (🔒)</strong> আইকনে ক্লিক করে Location <strong>Allow</strong> করুন, অথবা জেলা সিলেক্ট করে সেবা খুঁজুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="বন্ধ করুন"
                >
                  <IconX size={18} />
                </button>
              </div>
              <div className="d-flex justify-content-end mt-2 pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    background: '#F1F5F9',
                    border: 'none',
                    borderRadius: 8,
                    padding: '6px 14px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  বুঝেছি, জেলা নির্বাচন করব
                </button>
              </div>
            </div>
          ) : (
            /* Default Prompt State */
            <div>
              <div className="d-flex align-items-start gap-3">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
                    background: '#E8FBF4',
                    color: '#00B875',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                >
                  <IconNavigation size={22} />
                </div>
                <div style={{ flex: 1, paddingRight: 14 }}>
                  <h6 style={{ margin: '0 0 4px 0', fontWeight: 700, fontSize: 14.5, color: '#0F172A' }}>
                    {title}
                  </h6>
                  <p style={{ margin: 0, fontSize: 12.5, color: '#64748B', lineHeight: 1.45 }}>
                    {subtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="পরে করব"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="d-flex align-items-center justify-content-end gap-2 mt-3 pt-1">
                <button
                  type="button"
                  onClick={handleDismiss}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#64748B',
                    cursor: 'pointer',
                  }}
                >
                  পরে
                </button>
                <button
                  type="button"
                  onClick={handleActivate}
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(135deg, #00B875 0%, #00965F 100%)',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#FFFFFF',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)',
                  }}
                >
                  {loading ? (
                    <>
                      <IconLoader2 size={16} className="animate-spin" />
                      <span>সনাক্ত হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <IconMapPin size={16} />
                      <span>লোকেশন অন করুন</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideUpPrompt {
          0% {
            opacity: 0;
            transform: translateY(28px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .location-prompt-banner-wrapper {
          bottom: 24px;
          right: 24px;
          width: 440px;
          max-width: calc(100vw - 32px);
        }

        @media (max-width: 768px) {
          .location-prompt-banner-wrapper {
            bottom: 74px !important;
            left: 14px !important;
            right: 14px !important;
            width: auto !important;
            max-width: 100% !important;
          }
        }
      `}} />
    </>
  )
}
