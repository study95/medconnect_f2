import React, { useState, useEffect } from 'react'
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
  const [verifyCode, setVerifyCode] = useState('')
  const [savedCodesChecked, setSavedCodesChecked] = useState(false)
  const [copiedSecret, setCopiedSecret] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

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

  const resetViews = () => {
    setIsSettingUp(false)
    setSetupStep(1)
    setSetupPassword('')
    setSetupError('')
    setSetupData(null)
    setVerifyCode('')
    setSavedCodesChecked(false)
    setIsDisabling(false)
    setDisablePassword('')
    setDisableCode('')
    setDisableError('')
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
    if (!cleanCode) {
      setSetupError('গুগল অথেনটিকেটর অ্যাপের ৬ ডিজিটের কোড দিন।')
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
        setSetupError(res.data?.message || 'যাচাইকরণ ব্যর্থ হয়েছে। সঠিক ৬-সংখ্যার কোড দিন।')
      }
    } catch (err) {
      setSetupError(err.response?.data?.message || 'ভুল অথেনটিকেটর কোড! আবার চেষ্টা করুন।')
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
              {setupError && (
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
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <div style={{
                      display: 'inline-block',
                      padding: 12,
                      background: '#FFFFFF',
                      borderRadius: 14,
                      border: '2px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}>
                      {setupData?.qr_url && (
                        <QRCodeSVG value={setupData.qr_url} size={160} level="M" />
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>
                      আপনার মোবাইলের <strong>Google Authenticator</strong> অ্যাপে গিয়ে QR কোডটি স্ক্যান করুন।
                    </div>
                  </div>

                  {/* Manual Secret Key */}
                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 10,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16
                  }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>ম্যানুয়াল সিক্রেট কি</div>
                      <div style={{ fontSize: 12.5, fontWeight: 800, color: '#0F172A', fontFamily: 'monospace', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {setupData?.secret}
                      </div>
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
                        gap: 4
                      }}
                    >
                      {copiedSecret ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedSecret ? 'কপি হয়েছে' : 'কপি'}</span>
                    </button>
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
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', marginBottom: 6 }}>
                      অ্যাপ থেকে ৬-সংখ্যার কোড দিন
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="যেমন: 123456"
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1.5px solid #CBD5E1',
                        fontSize: 18,
                        fontWeight: 800,
                        textAlign: 'center',
                        letterSpacing: '0.25em',
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />
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
                      disabled={setupLoading || !verifyCode || !savedCodesChecked}
                      style={{
                        padding: '10px 22px',
                        borderRadius: 10,
                        border: 'none',
                        background: setupLoading || !verifyCode || !savedCodesChecked ? '#94A3B8' : '#059669',
                        color: '#FFFFFF',
                        fontSize: 13.5,
                        fontWeight: 700,
                        cursor: setupLoading || !verifyCode || !savedCodesChecked ? 'not-allowed' : 'pointer',
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
                /* Enabled State */
                <div>
                  <div style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 14,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 18
                  }}>
                    <CheckCircle2 size={24} style={{ color: '#059669', flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#065F46' }}>
                        Google Authenticator (2FA) সক্রিয় আছে
                      </div>
                      <div style={{ fontSize: 12, color: '#047857', marginTop: 3, lineHeight: 1.45 }}>
                        আপনার অ্যাকাউন্ট সম্পূর্ণ সুরক্ষিত। প্রতিবার নতুন লগইনে Google Authenticator অ্যাপের ৬ সংখ্যার কোড প্রয়োজন হবে।
                      </div>
                      {status.setup_at && (
                        <div style={{ fontSize: 11, color: '#059669', marginTop: 6 }}>
                          চালু করার তারিখ: {new Date(status.setup_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                    padding: '12px 14px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12.5
                  }}>
                    <span style={{ color: '#475569', fontWeight: 600 }}>অবশিষ্ট জরুরি ব্যাকআপ কোড:</span>
                    <strong style={{ color: '#0F172A', fontFamily: 'monospace', fontSize: 14 }}>
                      {status.backup_codes_remaining} টি
                    </strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                    <button
                      type="button"
                      onClick={onClose}
                      style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid #CBD5E1', background: '#FFFFFF', color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    >
                      বন্ধ করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDisabling(true)}
                      style={{
                        padding: '9px 18px',
                        borderRadius: 10,
                        border: '1px solid #FECACA',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      নিষ্ক্রিয় করুন
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
