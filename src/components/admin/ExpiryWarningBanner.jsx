// ExpiryWarningBanner.jsx — Universal sticky top banner for Doctor & Hospital subscription lifecycle
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, AlertTriangle, ArrowRight, X, ShieldAlert } from 'lucide-react'

const SNOOZE_KEY = 'doctorbooklet_sub_banner_snooze'
const SNOOZE_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export default function ExpiryWarningBanner() {
  const { isDoctor, isAdmin, isManager, getRoles } = useAuth()
  const roles = getRoles ? getRoles() : []
  const isHospital = roles.includes('hospital') || roles.includes('manager') || Boolean(isManager)

  const {
    showWarning,
    daysRemaining,
    isTrial,
    isExpired,
    expiryDate,
    hasActiveSubscription,
    isPendingVerification,
    loaded
  } = useSubscription()

  const location = useLocation()

  // 24-hour Snooze Persistence
  const [dismissed, setDismissed] = useState(() => {
    try {
      const snoozedAt = localStorage.getItem(SNOOZE_KEY)
      if (!snoozedAt) return false
      return (Date.now() - Number(snoozedAt)) < SNOOZE_DURATION_MS
    } catch (e) {
      return false
    }
  })

  // Defer rendering until the current page data has finished loading (prevent lonely banner on empty/spinner screen)
  const [hasPageLoaded, setHasPageLoaded] = useState(false)

  useEffect(() => {
    setHasPageLoaded(false)

    let intervalId
    let timeoutId

    const checkLoading = () => {
      // Check if page content still has active loading spinner or skeleton
      const spinner = document.querySelector('.admin-content .admin-spinner, .admin-content .admin-loading')
      if (!spinner) {
        setHasPageLoaded(true)
        if (intervalId) clearInterval(intervalId)
      }
    }

    timeoutId = setTimeout(checkLoading, 100)
    intervalId = setInterval(checkLoading, 150)

    // Fallback: reveal after 2.5s anyway to ensure important notice is never permanently hidden
    const fallbackTimeout = setTimeout(() => {
      setHasPageLoaded(true)
      if (intervalId) clearInterval(intervalId)
    }, 2500)

    return () => {
      clearTimeout(timeoutId)
      clearTimeout(fallbackTimeout)
      if (intervalId) clearInterval(intervalId)
    }
  }, [location.pathname])

  const handleDismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(SNOOZE_KEY, Date.now().toString())
    } catch (e) {}
  }

  // Don't render while the page is still loading its initial data
  if (!hasPageLoaded) {
    return null
  }

  // Don't render on checkout pages (user is actively purchasing/upgrading)
  if (location?.pathname?.includes('/subscription/checkout') || location?.pathname?.includes('/subscription-checkout')) {
    return null
  }

  // Don't render anywhere if a payment is currently under administrator verification
  if (isPendingVerification) {
    return null
  }

  // Don't render on subscription management/history pages (they have their own dedicated status cards)
  if (
    location?.pathname?.includes('/subscription/history') ||
    location?.pathname?.includes('/hospital-subscription') ||
    location?.pathname?.includes('/doctor/subscription')
  ) {
    return null
  }

  // Don't render for super admin or non-provider roles, or before subscription is loaded
  if (isAdmin || (!isDoctor && !isHospital) || !loaded) return null

  // Determine state
  const isExpiredState = Boolean(isExpired) || (!hasActiveSubscription && (isDoctor || isHospital))
  const isExpiringSoon = Boolean(showWarning) && (daysRemaining !== null && daysRemaining <= 3)

  // If active and not expiring soon, render nothing
  if (!isExpiredState && !isExpiringSoon) return null

  // Allow dismissing warning banner (persists for 24h across tabs/refreshes)
  if (dismissed) return null

  const targetLink = isHospital ? '/hospital/hospital-subscription' : '/doctor/subscription'
  const isLastDay = daysRemaining !== null && daysRemaining <= 1

  return (
    <>
      <style>{`
        @keyframes bannerSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .expiry-banner-animate {
          animation: bannerSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* ─── CASE 1: EXPIRED TRIAL / SUBSCRIPTION (HIGH PRIORITY ACTION REQUIRED) ─── */}
      {isExpiredState ? (
        <div
          className="admin-expiry-banner expiry-banner-animate"
          style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
            border: '1.5px solid #fecdd3',
            borderRadius: '12px',
            padding: '10px 18px',
            margin: '0 0 16px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 2px 10px rgba(225, 29, 72, 0.06)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', flex: '1 1 auto' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#e11d48',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 3px 8px rgba(225, 29, 72, 0.22)'
              }}
            >
              <ShieldAlert size={19} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#9f1239', letterSpacing: '-0.2px' }}>
                  {isTrial
                    ? 'আপনার ১৪ দিনের ফ্রি ট্রায়ালের মেয়াদ শেষ হয়েছে!'
                    : isExpired
                    ? 'আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে!'
                    : 'আপনার কোনো সক্রিয় সাবস্ক্রিপশন নেই!'}
                </span>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 7px',
                    borderRadius: '999px',
                    background: '#fda4af',
                    color: '#881337'
                  }}
                >
                  {isExpired ? 'আপগ্রেড প্রয়োজন' : 'প্ল্যান শুরু করুন'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#881337', lineHeight: 1.4 }}>
                {isHospital
                  ? (isExpired
                      ? 'হাসপাতালের ডাক্তার সিট, লাইভ কিউ টিভি ও ওপিডি সুবিধা নিরবচ্ছিন্ন রাখতে প্যাকেজ আপগ্রেড করুন।'
                      : 'হাসপাতালের ডাক্তার সিট, লাইভ কিউ টিভি ও ওপিডি সুবিধা সক্রিয় করতে ফ্রি ট্রায়াল বা প্যাকেজ শুরু করুন।')
                  : (isExpired
                      ? 'ডিজিটাল প্রেসক্রিপশন তৈরি, লাইভ কিউ ও এসএমএস সুবিধা সচল রাখতে প্যাকেজ আপগ্রেড করুন।'
                      : 'ডিজিটাল প্রেসক্রিপশন তৈরি, লাইভ কিউ ও এসএমএস সুবিধা সক্রিয় করতে ফ্রি ট্রায়াল বা প্যাকেজ শুরু করুন।')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Link
              to={targetLink}
              style={{
                background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 10px rgba(225, 29, 72, 0.28)',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={13} />
              <span>এখনই আপগ্রেড করুন</span>
              <ArrowRight size={13} />
            </Link>
            <button
              onClick={handleDismiss}
              title="২৪ ঘণ্টার জন্য লুকান"
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px',
                cursor: 'pointer',
                color: '#9f1239',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ) : (
        /* ─── CASE 2: EXPIRING SOON WARNING (3, 2, 1 DAYS LEFT) ─── */
        <div
          className="admin-expiry-banner expiry-banner-animate"
          style={{
            background: isLastDay ? '#fef2f2' : '#fffbeb',
            border: `1.5px solid ${isLastDay ? '#fecaca' : '#fde68a'}`,
            borderRadius: '12px',
            padding: '10px 18px',
            margin: '0 0 16px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: '260px', flex: '1 1 auto' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: isLastDay ? '#dc2626' : '#d97706',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: '13.5px', color: isLastDay ? '#991b1b' : '#92400e' }}>
                {isLastDay
                  ? 'আপনার ফ্রি ট্রায়ালের মেয়াদ আজই শেষ হচ্ছে!'
                  : `আপনার ${isTrial ? 'ফ্রি ট্রায়ালের' : 'সাবস্ক্রিপশনের'} মেয়াদ আর মাত্র ${daysRemaining} দিন বাকি!`}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', fontWeight: 500 }}>
                {expiryDate ? `মেয়াদ শেষ: ${expiryDate} • ` : ''}
                রোগীব্যবস্থাপনা ও ক্লিনিক্যাল সেবা নিরবচ্ছিন্ন রাখতে পছন্দের প্যাকেজটি বেছে নিন।
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <Link
              to={targetLink}
              style={{
                background: isLastDay ? '#dc2626' : '#d97706',
                color: '#ffffff',
                padding: '7px 16px',
                borderRadius: '9px',
                fontSize: '12px',
                fontWeight: 800,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: `0 3px 8px ${isLastDay ? '#dc2626' : '#d97706'}30`,
                transition: 'all 0.2s ease'
              }}
            >
              <span>প্যাকেজ দেখুন</span>
              <ArrowRight size={13} />
            </Link>
            <button
              onClick={handleDismiss}
              title="২৪ ঘণ্টার জন্য লুকান"
              style={{
                background: 'rgba(0, 0, 0, 0.05)',
                border: 'none',
                borderRadius: '8px',
                padding: '7px',
                cursor: 'pointer',
                color: isLastDay ? '#991b1b' : '#92400e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
