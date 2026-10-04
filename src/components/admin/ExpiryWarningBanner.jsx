// ExpiryWarningBanner.jsx — Universal sticky top banner for Doctor & Hospital subscription lifecycle
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, AlertTriangle, ArrowRight, X, ShieldAlert } from 'lucide-react'

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
    loaded
  } = useSubscription()

  const [dismissed, setDismissed] = useState(false)

  // Don't render for super admin or non-provider roles, or before subscription is loaded
  if (isAdmin || (!isDoctor && !isHospital) || !loaded) return null

  // Determine state
  const isExpiredState = Boolean(isExpired) || (!hasActiveSubscription && (isDoctor || isHospital))
  const isExpiringSoon = Boolean(showWarning) && (daysRemaining !== null && daysRemaining <= 3)

  // If active and not expiring soon, render nothing
  if (!isExpiredState && !isExpiringSoon) return null

  // Allow dismissing warning banner (for expired, can dismiss for current view)
  if (dismissed) return null

  const targetLink = isHospital ? '/hospital/hospital-subscription' : '/doctor/subscription'
  const isLastDay = daysRemaining !== null && daysRemaining <= 1

  // ─── CASE 1: EXPIRED TRIAL / SUBSCRIPTION (HIGH PRIORITY ACTION REQUIRED) ───
  if (isExpiredState) {
    return (
      <div
        className="admin-expiry-banner hosp-sub-fade-in"
        style={{
          background: 'linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)',
          border: '1.5px solid #fecdd3',
          borderRadius: '16px',
          padding: '16px 22px',
          margin: '0 0 22px 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 18px rgba(225, 29, 72, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px', flex: '1 1 auto' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#e11d48',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 4px 10px rgba(225, 29, 72, 0.25)'
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: '#9f1239', letterSpacing: '-0.2px' }}>
                {isTrial
                  ? 'আপনার ১৪ দিনের ফ্রি ট্রায়ালের মেয়াদ শেষ হয়েছে!'
                  : 'আপনার সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে!'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                  background: '#fda4af',
                  color: '#881337'
                }}
              >
                আপগ্রেড প্রয়োজন
              </span>
            </div>
            <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#4c0519', lineHeight: 1.45 }}>
              {isHospital
                ? 'হাসপাতালের ডাক্তার সিট, লাইভ কিউ টিভি ও ওপিডি সুবিধা নিরবচ্ছিন্ন রাখতে অনুগ্রহ করে প্যাকেজ আপগ্রেড করুন।'
                : 'ডিজিটাল প্রেসক্রিপশন তৈরি, লাইভ কিউ ও এসএমএস সুবিধা সচল রাখতে অনুগ্রহ করে প্যাকেজ আপগ্রেড করুন।'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <Link
            to={targetLink}
            style={{
              background: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 800,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.35)',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={14} />
            <span>এখনই আপগ্রেড করুন</span>
            <ArrowRight size={14} />
          </Link>
          <button
            onClick={() => setDismissed(true)}
            title="লুকান"
            style={{
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              cursor: 'pointer',
              color: '#9f1239',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    )
  }

  // ─── CASE 2: EXPIRING SOON WARNING (3, 2, 1 DAYS LEFT) ───
  const bgColor = isLastDay ? '#fef2f2' : '#fffbeb'
  const borderColor = isLastDay ? '#fecaca' : '#fde68a'
  const textColor = isLastDay ? '#991b1b' : '#92400e'
  const btnBg = isLastDay ? '#dc2626' : '#d97706'

  return (
    <div
      className="admin-expiry-banner hosp-sub-fade-in"
      style={{
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '15px 22px',
        margin: '0 0 22px 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '280px', flex: '1 1 auto' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: btnBg,
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '14.5px', color: textColor }}>
            {isLastDay
              ? 'আপনার ফ্রি ট্রায়ালের মেয়াদ আজই শেষ হচ্ছে!'
              : `আপনার ${isTrial ? 'ফ্রি ট্রায়ালের' : 'সাবস্ক্রিপশনের'} মেয়াদ আর মাত্র ${daysRemaining} দিন বাকি!`}
          </p>
          <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: 'var(--admin-text-muted, #64748b)', fontWeight: 500 }}>
            {expiryDate ? `মেয়াদ শেষ: ${expiryDate} • ` : ''}
            রোগীব্যবস্থাপনা ও ক্লিনিক্যাল সেবা নিরবচ্ছিন্ন রাখতে এখনই পছন্দের প্যাকেজটি বেছে নিন।
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        <Link
          to={targetLink}
          style={{
            background: btnBg,
            color: '#ffffff',
            padding: '9px 20px',
            borderRadius: '12px',
            fontSize: '12.5px',
            fontWeight: 800,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: `0 4px 12px ${btnBg}35`,
            transition: 'all 0.2s ease'
          }}
        >
          <span>প্যাকেজ দেখুন ও আপগ্রেড করুন</span>
          <ArrowRight size={14} />
        </Link>
        <button
          onClick={() => setDismissed(true)}
          title="লুকান"
          style={{
            background: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '10px',
            padding: '9px',
            cursor: 'pointer',
            color: textColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={15} />
        </button>
      </div>
    </div>
  )
}

