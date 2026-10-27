import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePasswordApi, resendPasswordOtpApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Lock, Save, Eye, EyeOff, ShieldCheck, KeyRound, RotateCw, X, Loader2, Clock } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../utils/dialogMessages'

const toBnNum = (num) => String(num).replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[d])

export default function AdminPasswordPage() {
  const { showSuccess, showError } = useDialog()
  const { logout } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [errors, setErrors] = useState({})
  
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [maskedPhone, setMaskedPhone] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [resendLoading, setResendLoading] = useState(false)

  // OTP Countdown Timer
  useEffect(() => {
    if (!showOtpModal || cooldown <= 0) return
    const timer = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [showOtpModal, cooldown])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }))
    }
  }

  // Initial Form Save (Triggers OTP for Admin)
  const handleSave = async (e) => {
    e.preventDefault()
    const newErrors = {}

    if (!form.current_password) {
      newErrors.current_password = 'বর্তমান পাসওয়ার্ড দেওয়া বাধ্যতামূলক।'
    }
    if (!form.new_password) {
      newErrors.new_password = 'নতুন পাসওয়ার্ড দেওয়া বাধ্যতামূলক।'
    } else if (form.new_password.length < 6) {
      newErrors.new_password = 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
    }
    if (!form.new_password_confirmation) {
      newErrors.new_password_confirmation = 'পাসওয়ার্ড নিশ্চিতকরণ দেওয়া বাধ্যতামূলক।'
    } else if (form.new_password && form.new_password !== form.new_password_confirmation) {
      newErrors.new_password_confirmation = 'নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setLoading(true)
    try {
      const res = await updatePasswordApi(form)

      // If backend requires OTP (Admin role):
      if (res.data?.requires_otp) {
        setMaskedPhone(res.data.masked_phone || '')
        setCooldown(res.data.cooldown_seconds || 60)
        setOtp('')
        setOtpError('')
        setShowOtpModal(true)
        return
      }

      // If no OTP was required (normal user) and password updated:
      if (res.data?.requires_logout) {
        showSuccess({
          title: 'পাসওয়ার্ড পরিবর্তিত হয়েছে',
          message: res.data.message || 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।',
          confirmText: 'লগইন করুন',
          onConfirm: () => {
            logout()
            navigate('/login')
          }
        })
        setTimeout(() => {
          logout()
          navigate('/login')
        }, 2500)
        return
      }

      showSuccess({
        title: 'পাসওয়ার্ড পরিবর্তিত হয়েছে',
        message: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।',
      })
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' })
      setErrors({})
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      const msg = err.response?.data?.message || err.response?.data?.error || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে'
      
      if (backendErrors) {
        setErrors({
          current_password: backendErrors.current_password?.[0] || '',
          new_password: backendErrors.new_password?.[0] || '',
          new_password_confirmation: backendErrors.new_password_confirmation?.[0] || ''
        })
      } else if (msg.includes('বর্তমান') || msg.toLowerCase().includes('current password')) {
        setErrors({ current_password: msg })
      } else {
        setErrors({ general: msg })
        showError({
          title: DIALOG_MESSAGES.ERROR.title,
          message: msg,
        })
      }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and complete password update
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault()
    if (!otp || otp.trim().length < 6) {
      setOtpError('৬ সংখ্যার ওটিপি কোড লিখুন।')
      return
    }

    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await updatePasswordApi({
        ...form,
        otp: otp.trim()
      })

      if (res.data?.success) {
        setShowOtpModal(false)
        setForm({ current_password: '', new_password: '', new_password_confirmation: '' })
        setErrors({})

        // Auto logout & redirect to login page
        showSuccess({
          title: 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে',
          message: res.data.message || 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। অনুগ্রহ করে পুনরায় লগইন করুন।',
          confirmText: 'লগইন করুন',
          onConfirm: () => {
            logout()
            navigate('/login')
          }
        })

        setTimeout(() => {
          logout()
          navigate('/login')
        }, 2500)
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'ভুল ওটিপি কোড! অনুগ্রহ করে আবার চেষ্টা করুন।'
      setOtpError(msg)
    } finally {
      setOtpLoading(false)
    }
  }

  // Resend OTP code
  const handleResendOtp = async () => {
    if (cooldown > 0 || resendLoading) return
    setResendLoading(true)
    setOtpError('')
    try {
      const res = await resendPasswordOtpApi()
      if (res.data?.success) {
        setCooldown(res.data.cooldown_seconds || 60)
        setOtp('')
      }
    } catch (err) {
      setOtpError(err.response?.data?.message || 'ওটিপি পুনরায় পাঠানো সম্ভব হয়নি।')
    } finally {
      setResendLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#EEF2FF', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={24} color="#4338CA" />
        </div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>Update Password</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-text-muted)' }}>Ensure your account is using a long, secure password.</p>
        </div>
      </div>

      <div style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSave} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {errors.general && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', color: '#EF4444', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              {errors.general}
            </div>
          )}

          {/* Current Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showCurrent ? "text" : "password"} 
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
                placeholder="Enter current password"
                style={{ 
                  width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, 
                  border: errors.current_password ? '1.5px solid #EF4444' : '1.5px solid var(--admin-border)', 
                  background: errors.current_password ? '#FFF5F5' : 'var(--admin-bg-alt)', 
                  outline: 'none', color: 'var(--admin-text)', fontSize: 14,
                  transition: 'border-color 0.2s'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showCurrent ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
              </button>
            </div>
            {errors.current_password && (
              <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                ⚠️ {errors.current_password}
              </span>
            )}
          </div>

          {/* New Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNew ? "text" : "password"} 
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                style={{ 
                  width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, 
                  border: errors.new_password ? '1.5px solid #EF4444' : '1.5px solid var(--admin-border)', 
                  background: errors.new_password ? '#FFF5F5' : 'var(--admin-bg-alt)', 
                  outline: 'none', color: 'var(--admin-text)', fontSize: 14,
                  transition: 'border-color 0.2s'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showNew ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
              </button>
            </div>
            {errors.new_password ? (
              <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                ⚠️ {errors.new_password}
              </span>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '2px 0 0' }}>
                Must be at least 6 characters.
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirm ? "text" : "password"} 
                name="new_password_confirmation"
                value={form.new_password_confirmation}
                onChange={handleChange}
                placeholder="Confirm new password"
                style={{ 
                  width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, 
                  border: errors.new_password_confirmation ? '1.5px solid #EF4444' : '1.5px solid var(--admin-border)', 
                  background: errors.new_password_confirmation ? '#FFF5F5' : 'var(--admin-bg-alt)', 
                  outline: 'none', color: 'var(--admin-text)', fontSize: 14,
                  transition: 'border-color 0.2s'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showConfirm ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
              </button>
            </div>
            {errors.new_password_confirmation && (
              <span style={{ color: '#EF4444', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                ⚠️ {errors.new_password_confirmation}
              </span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
              padding: '14px 20px', borderRadius: 12, background: 'var(--admin-primary)', border: 'none', 
              color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: '0.2s', opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? 'Processing...' : <><Save size={18} /> Update Password</>}
          </button>
        </form>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(5px)',
          WebkitBackdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16
        }}>
          <div style={{
            background: 'var(--admin-bg, #FFFFFF)',
            border: '1px solid var(--admin-border, #E2E8F0)',
            borderRadius: 20,
            maxWidth: 460,
            width: '100%',
            padding: '28px 24px',
            boxShadow: '0 20px 45px rgba(0,0,0,0.2)',
            position: 'relative'
          }}>
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--admin-text-muted, #64748B)',
                padding: 4
              }}
            >
              <X size={20} />
            </button>

            {/* Header Icon & Title */}
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(0, 168, 140, 0.1)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12
              }}>
                <ShieldCheck size={30} color="var(--admin-primary, #00A88C)" />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px 0', color: 'var(--admin-text, #0F172A)' }}>
                অ্যাডমিন নিরাপত্তা ওটিপি
              </h3>
              <p style={{ margin: 0, fontSize: 13.5, color: 'var(--admin-text-muted, #64748B)', lineHeight: 1.5 }}>
                আপনার রেজিস্টার্ড মোবাইল নম্বর <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{maskedPhone}</strong>-এ একটি ৬-সংখ্যার ওটিপি কোড পাঠানো হয়েছে।
              </p>
            </div>

            {/* OTP Input Form */}
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: 20 }}>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '')
                    setOtp(val)
                    if (otpError) setOtpError('')
                  }}
                  placeholder="• • • • • •"
                  style={{
                    width: '100%',
                    letterSpacing: '10px',
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: 800,
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: otpError ? '2px solid #EF4444' : '2px solid var(--admin-border, #CBD5E1)',
                    background: otpError ? '#FFF5F5' : 'var(--admin-bg-alt, #F8FAFC)',
                    color: 'var(--admin-text, #0F172A)',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                />
                {otpError && (
                  <div style={{ color: '#EF4444', fontSize: 12.5, fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
                    ⚠️ {otpError}
                  </div>
                )}
              </div>

              {/* Countdown & Resend Section */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                {cooldown > 0 ? (
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '6px 16px',
                    background: 'var(--admin-bg-alt, #F1F5F9)',
                    borderRadius: 99,
                    fontSize: 12.5,
                    color: 'var(--admin-text-muted, #64748B)',
                    fontWeight: 600,
                    border: '1px solid var(--admin-border, #E2E8F0)'
                  }}>
                    <Clock size={14} color="var(--admin-primary, #00A88C)" />
                    <span>পুনরায় পাঠানোর সময় বাকি: <strong style={{ color: 'var(--admin-text, #0F172A)' }}>{toBnNum(cooldown)}</strong> সেকেন্ড</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                    <span style={{ color: 'var(--admin-text-muted, #64748B)' }}>এসএমএস পৌঁছায়নি?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--admin-primary, #00A88C)',
                        fontWeight: 800,
                        cursor: resendLoading ? 'not-allowed' : 'pointer',
                        padding: '4px 6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        fontSize: 13
                      }}
                    >
                      <RotateCw size={13} className={resendLoading ? 'spin-icon' : ''} />
                      {resendLoading ? 'পাঠানো হচ্ছে...' : 'নতুন কোড পাঠান'}
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: '1px solid var(--admin-border, #CBD5E1)',
                    background: 'transparent',
                    color: 'var(--admin-text, #334155)',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer'
                  }}
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length < 6}
                  style={{
                    flex: 2,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'var(--admin-primary, #00A88C)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: otpLoading || otp.length < 6 ? 'not-allowed' : 'pointer',
                    opacity: otpLoading || otp.length < 6 ? 0.65 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6
                  }}
                >
                  {otpLoading ? (
                    <><Loader2 size={16} className="spin-icon" /> যাচাই হচ্ছে...</>
                  ) : (
                    <><KeyRound size={16} /> যাচাই ও পরিবর্তন করুন</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
