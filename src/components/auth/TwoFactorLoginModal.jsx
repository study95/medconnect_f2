import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { KeyRound, Smartphone, ShieldCheck, AlertTriangle, X, Loader2, ArrowRight } from 'lucide-react'
import CustomCheckbox from '../common/CustomCheckbox'

export default function TwoFactorLoginModal({
  isOpen,
  onClose,
  sessionKey,
  method = 'totp', // 'totp' or 'sms'
  maskedMobile = '',
  onSuccess,
}) {
  const { verifyDoctor2Fa } = useAuth()
  const [code, setCode] = useState('')
  const [useBackupMode, setUseBackupMode] = useState(false)
  const [trustDevice, setTrustDevice] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const isTotp = method === 'totp'

  const handleSubmit = async (e) => {
    e.preventDefault()
    const cleanCode = code.trim()
    if (!cleanCode) {
      setError(
        useBackupMode
          ? 'অনুগ্রহ করে জরুরি ব্যাকআপ কোড লিখুন।'
          : isTotp
          ? 'অনুগ্রহ করে ৬-সংখ্যার গুগল অথেনটিকেটর কোড দিন।'
          : 'অনুগ্রহ করে মোবাইলে পাঠানো ৬-সংখ্যার ওটিপি দিন।'
      )
      return
    }

    setLoading(true)
    setError('')
    try {
      const result = await verifyDoctor2Fa({
        session_key: sessionKey,
        code: cleanCode,
        otp: cleanCode,
        trust_device: trustDevice,
      })

      if (result.success) {
        if (typeof onSuccess === 'function') {
          onSuccess(result.user)
        }
      } else {
        setError(result.message || 'যাচাইকরণ ব্যর্থ হয়েছে। সঠিক কোড দিন।')
      }
    } catch (err) {
      setError('ভুল সিকিউরিটি কোড! সঠিক কোডটি দিয়ে পুনরায় চেষ্টা করুন।')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      padding: 16
    }}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        maxWidth: 420,
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        overflow: 'hidden',
        border: '1px solid #E5E7EB',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #F3F4F6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isTotp ? '#EEF2FF' : '#ECFDF5',
              color: isTotp ? '#4F46E5' : '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {isTotp ? <KeyRound size={22} /> : <Smartphone size={22} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#111827' }}>
                {isTotp ? 'Google Authenticator' : 'নিরাপত্তা যাচাইকরণ (2FA)'}
              </h3>
              <div style={{ fontSize: 12, color: '#6B7280' }}>
                {isTotp ? '২-ধাপ যাচাইকরণ' : 'নতুন ডিভাইস শনাক্তকরণ'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 8,
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <p style={{ margin: '0 0 16px', fontSize: 13, color: '#4B5563', lineHeight: 1.5 }}>
            {isTotp ? (
              useBackupMode
                ? 'আপনার ৮-সংখ্যার জরুরি এককালীন ব্যাকআপ রিকভারি কোডটি দিন (যেমন: A7E2-9K1F):'
                : 'আপনার মোবাইল ডিভাইসে Google Authenticator অ্যাপটি খুলে ৬-সংখ্যার নিরাপত্তা কোডটি দিন:'
            ) : (
              `আপনার নিবন্ধিত মোবাইল নম্বরে (${maskedMobile || 'মোবাইলে'}) পাঠানো ৬-সংখ্যার এসএমএস ওটিপি কোডটি দিন:`
            )}
          </p>

          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              autoFocus
              maxLength={useBackupMode ? 12 : 6}
              placeholder={useBackupMode ? 'A7E2-9K1F' : '123456'}
              value={code}
              onChange={(e) => {
                const val = e.target.value
                setCode(useBackupMode ? val.toUpperCase() : val.replace(/\D/g, ''))
                if (error) setError('')
              }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: 12,
                border: '2px solid #E5E7EB',
                background: '#F9FAFB',
                color: '#111827',
                fontSize: 20,
                textAlign: 'center',
                fontWeight: 700,
                letterSpacing: useBackupMode ? 2 : 6,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#4F46E5')}
              onBlur={(e) => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          {/* Toggle between TOTP app code and Emergency Backup Code */}
          {isTotp ? (
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <button
                type="button"
                onClick={() => {
                  setUseBackupMode(!useBackupMode)
                  setCode('')
                  setError('')
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4F46E5',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {useBackupMode
                  ? 'গুগল অথেনটিকেটর অ্যাপ কোড ব্যবহার করুন'
                  : 'ফোন কাছে নেই? এককালীন ব্যাকআপ কোড ব্যবহার করুন'}
              </button>
            </div>
          ) : (
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 20, userSelect: 'none' }}>
              <CustomCheckbox
                checked={trustDevice}
                onChange={(e) => setTrustDevice(e.target.checked)}
                color="#10B981"
              />
              <span style={{ fontSize: 13, color: '#374151' }}>
                এই ডিভাইসে ৩০ দিন মনে রাখুন (পরবর্তীতে কোড লাগবে না)
              </span>
            </label>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                minHeight: 46,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid #D1D5DB',
                background: '#FFFFFF',
                color: '#374151',
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{
                flex: 1.5,
                minHeight: 46,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 18px',
                borderRadius: 10,
                border: 'none',
                background: isTotp ? '#4F46E5' : '#00B875',
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                cursor: loading || !code.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !code.trim() ? 0.75 : 1,
                boxShadow: isTotp ? '0 4px 12px rgba(79, 70, 229, 0.25)' : '0 4px 12px rgba(0, 184, 117, 0.25)',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>যাচাই ও প্রবেশ</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
