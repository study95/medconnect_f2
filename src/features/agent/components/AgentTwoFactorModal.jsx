import React, { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  KeyRound, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Loader2, 
  ArrowRight,
  Lock,
  RefreshCw
} from 'lucide-react'
import { 
  getTwoFactorStatusApi, 
  setupTwoFactorApi, 
  enableTwoFactorApi, 
  disableTwoFactorApi 
} from '../../../api/authApi'
import { toast } from 'react-hot-toast'
import CustomCheckbox from '../../../components/common/CustomCheckbox'

export default function AgentTwoFactorModal({ isOpen, onClose, onStatusChange }) {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState({ enabled: false, setup_at: null, backup_codes_remaining: 0 })

  // Setup Flow States
  const [isSettingUp, setIsSettingUp] = useState(false)
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
  const [showManualKey, setShowManualKey] = useState(false)

  // Disable Flow States
  const [isDisabling, setIsDisabling] = useState(false)
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisablePassword, setShowDisablePassword] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [useBackupForDisable, setUseBackupForDisable] = useState(false)
  const [disableLoading, setDisableLoading] = useState(false)
  const [disableError, setDisableError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchStatus()
      resetViews()
    }
  }, [isOpen])

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (setupStep === 2 && verifyOtpRefs.current[0]) {
      setTimeout(() => verifyOtpRefs.current[0]?.focus(), 150)
    }
  }, [setupStep])

  const resetViews = () => {
    setIsSettingUp(false)
    setSetupStep(1)
    setSetupPassword('')
    setSetupError('')
    setSetupData(null)
    setVerifyOtp(['', '', '', '', '', ''])
    setSavedCodesChecked(false)
    setShowManualKey(false)
    setIsDisabling(false)
    setDisablePassword('')
    setDisableCode('')
    setDisableError('')
  }

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

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await getTwoFactorStatusApi()
      if (res.data?.success) {
        const newStatus = {
          enabled: Boolean(res.data.enabled),
          setup_at: res.data.setup_at || null,
          backup_codes_remaining: res.data.backup_codes_remaining || 0,
        }
        setStatus(newStatus)
        if (typeof onStatusChange === 'function') {
          onStatusChange(newStatus.enabled)
        }
      }
    } catch (e) {
      console.error('Failed to fetch 2FA status:', e)
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Verify password to generate QR code and secret
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

  // Step 2: Verify test 6-digit code and activate 2FA
  const handleEnable2Fa = async (e) => {
    if (e) e.preventDefault()
    const cleanCode = verifyCode.trim()
    if (!cleanCode || cleanCode.length !== 6) {
      setSetupError('গুগল অথেনটিকেটর অ্যাপের ৬ ডিজিটের কোড দিন।')
      verifyOtpRefs.current[0]?.focus()
      return
    }
    if (!savedCodesChecked) {
      setSetupError('অনুগ্রহ করে ব্যাকআপ কোডগুলো নিরাপদ স্থানে সংরক্ষণ করার বক্সে টিক দিন।')
      return
    }

    setSetupLoading(true)
    setSetupError('')
    try {
      const res = await enableTwoFactorApi({ code: cleanCode })
      if (res.data?.success) {
        toast.success('Google Authenticator (2FA) সফলভাবে সক্রিয় করা হয়েছে!')
        await fetchStatus()
        resetViews()
      } else {
        const msg = res.data?.message || 'যাচাইকরণ ব্যর্থ হয়েছে। সঠিক ৬-সংখ্যার কোড দিন।'
        setSetupError(msg)
        setTimeout(() => {
          verifyOtpRefs.current[0]?.focus()
          verifyOtpRefs.current[0]?.select?.()
        }, 100)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'ভুল অথেনটিকেটর কোড! আবার চেষ্টা করুন।'
      setSetupError(msg)
      setTimeout(() => {
        verifyOtpRefs.current[0]?.focus()
        verifyOtpRefs.current[0]?.select?.()
      }, 100)
    } finally {
      setSetupLoading(false)
    }
  }

  // Disable 2FA
  const handleDisable2Fa = async (e) => {
    if (e) e.preventDefault()
    if (!disablePassword) {
      setDisableError('বর্তমান পাসওয়ার্ড প্রদান করুন।')
      return
    }
    const cleanCode = disableCode.trim()
    if (!cleanCode) {
      setDisableError(useBackupForDisable ? 'জরুরি ব্যাকআপ কোড দিন।' : 'গুগল অথেনটিকেটর কোড দিন।')
      return
    }

    setDisableLoading(true)
    setDisableError('')
    try {
      const res = await disableTwoFactorApi({
        password: disablePassword,
        code: cleanCode,
      })
      if (res.data?.success) {
        toast.success('Google Authenticator (2FA) সফলভাবে নিষ্ক্রিয় করা হয়েছে।')
        await fetchStatus()
        resetViews()
      } else {
        setDisableError(res.data?.message || 'নিষ্ক্রিয়করণ ব্যর্থ হয়েছে।')
      }
    } catch (err) {
      setDisableError(err.response?.data?.message || 'পাসওয়ার্ড বা সিকিউরিটি কোড সঠিক নয়।')
    } finally {
      setDisableLoading(false)
    }
  }

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    if (type === 'secret') {
      setCopiedSecret(true)
      setTimeout(() => setCopiedSecret(false), 2000)
    } else {
      setCopiedCodes(true)
      setTimeout(() => setCopiedCodes(false), 2000)
    }
  }

  const downloadBackupCodes = () => {
    if (!setupData?.backup_codes) return
    const content = `DoctorBooklet Field Agent - 2FA Emergency Backup Codes\nGenerated: ${new Date().toLocaleString()}\n\n` +
      setupData.backup_codes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
      `\n\n* Keep these codes safe. Each code can be used once if you lose access to Google Authenticator.`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `doctorbooklet-agent-backup-codes.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        maxWidth: 500,
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        animation: 'agentModalSlideUp 0.25s ease-out',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: status.enabled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(2, 132, 199, 0.1)',
              color: status.enabled ? '#059669' : '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                ২-ধাপ নিরাপত্তা (Google 2FA)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                Google Authenticator দিয়ে একাউন্ট সুরক্ষিত রাখুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              color: '#64748B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '22px 24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 10px' }} />
              <div style={{ fontSize: 13, fontWeight: 600 }}>তথ্য লোড হচ্ছে...</div>
            </div>
          ) : isSettingUp ? (
            /* ── Setup Flow ── */
            <div>
              {setupStep === 1 && setupError && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 12.5,
                  color: '#DC2626'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{setupError}</span>
                </div>
              )}

              {setupStep === 1 ? (
                /* Setup Step 1: Confirm Password */
                <form onSubmit={handleStartSetup}>
                  <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                    নিরাপত্তার স্বার্থে Google Authenticator সেটআপ শুরু করার পূর্বে আপনার বর্তমান অ্যাকাউন্টের পাসওয়ার্ড যাচাই করা আবশ্যক।
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                      বর্তমান পাসওয়ার্ড
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showSetupPassword ? 'text' : 'password'}
                        required
                        value={setupPassword}
                        onChange={(e) => setSetupPassword(e.target.value)}
                        placeholder="আপনার পাসওয়ার্ড লিখুন"
                        style={{
                          width: '100%',
                          padding: '10px 40px 10px 14px',
                          borderRadius: 10,
                          border: '1.5px solid #CBD5E1',
                          fontSize: 13.5,
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupPassword(!showSetupPassword)}
                        style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                      >
                        {showSetupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setIsSettingUp(false)}
                      style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      বাতিল
                    </button>
                    <button
                      type="submit"
                      disabled={setupLoading || !setupPassword}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none',
                        background: setupLoading || !setupPassword ? '#94A3B8' : '#059669',
                        color: '#FFFFFF',
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: setupLoading || !setupPassword ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {setupLoading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                      <span>এগিয়ে যান</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </form>
              ) : (
                /* Setup Step 2: QR Code, Backup Codes & Verification */
                <form onSubmit={handleEnable2Fa}>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{
                      display: 'inline-block',
                      padding: 10,
                      background: '#FFFFFF',
                      borderRadius: 14,
                      border: '2px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}>
                      {setupData?.qr_url && (
                        <QRCodeSVG value={setupData.qr_url} size={145} level="M" />
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 6 }}>
                      আপনার মোবাইলের <strong>Google Authenticator</strong> অ্যাপে গিয়ে QR কোডটি স্ক্যান করুন।
                    </div>
                  </div>

                  {/* Manual Secret Key (Collapsible for cleaner UI & compact height) */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '8px 12px',
                    marginBottom: 14
                  }}>
                    <div 
                      onClick={() => setShowManualKey(!showManualKey)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 700, color: '#475569' }}>
                        <KeyRound size={13} color="#059669" />
                        <span>ক্যামেরা দিয়ে স্ক্যান না হলে ম্যানুয়াল সিক্রেট কি</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                        {showManualKey ? 'লুকান ▲' : 'দেখুন ▼'}
                      </span>
                    </div>

                    {showManualKey && (
                      <div style={{
                        marginTop: 8,
                        paddingTop: 8,
                        borderTop: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8
                      }}>
                        <div style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: '#0F172A',
                          fontFamily: 'monospace',
                          letterSpacing: '0.04em',
                          wordBreak: 'break-all'
                        }}>
                          {setupData?.secret}
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(setupData?.secret, 'secret')}
                          style={{
                            background: copiedSecret ? '#059669' : '#FFFFFF',
                            color: copiedSecret ? '#FFFFFF' : '#475569',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0
                          }}
                        >
                          {copiedSecret ? <Check size={12} /> : <Copy size={12} />}
                          <span>{copiedSecret ? 'কপি হয়েছে' : 'কপি'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Backup Codes Section */}
                  <div style={{
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 16
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E' }}>
                        ইমার্জেন্সি ব্যাকআপ কোডসমূহ (৮টি)
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(setupData?.backup_codes?.join(', '), 'codes')}
                          style={{ background: 'none', border: 'none', color: '#B45309', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          {copiedCodes ? 'সব কপি হয়েছে!' : 'সব কপি করুন'}
                        </button>
                        <span>•</span>
                        <button
                          type="button"
                          onClick={downloadBackupCodes}
                          style={{ background: 'none', border: 'none', color: '#B45309', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          ডাউনলোড
                        </button>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 6,
                      fontSize: 11.5,
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#78350F'
                    }}>
                      {setupData?.backup_codes?.map((c, i) => (
                        <div key={i} style={{ background: '#FEF3C7', padding: '3px 6px', borderRadius: 4, textAlign: 'center' }}>
                          {c}
                        </div>
                      ))}
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 10, cursor: 'pointer', fontSize: 11.5, color: '#92400E', userSelect: 'none' }}>
                      <CustomCheckbox
                        checked={savedCodesChecked}
                        onChange={(e) => setSavedCodesChecked(e.target.checked)}
                        color="#10B981"
                        style={{ marginTop: 2 }}
                      />
                      <span>আমি ব্যাকআপ কোডগুলো নিরাপদ স্থানে কপি বা সেভ করে রেখেছি।</span>
                    </label>
                  </div>

                  {/* Test 6-digit Code Input */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                        অ্যাপ থেকে ৬-সংখ্যার কোড দিন
                      </label>
                      <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                        {verifyCode.length}/৬ ডিজিট
                      </span>
                    </div>

                    <div 
                      className="agent-otp-grid" 
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
                              : (digit ? '2px solid #059669' : '1.5px solid #CBD5E1'),
                            borderRadius: '12px',
                            textAlign: 'center',
                            fontSize: '22px',
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            color: setupError 
                              ? '#DC2626' 
                              : (digit ? '#065F46' : '#0F172A'),
                            background: setupError 
                              ? '#FEF2F2' 
                              : (digit ? '#ECFDF5' : '#F8FAFC'),
                            outline: 'none',
                            boxShadow: setupError 
                              ? '0 0 0 3px rgba(239, 68, 68, 0.18)' 
                              : (digit ? '0 2px 8px rgba(5, 150, 105, 0.12)' : 'none'),
                            transition: 'all 0.15s ease'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = setupError ? '#EF4444' : '#059669'
                            e.target.style.background = '#FFFFFF'
                            e.target.style.boxShadow = setupError ? '0 0 0 3px rgba(239, 68, 68, 0.18)' : '0 0 0 3px rgba(5, 150, 105, 0.18)'
                            e.target.select()
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = setupError ? '#EF4444' : (digit ? '#059669' : '#CBD5E1')
                            e.target.style.background = setupError ? '#FEF2F2' : (digit ? '#ECFDF5' : '#F8FAFC')
                            e.target.style.boxShadow = setupError ? '0 0 0 3px rgba(239, 68, 68, 0.18)' : (digit ? '0 2px 8px rgba(5, 150, 105, 0.12)' : 'none')
                          }}
                        />
                      ))}
                    </div>

                    {/* Error display directly under OTP boxes */}
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
                      style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      পেছনে
                    </button>
                    <button
                      type="submit"
                      disabled={setupLoading || verifyCode.length !== 6 || !savedCodesChecked}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none',
                        background: setupLoading || verifyCode.length !== 6 || !savedCodesChecked ? '#94A3B8' : '#059669',
                        color: '#FFFFFF',
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: setupLoading || verifyCode.length !== 6 || !savedCodesChecked ? 'not-allowed' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      {setupLoading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                      <span>সক্রিয় করুন</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : isDisabling ? (
            /* ── Disable Flow ── */
            <form onSubmit={handleDisable2Fa}>
              {disableError && (
                <div style={{
                  marginBottom: 16,
                  padding: '12px 14px',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  fontSize: 12.5,
                  color: '#DC2626'
                }}>
                  <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>{disableError}</span>
                </div>
              )}

              <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
                Google Authenticator নিষ্ক্রিয় করলে আপনার অ্যাকাউন্টের ২-ধাপ নিরাপত্তা বন্ধ হয়ে যাবে। নিশ্চিত করতে পাসওয়ার্ড ও সিকিউরিটি কোড দিন।
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                  বর্তমান পাসওয়ার্ড
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input
                    type={showDisablePassword ? 'text' : 'password'}
                    required
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="পাসওয়ার্ড দিন"
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: 13.5,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    style={{ position: 'absolute', right: 12, background: 'none', border: 'none', color: '#64748B', cursor: 'pointer' }}
                  >
                    {showDisablePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                    {useBackupForDisable ? 'জরুরি ব্যাকআপ কোড' : 'Google Authenticator কোড'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupForDisable(!useBackupForDisable)
                      setDisableCode('')
                    }}
                    style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: 11, fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    {useBackupForDisable ? 'অ্যাপ কোড ব্যবহার করুন' : 'ব্যাকআপ কোড দিয়ে নিষ্ক্রিয় করুন'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value.trim())}
                  placeholder={useBackupForDisable ? 'যেমন: a1b2c3d4' : 'যেমন: 123456'}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsDisabling(false)}
                  style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={disableLoading || !disablePassword || !disableCode}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: disableLoading || !disablePassword || !disableCode ? '#94A3B8' : '#DC2626',
                    color: '#FFFFFF',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: disableLoading || !disablePassword || !disableCode ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  {disableLoading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
                  <span>নিষ্ক্রিয় নিশ্চিত করুন</span>
                </button>
              </div>
            </form>
          ) : (
            /* ── Default Status Overview Screen ── */
            <div>
              {status.enabled ? (
                /* Enabled State - Inspiring & Reassuring View */
                <div>
                  <div style={{
                    background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                    border: '1.5px solid #A7F3D0',
                    borderRadius: 16,
                    padding: '20px 18px',
                    textAlign: 'center',
                    marginBottom: 18,
                    boxShadow: '0 4px 16px rgba(5, 150, 105, 0.08)'
                  }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: '#10B981',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                      marginBottom: 12
                    }}>
                      <ShieldCheck size={28} />
                    </div>

                    <h4 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 900, color: '#065F46' }}>
                      আপনার অ্যাকাউন্ট সর্বোচ্চ সুরক্ষায় সক্রিয়!
                    </h4>

                    <p style={{ margin: '0 0 14px', fontSize: 12.5, color: '#047857', lineHeight: 1.55 }}>
                      অভিনন্দন! আপনার ফিল্ড পার্টনার প্রোফাইল ও কমিশন ওয়ালেটে Google 2FA নিরাপত্তা সক্রিয় রয়েছে। এখন আপনার পাসওয়ার্ড অন্য কারও জানা থাকলেও আপনার ফোন ছাড়া কেউ লগইন করতে পারবে না।
                    </p>

                    {status.setup_at && (
                      <div style={{
                        display: 'inline-block',
                        background: '#FFFFFF',
                        border: '1px solid #BBF7D0',
                        borderRadius: 20,
                        padding: '4px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#059669'
                      }}>
                        🛡️ চালুর তারিখ: {new Date(status.setup_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </div>
                    )}
                  </div>

                  {/* Primary OK Button */}
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      width: '100%',
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: 'none',
                      background: 'linear-gradient(135deg, #065F46 0%, #059669 100%)',
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Check size={18} />
                    <span>ঠিক আছে (সুরক্ষিত থাকুন)</span>
                  </button>

                  {/* Discreet Deactivate Link */}
                  <div style={{ textAlign: 'center', marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={() => setIsDisabling(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#94A3B8',
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      প্রয়োজনে ২-ধাপ নিরাপত্তা নিষ্ক্রিয় করতে চান? এখানে ক্লিক করুন
                    </button>
                  </div>
                </div>
              ) : (
                /* Disabled State */
                <div>
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 14,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 18
                  }}>
                    <ShieldAlert size={24} style={{ color: '#D97706', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>
                        ২-ধাপ নিরাপত্তা সক্রিয় নয়
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 1.45 }}>
                        Google Authenticator (2FA) সক্রিয় করলে আপনার ফিল্ড পার্টনার অ্যাকাউন্ট ও কমিশন ওয়ালেট সর্বোচ্চ নিরাপদ থাকবে। অন্য কেউ পাসওয়ার্ড জানলেও আপনার ফোনে কোড ছাড়া লগইন করতে পারবে না।
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#F1F5F9',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 20,
                    fontSize: 12,
                    color: '#334155',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>কোনো এসএমএস গেটওয়ে বা ফি নেই (সম্পূর্ণ ফ্রি)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>ইন্টারনেট না থাকলেও অ্যাপে প্রতি ৩০ সেকেন্ডে নতুন কোড জেনারেট হয়</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle2 size={14} color="#059669" />
                      <span>জরুরি ব্যাকআপ রিকভারি কোড দিয়ে যেকোনো সময় একাউন্ট উদ্ধার সম্ভব</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      বাতিল
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingUp(true)}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#059669',
                        color: '#FFFFFF',
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)'
                      }}
                    >
                      <ShieldCheck size={16} />
                      <span>Google 2FA চালু করুন</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes agentModalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
