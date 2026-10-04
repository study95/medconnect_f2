// UpgradePromptModal.jsx — World-Class SaaS Paywall & Trial Expiry Interceptor Modal
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, Check, ArrowRight, X, Shield, Lock, Activity, Users, Monitor, MessageSquare } from 'lucide-react'

export default function UpgradePromptModal({
  isOpen,
  onClose,
  title,
  subtitle,
  featureName,
  targetEntity // 'doctor' | 'hospital' | auto
}) {
  const navigate = useNavigate()
  const { isDoctor, isManager, getRoles } = useAuth()
  const roles = getRoles ? getRoles() : []
  const isHospital = targetEntity === 'hospital' || roles.includes('hospital') || roles.includes('manager') || Boolean(isManager)
  const isDoc = targetEntity === 'doctor' || isDoctor

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const targetPath = isHospital ? '/hospital/hospital-subscription#pricing-plans-section' : '/doctor/subscription#pricing-plans-section'

  const handleUpgrade = () => {
    onClose?.()
    navigate(targetPath)
    // Smooth scroll down to pricing section
    setTimeout(() => {
      const el = document.getElementById('pricing-plans-section')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
      }
    }, 150)
  }

  const defaultTitle = 'আপনার ১৪ দিনের ফ্রি ট্রায়ালের মেয়াদ শেষ হয়েছে!'
  const defaultSubtitle = isHospital
    ? 'হাসপাতালের ডাক্তার সিট বরাদ্দ, ওয়েটিং লাউঞ্জ লাইভ কিউ টিভি ও পূর্ণাঙ্গ ওপিডি রোগীব্যবস্থাপনা সচল রাখতে এখনই পছন্দের প্যাকেজটি বেছে নিন।'
    : 'রোগীদের ডিজিটাল প্রেসক্রিপশন তৈরি, লাইভ কিউ কলিং ও স্বয়ংক্রিয় এসএমএস সুবিধা নিরবচ্ছিন্ন রাখতে আপনার পছন্দের প্যাকেজটি বেছে নিন।'

  const benefits = isHospital
    ? [
        { icon: <Users size={16} />, text: 'মাল্টি-ডাক্তার সিট বরাদ্দ ও রোস্টার ব্যবস্থাপনা' },
        { icon: <Monitor size={16} />, text: 'ওয়েটিং লাউঞ্জ লাইভ কিউ টিভি স্ক্রিন ডিসপ্লে' },
        { icon: <Activity size={16} />, text: 'হাসপাতালের সেন্ট্রাল ওপিডি টিকিট ও অ্যানালিটিক্স' },
        { icon: <Shield size={16} />, text: 'সকল পুরনো রোগী ও সিট হিস্ট্রি সম্পূর্ণ নিরাপদ' }
      ]
    : [
        { icon: <Activity size={16} />, text: 'আনলিমিটেড ডিজিটাল প্রেসক্রিপশন ও ক্লিনিক্যাল নোটস' },
        { icon: <Monitor size={16} />, text: 'লাইভ পেশেন্ট কলিং কিউ ও ডিসপ্লে সুবিধা' },
        { icon: <MessageSquare size={16} />, text: 'রোগীদের অটোমেটিক কনফার্মেশন ও ফলোআপ এসএমএস' },
        { icon: <Shield size={16} />, text: 'পূর্বের সকল প্রেসক্রিপশন ও রোগীর রেকর্ড ১০০% সুরক্ষিত' }
      ]

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'var(--admin-card-bg, #ffffff)',
          color: 'var(--admin-text, #0f172a)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          position: 'relative',
          animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #4f46e5 100%)',
            padding: '36px 32px 30px',
            color: '#ffffff',
            position: 'relative',
            textAlign: 'center'
          }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
          >
            <X size={18} />
          </button>

          {/* Crown Badge */}
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: 'rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255, 255, 255, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fde047',
              marginBottom: '16px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
            }}
          >
            <Sparkles size={30} />
          </div>

          {featureName && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 12px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.2)',
                fontSize: '11.5px',
                fontWeight: 700,
                marginBottom: '10px'
              }}
            >
              <Lock size={12} />
              <span>{featureName} ব্যবহারের জন্য আপগ্রেড আবশ্যক</span>
            </div>
          )}

          <h3 style={{ margin: 0, fontSize: '21px', fontWeight: 800, letterSpacing: '-0.3px', lineHeight: 1.3 }}>
            {title || defaultTitle}
          </h3>

          <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'rgba(255, 255, 255, 0.88)', lineHeight: 1.5 }}>
            {subtitle || defaultSubtitle}
          </p>
        </div>

        {/* Modal Body & Benefits */}
        <div style={{ padding: '28px 32px 32px' }}>
          <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.05em', marginBottom: '14px' }}>
            প্যাকেজে অন্তর্ভুক্ত সুবিধাসমূহ:
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '28px' }}>
            {benefits.map((b, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: 'var(--admin-bg, #f8fafc)',
                  border: '1px solid var(--admin-border, #e2e8f0)',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: '#ecfdf5',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {b.icon}
                </div>
                <span style={{ color: 'var(--admin-text, #1e293b)' }}>{b.text}</span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              onClick={handleUpgrade}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                fontSize: '14.5px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 18px rgba(37, 99, 235, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Sparkles size={16} />
              <span>🚀 এখনই প্যাকেজ আপগ্রেড করুন</span>
              <ArrowRight size={16} />
            </button>

            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: '12px',
                border: '1px solid transparent',
                background: 'transparent',
                color: '#64748b',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.04)'
                e.currentTarget.style.color = '#334155'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#64748b'
              }}
            >
              পরে করব (আগের হিস্ট্রি ও ডাটা দেখুন)
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
