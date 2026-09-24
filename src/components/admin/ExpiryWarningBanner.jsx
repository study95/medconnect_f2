// ExpiryWarningBanner.jsx — Shows warning banner at 7, 3, 1 days before expiry
import { useState } from 'react'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'

export default function ExpiryWarningBanner() {
  const { isDoctor, isAdmin } = useAuth()
  const { showWarning, daysRemaining, isTrial, expiryDate, hasActiveSubscription } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  // Only show for doctors with active subscriptions nearing expiry
  if (isAdmin || !isDoctor || !showWarning || !hasActiveSubscription || dismissed) return null

  const isUrgent = daysRemaining <= 3
  const isLastDay = daysRemaining <= 1

  const bgColor = isLastDay
    ? 'rgba(239, 68, 68, 0.1)'
    : isUrgent
      ? 'rgba(245, 158, 11, 0.1)'
      : 'rgba(59, 130, 246, 0.1)'

  const borderColor = isLastDay 
    ? 'rgba(239, 68, 68, 0.2)' 
    : isUrgent 
      ? 'rgba(245, 158, 11, 0.2)' 
      : 'rgba(59, 130, 246, 0.2)'

  const textColor = isLastDay 
    ? '#ef4444' 
    : isUrgent 
      ? '#f59e0b' 
      : '#3b82f6'

  const icon = isLastDay ? '🚨' : isUrgent ? '⚠️' : '⏰'

  return (
    <div style={{
      background: bgColor, border: `1px solid ${borderColor}`,
      borderRadius: 16, padding: '16px 24px', margin: '0 0 24px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 16, animation: 'slideDown 0.4s ease-out'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ 
          width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 
        }}>
          {icon}
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: textColor }}>
            {isLastDay
              ? 'আপনার সাবস্ক্রিপশনের মেয়াদ আজই শেষ হচ্ছে!'
              : `আপনার ${isTrial ? 'ফ্রি ট্রায়ালের' : 'সাবস্ক্রিপশনের'} মেয়াদ আর মাত্র ${daysRemaining} দিন বাকি!`
            }
          </p>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
            মেয়াদ শেষ: <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{expiryDate}</span> · নিরবচ্ছিন্ন সেবার জন্য এখনই রিনিউ করুন।
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link
          to="/admin/subscription"
          style={{
            background: textColor, color: 'white',
            padding: '10px 20px', borderRadius: 10,
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
            boxShadow: `0 4px 12px ${textColor}30`
          }}
        >
          রিনিউ করুন
        </Link>
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'rgba(0,0,0,0.05)', border: 'none',
            borderRadius: 10, padding: '10px 16px', cursor: 'pointer',
            color: 'var(--admin-text-muted)', fontSize: 13, fontWeight: 700
          }}
        >
          লুকান
        </button>
      </div>
    </div>
  )
}

