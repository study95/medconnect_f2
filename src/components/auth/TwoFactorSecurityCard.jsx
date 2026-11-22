import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  getTwoFactorStatusApi, 
  setupTwoFactorApi, 
  enableTwoFactorApi, 
  disableTwoFactorApi 
} from '../../api/authApi'
import { 
  ShieldCheck, ShieldAlert, KeyRound, Smartphone, CheckCircle2, 
  Copy, Check, Download, AlertTriangle, Eye, EyeOff, X, Loader2, ArrowRight 
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useDialog } from '../../hooks/useDialog'
import CustomCheckbox from '../common/CustomCheckbox'

export default function TwoFactorSecurityCard({ onStatusChange }) {
  const { showSuccess, showError } = useDialog()
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ enabled: false, setup_at: null, backup_codes_remaining: 0 })
  const [showGuide, setShowGuide] = useState(true)

  // Setup Modal State
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupStep, setSetupStep] = useState(1) // 1: Password confirm, 2: QR & verify
  const [setupPassword, setSetupPassword] = useState('')
  const [showSetupPassword, setShowSetupPassword] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [setupData, setSetupData] = useState(null) // { secret, qr_url, backup_codes }
  const [verifyOtp, setVerifyOtp] = useState(['', '', '', '', '', ''])
  const verifyOtpRefs = useRef([])
  const verifyCode = verifyOtp.join('')
  const [savedCodesChecked, setSavedCodesChecked] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Auto-focus first digit on Step 2
  useEffect(() => {
    if (showSetupModal && setupStep === 2 && verifyOtpRefs.current[0]) {
      setTimeout(() => verifyOtpRefs.current[0]?.focus(), 150)
    }
  }, [showSetupModal, setupStep])

  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '')
    if (!clean && value !== '') return
    const char = clean.slice(-1)

    const newOtp = [...verifyOtp]
    newOtp[index] = char
    setVerifyOtp(newOtp)
    if (setupError) setSetupError('')

    if (char && index < 5 && verifyOtpRefs.current[index + 1]) {
      verifyOtpRefs.current[index + 1].focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!verifyOtp[index] && index > 0) {
        verifyOtpRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...verifyOtp]
        newOtp[index] = ''
        setVerifyOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      verifyOtpRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      verifyOtpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return

    const newOtp = ['', '', '', '', '', '']
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || ''
    }
    setVerifyOtp(newOtp)
    if (setupError) setSetupError('')

    const nextIndex = Math.min(pasted.length, 5)
    verifyOtpRefs.current[nextIndex]?.focus()
  }

  // Disable Modal State
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisablePassword, setShowDisablePassword] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [useBackupForDisable, setUseBackupForDisable] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [disableError, setDisableError] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await getTwoFactorStatusApi()
      if (res.data?.success) {
        setStatus({
          enabled: Boolean(res.data.enabled),
          setup_at: res.data.setup_at || null,
          backup_codes_remaining: res.data.backup_codes_remaining || 0,
        })
        if (typeof onStatusChange === 'function') {
          onStatusChange(Boolean(res.data.enabled))
        }
      }
    } catch (e) {
      console.error('Failed to fetch 2FA status:', e)
    } finally {
      setLoading(false)
    }
  }

  // Handle Step 1 of Setup: Request QR & Backup Codes with Password
  const handleStartSetup = async (e) => {
    if (e) e.preventDefault()
    if (!setupPassword) {
      setSetupError('বর্তমান পাসওয়ার্ড প্রদান করুন।')
      return
    }

    setSetupLoading(true)
    setSetupError('')
    try {
      const res = await setupTwoFactorApi({ password: setupPassword })
      if (res.data?.success) {
        setSetupData(res.data)
        setSetupStep(2)
      } else {
        setSetupError(res.data?.message || 'সেটআপ ব্যর্থ হয়েছে।')
      }
    } catch (err) {
      setSetupError(err.response?.data?.message || 'পাসওয়ার্ড সঠিক নয় বা সার্ভার ত্রুটি।')
    } finally {
      setSetupLoading(false)
    }
  }

  // Handle Step 2 of Setup: Verify test 6-digit code and activate 2FA
  const handleEnable2Fa = async (e) => {
    if (e) e.preventDefault()
    const cleanCode = verifyCode.trim()
    if (!cleanCode) {
      setSetupError('গুগল অথেনটিকেটর অ্যাপের ৬ ডিজিটের কোড দিন।')
      return
    }
    if (!savedCodesChecked) {
      setSetupError('অনুগ্রহ করে নিশ্চিত করুন যে আপনি ব্যাকআপ কোডগুলো সংরক্ষণ করেছেন।')
      return
    }

    setSetupLoading(true)
    setSetupError('')
    try {
      const res = await enableTwoFactorApi({ code: cleanCode })
      if (res.data?.success) {
        showSuccess({
          title: 'নিরাপত্তা সক্রিয় হয়েছে',
          message: res.data.message || 'Google Authenticator ২-ধাপ যাচাই সফলভাবে চালু হয়েছে!',
          confirmText: 'ঠিক আছে',
          autoCloseMs: 2500
        })
        setShowSetupModal(false)
        resetSetupModalState()
        fetchStatus()
      } else {
        const msg = res.data?.message || 'ভুল কোড! আবার চেষ্টা করুন।'
        setSetupError(msg)
        setTimeout(() => verifyOtpRefs.current[0]?.focus(), 100)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'ভুল সিকিউরিটি কোড! সঠিক কোডটি দিন।'
      setSetupError(msg)
      setTimeout(() => verifyOtpRefs.current[0]?.focus(), 100)
    } finally {
      setSetupLoading(false)
    }
  }

  // Handle Disable 2FA
  const handleDisable2Fa = async (e) => {
    if (e) e.preventDefault()
    if (!disablePassword) {
      setDisableError('বর্তমান পাসওয়ার্ড দিন।')
      return
    }
    if (!disableCode.trim()) {
      setDisableError(useBackupForDisable ? 'ব্যাকআপ কোড দিন।' : 'গুগল অথেনটিকেটর কোড দিন।')
      return
    }

    setDisableLoading(true)
    setDisableError('')
    try {
      const res = await disableTwoFactorApi({
        password: disablePassword,
        code: disableCode.trim(),
      })
      if (res.data?.success) {
        showSuccess({
          title: 'নিরাপত্তা সেটিংস পরিবর্তন',
          message: 'Google Authenticator ২-ধাপ যাচাই সফলভাবে বন্ধ করা হয়েছে।',
          confirmText: 'ঠিক আছে',
          autoCloseMs: 2500
        })
        setShowDisableModal(false)
        resetDisableModalState()
        fetchStatus()
      } else {
        setDisableError(res.data?.message || 'বন্ধ করা ব্যর্থ হয়েছে।')
      }
    } catch (err) {
      setDisableError(err.response?.data?.message || 'ভুল পাসওয়ার্ড অথবা কোড!')
    } finally {
      setDisableLoading(false)
    }
  }

  const resetSetupModalState = () => {
    setSetupStep(1)
    setSetupPassword('')
    setSetupError('')
    setSetupData(null)
    setVerifyCode('')
    setSavedCodesChecked(false)
    setCopiedSecret(false)
    setCopiedCodes(false)
  }

  const resetDisableModalState = () => {
    setDisablePassword('')
    setDisableCode('')
    setDisableError('')
    setUseBackupForDisable(false)
  }

  const copySecretToClipboard = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret)
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2500)
    }
  }

  const copyCodesToClipboard = () => {
    if (setupData?.backup_codes?.length) {
      const text = setupData.backup_codes.join('\n')
      navigator.clipboard.writeText(text)
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2500)
    }
  }

  const downloadBackupCodes = () => {
    if (!setupData?.backup_codes?.length) return
    const content = [
      '====================================================',
      'DoctorBooklet / MedConnect — Emergency Backup Codes',
      '====================================================',
      'Keep these codes strictly confidential.',
      'Each code can only be used once if you lose access',
      'to your Google Authenticator app.',
      '',
      ...setupData.backup_codes.map((c, i) => `Code ${i + 1}: ${c}`),
      '',
      `Generated At: ${new Date().toLocaleString()}`,
      '===================================================='
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `medconnect-backup-codes-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      background: 'var(--admin-card-bg, #FFFFFF)',
      borderRadius: 16,
      border: '1px solid var(--admin-border)',
      padding: '24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      marginTop: 20
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: status.enabled ? '#ECFDF5' : '#F3F4F6',
            color: status.enabled ? '#059669' : '#6B7280',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            {status.enabled ? <ShieldCheck size={24} /> : <Smartphone size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                Google Authenticator (২-ধাপ যাচাই)
              </h4>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 99,
                background: status.enabled ? '#DEF7EC' : '#F3F4F6',
                color: status.enabled ? '#03543F' : '#6B7280'
              }}>
                {status.enabled ? (
                  <><CheckCircle2 size={12} /> সক্রিয় (Active)</>
                ) : (
                  'নিষ্ক্রিয় (Disabled)'
                )}
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)', maxWidth: 520, lineHeight: 1.5 }}>
              {status.enabled
                ? `লগইনের সময় Google Authenticator কোড যাচাই করা হবে। অবশিষ্ট এককালীন ব্যাকআপ কোড: ${status.backup_codes_remaining}টি।`
                : 'আপনার অ্যাকাউন্টকে হ্যাকিং বা অননুমোদিত অ্যাক্সেস থেকে রক্ষা করতে Google Authenticator ২-ধাপ যাচাই চালু করুন। এটি সম্পূর্ণ ঐচ্ছিক।'}
            </p>
          </div>
        </div>

        <div>
          {loading ? (
            <div style={{ padding: '8px 16px', fontSize: 13, color: 'var(--admin-text-muted)' }}>লোড হচ্ছে...</div>
          ) : status.enabled ? (
            <button
              onClick={() => {
                resetDisableModalState()
                setShowDisableModal(true)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#B91C1C',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <ShieldAlert size={15} /> ২-ধাপ যাচাই বন্ধ করুন
            </button>
          ) : (
            <button
              onClick={() => {
                resetSetupModalState()
                setShowSetupModal(true)
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 20px',
                borderRadius: 10,
                background: 'var(--admin-primary, #00B875)',
                border: 'none',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 184, 117, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <ShieldCheck size={16} /> ২-ধাপ যাচাই চালু করুন
            </button>
          )}
        </div>
      </div>

      {/* ===== INSTRUCTION & COMPARISON ACCORDION ===== */}
      <div style={{
        marginTop: 20,
        borderRadius: 12,
        border: '1px solid #E0E7FF',
        background: '#F8FAFF',
        overflow: 'hidden'
      }}>
        <button
          type="button"
          onClick={() => setShowGuide(!showGuide)}
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'none',
            border: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3730A3' }}>
              এটি চালু করলে কী সুবিধা এবং না করলে কী হবে? (সহায়িকা ও নির্দেশিকা)
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#4F46E5' }}>
            {showGuide ? 'সংক্ষেপ করুন ▲' : 'বিস্তারিত দেখুন ▼'}
          </span>
        </button>

        {showGuide && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid #EEF2FF', marginTop: 4 }}>
            {/* Comparison Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12, marginTop: 12 }}>
              {/* Option: Active */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #D1FAE5',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                  <strong style={{ fontSize: 13, color: '#065F46' }}>সক্রিয় (Active) করলে:</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                  <li><strong>পাসওয়ার্ড হ্যাকিং সুরক্ষা:</strong> কেউ আপনার পাসওয়ার্ড জেনে ফেললেও আপনার ফোনের অ্যাপ ছাড়া লগইন করতে পারবে না।</li>
                  <li><strong>তাত্ক্ষণিক লগইন:</strong> এসএমএস ওটিপির অপেক্ষা করতে হবে না; অ্যাপ খুলে ১ সেকেন্ডে কোড দিয়ে লগইন।</li>
                  <li><strong>জরুরি ব্যাকআপ:</strong> ফোন কাছে না থাকলে সংরক্ষিত ব্যাকআপ কোড দিয়ে নিরাপদে লগইন করার সুযোগ।</li>
                </ul>
              </div>

              {/* Option: Inactive */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: 10,
                border: '1px solid #E5E7EB',
                padding: '12px 14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#9CA3AF' }} />
                  <strong style={{ fontSize: 13, color: '#4B5563' }}>নিষ্ক্রিয় (Inactive) রাখলে:</strong>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#374151', lineHeight: 1.6 }}>
                  <li><strong>স্বাভাবিক ব্যবহার:</strong> আপনার অ্যাকাউন্ট আগের মতোই সাধারণ পাসওয়ার্ড দিয়ে চলবে।</li>
                  <li><strong>কোনো বাধ্যবাধকতা নেই:</strong> এটি সম্পূর্ণ আপনার ইচ্ছার ওপর নির্ভর করে (ঐচ্ছিক)।</li>
                  <li><strong>যেকোনো সময় পরিবর্তন:</strong> আপনি চাইলে ভবিষ্যতে যেকোনো দিন এটি চালু বা বন্ধ করতে পারবেন।</li>
                </ul>
              </div>
            </div>

            {/* 3 Step Setup Guide */}
            <div style={{
              marginTop: 12,
              background: '#FFFFFF',
              borderRadius: 10,
              border: '1px solid #E0E7FF',
              padding: '12px 14px'
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#3730A3', marginBottom: 6 }}>
                📱 কীভাবে চালু করবেন? (সহজ ৩টি ধাপ):
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12, color: '#4B5563' }}>
                <div style={{ background: '#F9FAFB', padding: '8px 10px', borderRadius: 8 }}>
                  <strong>১. অ্যাপ নামান:</strong> প্লে-স্টোর বা অ্যাপ-স্টোর থেকে <em>Google Authenticator</em> অ্যাপটি নামিয়ে নিন।
                </div>
                <div style={{ background: '#F9FAFB', padding: '8px 10px', borderRadius: 8 }}>
                  <strong>২. স্ক্যান করুন:</strong> "২-ধাপ যাচাই চালু করুন" বাটনে ক্লিক করে স্ক্রিনের QR কোডটি স্ক্যান করুন।
                </div>
                <div style={{ background: '#F9FAFB', padding: '8px 10px', borderRadius: 8 }}>
                  <strong>৩. কোড মিলিয়ে নিন:</strong> জরুরি ব্যাকআপ কোডগুলো সংরক্ষণ করে অ্যাপের ৬ সংখ্যার কোড দিয়ে নিশ্চিত করুন।
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== SETUP MODAL ===== */}
      {showSetupModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--admin-card-bg, #FFFFFF)',
            borderRadius: 20,
            border: '1px solid var(--admin-border)',
            maxWidth: 520,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--admin-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                    Google Authenticator সক্রিয়করণ
                  </h3>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>ধাপ {setupStep} / ২</div>
                </div>
              </div>
              <button
                onClick={() => setShowSetupModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', maxHeight: '78vh', overflowY: 'auto' }}>
              {setupStep === 1 && setupError && (
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
                  <AlertTriangle size={16} />
                  <span>{setupError}</span>
                </div>
              )}

              {setupStep === 1 ? (
                /* Step 1: Verify current password */
                <form onSubmit={handleStartSetup}>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
                    অ্যাকাউন্টের সুরক্ষার জন্য প্রথমে আপনার বর্তমান পাসওয়ার্ড প্রদান করুন:
                  </p>
                  <div style={{ position: 'relative', marginBottom: 20 }}>
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 14px',
                        borderRadius: 10,
                        border: '1.5px solid var(--admin-border)',
                        background: 'var(--admin-bg-alt)',
                        color: 'var(--admin-text)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer'
                      }}
                    >
                      {showSetupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setShowSetupModal(false)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '1px solid var(--admin-border)',
                        background: 'transparent',
                        color: 'var(--admin-text)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={setupLoading || !setupPassword}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'var(--admin-primary, #00B875)',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: setupLoading ? 'not-allowed' : 'pointer',
                        opacity: setupLoading || !setupPassword ? 0.7 : 1,
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {setupLoading ? (
                        <>
                          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                          <span>প্রসেস হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <span>পরবর্তী ধাপ</span>
                          <ArrowRight size={15} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: QR Code + Backup Codes + Verification test */
                <form onSubmit={handleEnable2Fa}>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{
                      display: 'inline-block',
                      padding: 12,
                      background: '#FFFFFF',
                      borderRadius: 16,
                      border: '1px solid #E5E7EB',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}>
                      {setupData?.qr_url && (
                        <QRCodeSVG value={setupData.qr_url} size={160} level="M" />
                      )}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: 'var(--admin-text-muted)' }}>
                      গুগল অথেনটিকেটর অ্যাপ দিয়ে QR কোডটি স্ক্যান করুন
                    </div>
                  </div>

                  {/* Manual Key */}
                  <div style={{
                    background: 'var(--admin-bg-alt)',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px dashed var(--admin-border)',
                    marginBottom: 16
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
                      অথবা ম্যানুয়ালি কোড যুক্ত করুন:
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <code style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-text)', wordBreak: 'break-all' }}>
                        {setupData?.secret}
                      </code>
                      <button
                        type="button"
                        onClick={copySecretToClipboard}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: copiedSecret ? '#059669' : '#6B7280',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                        {copiedSecret ? 'কপি হয়েছে' : 'কপি'}
                      </button>
                    </div>
                  </div>

                  {/* Backup Codes */}
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: 12,
                    padding: '14px',
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>
                        জরুরি ব্যাকআপ কোডসমূহ (৮টি):
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={copyCodesToClipboard}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: copiedCodes ? '#059669' : '#374151'
                          }}
                        >
                          {copiedCodes ? <Check size={12} /> : <Copy size={12} />}
                          কপি
                        </button>
                        <button
                          type="button"
                          onClick={downloadBackupCodes}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #D1D5DB',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            color: '#374151'
                          }}
                        >
                          <Download size={12} /> ডাউনলোড
                        </button>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6
                    }}>
                      {setupData?.backup_codes?.map((code, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: 6,
                            padding: '5px',
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            textAlign: 'center',
                            color: '#111827'
                          }}
                        >
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 16, userSelect: 'none' }}>
                    <CustomCheckbox
                      checked={savedCodesChecked}
                      onChange={(e) => setSavedCodesChecked(e.target.checked)}
                      color="#10B981"
                      style={{ marginTop: 2 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--admin-text)', lineHeight: 1.4 }}>
                      আমি আমার ব্যাকআপ রিকভারি কোডগুলো ডাউনলোড অথবা নিরাপদ স্থানে সংরক্ষণ করেছি।
                    </span>
                  </label>

                  {/* 6-digit Code input for test */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
                        অ্যাপ থেকে ৬-সংখ্যার কোডটি দিন (যাচাইকরণ):
                      </label>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                        {verifyCode.length}/৬ ডিজিট
                      </span>
                    </div>

                    <div 
                      className="admin-otp-grid" 
                      onPaste={handleOtpPaste}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(6, 1fr)',
                        gap: '8px',
                        maxWidth: '360px',
                        margin: '0 auto'
                      }}
                    >
                      {verifyOtp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (verifyOtpRefs.current[idx] = el)}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          style={{
                            width: '100%',
                            height: '52px',
                            border: setupError 
                              ? '2px solid #EF4444' 
                              : (digit ? '2px solid var(--admin-primary, #00B875)' : '1.5px solid var(--admin-border, #CBD5E1)'),
                            borderRadius: '12px',
                            textAlign: 'center',
                            fontSize: '22px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: setupError 
                              ? '#DC2626' 
                              : (digit ? 'var(--admin-primary, #00B875)' : 'var(--admin-text, #0F172A)'),
                            background: setupError 
                              ? '#FEF2F2' 
                              : (digit ? 'rgba(0, 184, 117, 0.08)' : 'var(--admin-bg-alt, #F8FAFC)'),
                            outline: 'none',
                            boxShadow: setupError 
                              ? '0 0 0 3px rgba(239, 68, 68, 0.18)' 
                              : (digit ? '0 2px 8px rgba(0, 184, 117, 0.12)' : 'none'),
                            transition: 'all 0.15s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = setupError ? '#EF4444' : 'var(--admin-primary, #00B875)'
                            e.target.style.background = '#FFFFFF'
                            e.target.style.boxShadow = setupError ? '0 0 0 3px rgba(239, 68, 68, 0.18)' : '0 0 0 3px rgba(0, 184, 117, 0.18)'
                            e.target.select()
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = setupError ? '#EF4444' : (digit ? 'var(--admin-primary, #00B875)' : 'var(--admin-border, #CBD5E1)')
                            e.target.style.background = setupError ? '#FEF2F2' : (digit ? 'rgba(0, 184, 117, 0.08)' : 'var(--admin-bg-alt, #F8FAFC)')
                            e.target.style.boxShadow = setupError ? '0 0 0 3px rgba(239, 68, 68, 0.18)' : (digit ? '0 2px 8px rgba(0, 184, 117, 0.12)' : 'none')
                          }}
                        />
                      ))}
                    </div>

                    {/* Error message directly under OTP boxes */}
                    {setupError && (
                      <div style={{
                        marginTop: 12,
                        padding: '10px 14px',
                        background: '#FEF2F2',
                        border: '1.5px solid #FCA5A5',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        color: '#DC2626'
                      }}>
                        <AlertTriangle size={16} style={{ flexShrink: 0, color: '#DC2626' }} />
                        <span>{setupError}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setSetupStep(1)}
                      style={{
                        padding: '10px 18px',
                        borderRadius: 10,
                        border: '1px solid var(--admin-border)',
                        background: 'transparent',
                        color: 'var(--admin-text)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      পেছনে
                    </button>
                    <button
                      type="submit"
                      disabled={setupLoading || !savedCodesChecked || verifyCode.length !== 6}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 24px',
                        borderRadius: 10,
                        border: 'none',
                        background: 'var(--admin-primary, #00B875)',
                        color: '#FFFFFF',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: setupLoading || !savedCodesChecked || verifyCode.length !== 6 ? 'not-allowed' : 'pointer',
                        opacity: setupLoading || !savedCodesChecked || verifyCode.length !== 6 ? 0.6 : 1
                      }}
                    >
                      {setupLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                      যাচাই ও সক্রিয় করুন
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== DISABLE MODAL ===== */}
      {showDisableModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--admin-card-bg, #FFFFFF)',
            borderRadius: 20,
            border: '1px solid var(--admin-border)',
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--admin-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEE2E2', color: '#B91C1C', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text)' }}>
                  ২-ধাপ যাচাই বন্ধ করুন
                </h3>
              </div>
              <button
                onClick={() => setShowDisableModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {disableError && (
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
                  <AlertTriangle size={16} />
                  <span>{disableError}</span>
                </div>
              )}

              <form onSubmit={handleDisable2Fa}>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--admin-text)', marginBottom: 6 }}>
                    বর্তমান পাসওয়ার্ড:
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showDisablePassword ? 'text' : 'password'}
                      placeholder="পাসওয়ার্ড লিখুন"
                      value={disablePassword}
                      onChange={(e) => setDisablePassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 38px 10px 12px',
                        borderRadius: 8,
                        border: '1.5px solid var(--admin-border)',
                        background: 'var(--admin-bg-alt)',
                        color: 'var(--admin-text)',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDisablePassword(!showDisablePassword)}
                      style={{
                        position: 'absolute',
                        right: 10,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#9CA3AF',
                        cursor: 'pointer'
                      }}
                    >
                      {showDisablePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
                      {useBackupForDisable ? 'জরুরি ব্যাকআপ কোড:' : 'গুগল অথেনটিকেটর কোড:'}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setUseBackupForDisable(!useBackupForDisable)
                        setDisableCode('')
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-primary, #00B875)',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {useBackupForDisable ? 'অ্যাপ কোড ব্যবহার করুন' : 'ব্যাকআপ কোড দিন'}
                    </button>
                  </div>

                  <input
                    type="text"
                    maxLength={useBackupForDisable ? 12 : 6}
                    placeholder={useBackupForDisable ? 'A7E2-9K1F' : '123456'}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: '1.5px solid var(--admin-border)',
                      background: 'var(--admin-bg-alt)',
                      color: 'var(--admin-text)',
                      fontSize: 16,
                      textAlign: 'center',
                      fontWeight: 700,
                      letterSpacing: useBackupForDisable ? 2 : 4,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowDisableModal(false)}
                    style={{
                      padding: '9px 16px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border)',
                      background: 'transparent',
                      color: 'var(--admin-text)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={disableLoading || !disablePassword || !disableCode}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 18px',
                      borderRadius: 8,
                      border: 'none',
                      background: '#DC2626',
                      color: '#FFFFFF',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: disableLoading || !disablePassword || !disableCode ? 'not-allowed' : 'pointer',
                      opacity: disableLoading || !disablePassword || !disableCode ? 0.6 : 1
                    }}
                  >
                    {disableLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                    নিষ্ক্রিয় করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
