import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  IconX,
  IconStethoscope,
  IconSearch,
  IconArrowRight,
  IconUserPlus
} from '@tabler/icons-react'

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if the user has already seen the modal in this session
    const hasSeen = sessionStorage.getItem('db_welcome_modal_shown')
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 700)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleClose = () => {
    setIsOpen(false)
    sessionStorage.setItem('db_welcome_modal_shown', 'true')
  }

  const handleDoctorOption = () => {
    handleClose()
    navigate('/register-doctor')
  }

  const handleSearchOption = () => {
    handleClose()
    navigate('/doctors')
  }

  const handleRegisterClick = () => {
    handleClose()
    navigate('/register')
  }

  const handleLoginClick = () => {
    handleClose()
    navigate('/login')
  }

  if (!isOpen) return null

  // Sample exact green color from reference
  const brandGreen = '#00BA7C'
  const brandGreenDark = '#009E68'
  const dreamGreenBg = '#EDFAF6'
  const dreamGreenBorder = '#A7F3D0'

  return (
    <div
      className="welcome-modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 19, 37, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'wmFadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', 'Inter', sans-serif"
      }}
    >
      <div
        className="welcome-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '490px',
          background: '#ffffff',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(5, 19, 37, 0.35), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
          animation: 'wmScaleUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative'
        }}
      >
        {/* Top Header in Sample Green */}
        <div
          style={{
            background: brandGreen,
            color: '#FFFFFF',
            padding: '30px 24px 26px',
            textAlign: 'center',
            position: 'relative',
            boxShadow: '0 4px 14px rgba(0, 186, 124, 0.18)'
          }}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.22)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.38)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'
            }}
          >
            <IconX size={18} strokeWidth={2.4} />
          </button>

          <h2
            style={{
              fontSize: '25px',
              fontWeight: 800,
              margin: '0 0 6px 0',
              letterSpacing: '-0.3px',
              color: '#FFFFFF'
            }}
          >
            স্বাগতম Doctor Booklet এ!
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.94)',
              margin: 0,
              fontWeight: 500,
              lineHeight: 1.4
            }}
          >
            বাংলাদেশের বিশ্বস্ত স্বাস্থ্যসেবা প্ল্যাটফর্ম
          </p>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 24px 22px' }}>
          <p
            style={{
              textAlign: 'center',
              fontSize: '15px',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '16px'
            }}
          >
            আপনি কি করতে চান?
          </p>

          {/* Option 1: Doctor / Hospital Authority (Dream Green Background + Green Logo) */}
          <div
            onClick={handleDoctorOption}
            role="button"
            tabIndex={0}
            style={{
              background: dreamGreenBg,
              border: `1.5px solid ${dreamGreenBorder}`,
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease, border-color 0.18s ease',
              boxShadow: '0 3px 12px rgba(0, 186, 124, 0.1)',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = brandGreen
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 186, 124, 0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = dreamGreenBorder
              e.currentTarget.style.boxShadow = '0 3px 12px rgba(0, 186, 124, 0.1)'
            }}
          >
            {/* Logo in Green with crisp white circular background */}
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: `1.5px solid ${dreamGreenBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brandGreen,
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 186, 124, 0.15)'
              }}
            >
              <IconStethoscope size={24} strokeWidth={2.4} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#064E3B',
                  lineHeight: 1.25,
                  marginBottom: '2px'
                }}
              >
                আমি ডাক্তার / হাসপাতাল কর্তৃপক্ষ
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#047857',
                  fontWeight: 500,
                  lineHeight: 1.3
                }}
              >
                ফ্রি তে প্রোফাইল যুক্ত করুন — সরাসরি রোগীদের সেবা দিন
              </div>
            </div>

            <div style={{ color: brandGreen, display: 'flex', alignItems: 'center' }}>
              <IconArrowRight size={20} strokeWidth={2.5} />
            </div>
          </div>

          {/* Option 2: Patient / Search Doctors (White / Crisp Border Card) */}
          <div
            onClick={handleSearchOption}
            role="button"
            tabIndex={0}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #CBD5E1',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              cursor: 'pointer',
              marginBottom: '20px',
              transition: 'transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
              userSelect: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = brandGreen
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 186, 124, 0.14)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = '#CBD5E1'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: brandGreen,
                flexShrink: 0
              }}
            >
              <IconSearch size={22} strokeWidth={2.3} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.25,
                  marginBottom: '2px'
                }}
              >
                আমি ডাক্তার / সেবা খুঁজছি
              </div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: '#64748B',
                  fontWeight: 500,
                  lineHeight: 1.3
                }}
              >
                দেশজুড়ে বিশেষজ্ঞ ডাক্তার ও হাসপাতাল ব্রাউজ করুন
              </div>
            </div>

            <div style={{ color: '#64748B', display: 'flex', alignItems: 'center' }}>
              <IconArrowRight size={20} strokeWidth={2.2} />
            </div>
          </div>

          {/* Bottom Updated Section: Register Button & Login Link */}
          <div style={{ marginTop: '6px' }}>
            <button
              onClick={handleRegisterClick}
              style={{
                width: '100%',
                background: brandGreen,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '13px 20px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontFamily: 'inherit',
                boxShadow: '0 4px 14px rgba(0, 186, 124, 0.28)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = brandGreenDark
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 186, 124, 0.38)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = brandGreen
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 186, 124, 0.28)'
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.98)'
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <IconUserPlus size={19} strokeWidth={2.3} />
              <span>রেজিস্ট্রেশন করুন</span>
              <IconArrowRight size={18} strokeWidth={2.4} />
            </button>

            <div
              style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '13px',
                color: '#64748B',
                fontWeight: 500
              }}
            >
              ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
              <button
                type="button"
                onClick={handleLoginClick}
                style={{
                  background: 'none',
                  border: 'none',
                  color: brandGreen,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '13px',
                  fontFamily: 'inherit',
                  textDecoration: 'underline'
                }}
              >
                লগইন করুন
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wmScaleUp {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
