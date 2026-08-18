import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  IconX,
  IconStethoscope,
  IconSearch,
  IconArrowRight,
  IconUserPlus,
  IconHeart
} from '@tabler/icons-react'

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const hasSeen = sessionStorage.getItem('db_welcome_modal_shown')
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsOpen(true)
      }, 500)
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

  return (
    <div
      className="welcome-modal-overlay"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'wmFadeIn 0.25s ease-out forwards',
        fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', sans-serif"
      }}
    >
      <div
        className="welcome-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '390px',
          maxHeight: '94vh',
          overflowY: 'auto',
          background: '#FFFFFF',
          borderRadius: '20px',
          boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.3)',
          animation: 'wmScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          position: 'relative'
        }}
      >
        {/* Top subtle decorative gradient */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '110px',
            background: 'radial-gradient(ellipse at 50% 0%, rgba(16, 185, 129, 0.14) 0%, rgba(255, 255, 255, 0) 75%)',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        {/* Close Button */}
        <button
          onClick={handleClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: '#F1F5F9',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1E293B',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            zIndex: 10
          }}
        >
          <IconX size={16} strokeWidth={2.4} />
        </button>

        {/* Modal Content */}
        <div style={{ padding: '16px 16px 14px', position: 'relative', zIndex: 1 }}>
          
          {/* Main Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <img
              src="/doctorBookletLogo.png"
              alt="Doctor Booklet"
              style={{
                height: '30px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: '#065F46',
                margin: '0 0 2px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <span>স্বাগতম 👋</span>
              <span style={{ color: '#047857' }}>Doctor Booklet-এ</span>
            </h2>
            <p
              style={{
                fontSize: '12px',
                color: '#64748B',
                margin: 0,
                fontWeight: 600
              }}
            >
              বাংলাদেশের বিশ্বস্ত স্বাস্থ্যসেবা প্ল্যাটফর্ম
            </p>
          </div>

          {/* Section Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '0 0 10px 0'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 800, color: '#1E293B' }}>
              <span style={{ color: '#10B981', fontSize: '10px' }}>●</span>
              <span>আপনি কি করতে চান?</span>
              <span style={{ color: '#10B981', fontSize: '10px' }}>●</span>
            </div>
            <div style={{ flex: 1, height: '1px', background: '#E2E8F0' }} />
          </div>

          {/* Option 1: Doctor / Hospital */}
          <div
            onClick={handleDoctorOption}
            role="button"
            tabIndex={0}
            style={{
              position: 'relative',
              background: '#F0FDF4',
              border: '1.5px solid #10B981',
              borderRadius: '14px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '8px',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
          >
            {/* Top Right "প্রস্তাবিত" Badge */}
            <div
              style={{
                position: 'absolute',
                top: '-8px',
                right: '12px',
                background: '#00B875',
                color: '#FFFFFF',
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 7px',
                borderRadius: '5px',
                boxShadow: '0 2px 4px rgba(0, 184, 117, 0.2)'
              }}
            >
              প্রস্তাবিত
            </div>

            {/* Left Icon */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#FFFFFF',
                border: '1.5px solid #A7F3D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00B875',
                flexShrink: 0
              }}
            >
              <IconStethoscope size={20} strokeWidth={2.3} />
            </div>

            {/* Middle Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#064E3B',
                  lineHeight: 1.2,
                  marginBottom: '1px'
                }}
              >
                আমি ডাক্তার / হাসপাতাল
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#047857',
                  fontWeight: 600,
                  lineHeight: 1.25
                }}
              >
                ফ্রি প্রোফাইল খুলুন এবং রোগীদের সেবা দিন
              </div>
            </div>

            {/* Right Action Button */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#00B875',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconArrowRight size={15} strokeWidth={2.6} />
            </div>
          </div>

          {/* Option 2: Search Doctors */}
          <div
            onClick={handleSearchOption}
            role="button"
            tabIndex={0}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E2E8F0',
              borderRadius: '14px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '12px',
              transition: 'all 0.2s ease',
              userSelect: 'none'
            }}
          >
            {/* Left Icon */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#F8FAFC',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#00B875',
                flexShrink: 0
              }}
            >
              <IconSearch size={18} strokeWidth={2.3} />
            </div>

            {/* Middle Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#0F172A',
                  lineHeight: 1.2,
                  marginBottom: '1px'
                }}
              >
                আমি ডাক্তার খুঁজছি
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#64748B',
                  fontWeight: 600,
                  lineHeight: 1.25
                }}
              >
                বিশেষজ্ঞ ডাক্তার ও হাসপাতাল খুঁজুন
              </div>
            </div>

            {/* Right Action Button */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: '#F0FDF4',
                color: '#00B875',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <IconArrowRight size={15} strokeWidth={2.4} />
            </div>
          </div>

          {/* Primary Action Button */}
          <button
            onClick={handleRegisterClick}
            style={{
              width: '100%',
              background: '#00B875',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '12px',
              padding: '11px 16px',
              fontSize: '14.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontFamily: 'inherit',
              boxShadow: '0 4px 12px rgba(0, 184, 117, 0.24)'
            }}
          >
            <IconUserPlus size={18} strokeWidth={2.3} />
            <span>রেজিস্ট্রেশন শুরু করুন</span>
            <IconArrowRight size={16} strokeWidth={2.4} />
          </button>

          {/* Bottom Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              margin: '10px 0 6px'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ECFDF5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <IconHeart size={11} fill="#10B981" color="#10B981" />
            </div>
            <div style={{ flex: 1, height: '1px', background: '#F1F5F9' }} />
          </div>

          {/* Login Link */}
          <div
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#64748B',
              fontWeight: 600
            }}
          >
            ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
            <button
              type="button"
              onClick={handleLoginClick}
              style={{
                background: 'none',
                border: 'none',
                color: '#00B875',
                fontWeight: 800,
                cursor: 'pointer',
                padding: 0,
                fontSize: '12px',
                fontFamily: 'inherit',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              <span>লগইন করুন</span>
              <IconArrowRight size={12} strokeWidth={2.4} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes wmFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes wmScaleUp {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
