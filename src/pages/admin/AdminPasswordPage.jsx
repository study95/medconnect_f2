import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updatePasswordApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { Lock, Save, Eye, EyeOff, ShieldCheck, X, Loader2, ArrowRight } from 'lucide-react'
import { useDialog } from '../../hooks/useDialog'
import { DIALOG_MESSAGES } from '../../utils/dialogMessages'

export default function AdminPasswordPage() {
  const { showSuccess, showError } = useDialog()
  const { logout, isDoctor, isManager } = useAuth()
  const navigate = useNavigate()

  const portalBase = isDoctor ? '/doctor' : (isManager ? '/hospital' : '/admin')

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

  // 2FA Verification Modal State (Google Authenticator / Backup Code)
  const [show2FaModal, setShow2FaModal] = useState(false)
  const [code, setCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [codeError, setCodeError] = useState('')
  const [useBackupMode, setUseBackupMode] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name] || errors.general) {
      setErrors(prev => ({ ...prev, [name]: '', general: '' }))
    }
  }

  // Form Save: Validates inputs and triggers 2FA check
  const handleSave = (e) => {
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
    setCode('')
    setCodeError('')
    setUseBackupMode(false)
    setShow2FaModal(true)
  }

  // Verify 2FA and complete password update
  const handleVerify2Fa = async (e) => {
    if (e) e.preventDefault()
    const cleanCode = code.trim()

    if (!cleanCode) {
      setCodeError('অনুগ্রহ করে কোডটি লিখুন।')
      return
    }

    setCodeLoading(true)
    setCodeError('')

    try {
      await updatePasswordApi({
        current_password: form.current_password,
        new_password: form.new_password,
        new_password_confirmation: form.new_password_confirmation,
        code: cleanCode
      })

      setShow2FaModal(false)
      showSuccess({
        title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
        message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। অনুগ্রহ করে নতুন পাসওয়ার্ড দিয়ে পুনরায় লগইন করুন।',
      })

      setTimeout(() => {
        logout()
        navigate('/login')
      }, 1500)
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'ভুল সিকিউরিটি কোড!'
      if (err.response?.status === 422 && msg.includes('বর্তমান পাসওয়ার্ড')) {
        setShow2FaModal(false)
        setErrors({ current_password: msg })
      } else {
        setCodeError(msg)
      }
    } finally {
      setCodeLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 600, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div style={{
          background: '#EEF2FF',
          padding: 12,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Lock size={26} color="#4338CA" />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>
            Update Password (পাসওয়ার্ড পরিবর্তন)
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
            আপনার অ্যাকাউন্টের নিরাপত্তা নিশ্চিত করতে একটি শক্তিশালী পাসওয়ার্ড নির্ধারণ করুন
          </p>
        </div>
      </div>

      {/* Password Change Form Card */}
      <div style={{
        background: 'var(--admin-card-bg, #FFFFFF)',
        border: '1px solid var(--admin-border)',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
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
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.current_password && <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>{errors.current_password}</span>}
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
                placeholder="Enter new password (min. 6 characters)"
                style={{ 
                  width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, 
                  border: errors.new_password ? '1.5px solid #EF4444' : '1.5px solid var(--admin-border)', 
                  background: errors.new_password ? '#FFF5F5' : 'var(--admin-bg-alt)', 
                  outline: 'none', color: 'var(--admin-text)', fontSize: 14,
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>{errors.new_password}</span>}
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
                placeholder="Confirm your new password"
                style={{ 
                  width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, 
                  border: errors.new_password_confirmation ? '1.5px solid #EF4444' : '1.5px solid var(--admin-border)', 
                  background: errors.new_password_confirmation ? '#FFF5F5' : 'var(--admin-bg-alt)', 
                  outline: 'none', color: 'var(--admin-text)', fontSize: 14,
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', display: 'flex', alignItems: 'center' }}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password_confirmation && <span style={{ color: '#EF4444', fontSize: 12, fontWeight: 600 }}>{errors.new_password_confirmation}</span>}
          </div>

          {/* Submit Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button 
              type="submit" 
              disabled={loading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--admin-primary, #0D9488)', color: '#FFFFFF',
                border: 'none', borderRadius: 10, padding: '12px 24px',
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
              }}
            >
              {loading ? (
                <><Loader2 size={16} className="spin-icon" /> Updating...</>
              ) : (
                <><Save size={16} /> Save Changes</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Navigation Link to Two-Factor Security Page */}
      <div style={{
        marginTop: 20,
        background: '#F0FDF4',
        border: '1px solid #BBF7D0',
        borderRadius: 14,
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={20} color="#059669" />
          <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
            অ্যাকাউন্টে ২-ধাপ যাচাই (2FA) চালু অথবা বন্ধ করতে চান?
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${portalBase}/security`)}
          style={{
            background: '#FFFFFF',
            border: '1px solid #86EFAC',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            fontWeight: 700,
            color: '#15803D',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          ২-ধাপ যাচাই সেটিংসে যান <ArrowRight size={13} />
        </button>
      </div>

      {/* 2FA Verification Modal (Google Authenticator / Backup Code) */}
      {show2FaModal && (
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
            maxWidth: 440,
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--admin-border, #E2E8F0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--admin-bg-alt, #F8FAFC)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--admin-text, #1E293B)' }}>
                    নিরাপত্তা যাচাইকরণ (2FA)
                  </h4>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
                    পাসওয়ার্ড পরিবর্তন সম্পন্ন করতে কোড দিন
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShow2FaModal(false)}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleVerify2Fa} style={{ padding: 24 }}>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--admin-text, #334155)', lineHeight: 1.5 }}>
                {useBackupMode 
                  ? 'আপনার ৮-সংখ্যার জরুরি এককালীন ব্যাকআপ কোড দিন (যেমন: A7E2-9K1F):' 
                  : 'আপনার Google Authenticator অ্যাপের ৬-সংখ্যার কোডটি দিন:'}
              </p>

              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  autoFocus
                  maxLength={useBackupMode ? 12 : 6}
                  placeholder={useBackupMode ? "A7E2-9K1F" : "123456"}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value
                    setCode(useBackupMode ? val.toUpperCase() : val.replace(/\D/g, ''))
                    if (codeError) setCodeError('')
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 10,
                    border: codeError ? '1.5px solid #EF4444' : '1.5px solid var(--admin-border, #CBD5E1)',
                    background: 'var(--admin-bg-alt, #F8FAFC)',
                    color: 'var(--admin-text, #0F172A)',
                    fontSize: 20,
                    textAlign: 'center',
                    fontWeight: 700,
                    letterSpacing: useBackupMode ? 2 : 6,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                {codeError && (
                  <div style={{ color: '#EF4444', fontSize: 12, fontWeight: 600, marginTop: 6, textAlign: 'center' }}>
                    {codeError}
                  </div>
                )}
              </div>

              {/* Toggle Backup Code Mode */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupMode(!useBackupMode)
                    setCode('')
                    setCodeError('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {useBackupMode 
                    ? 'গুগল অথেনটিকেটর অ্যাপ কোড দিন' 
                    : 'ফোন কাছে নেই? ব্যাকআপ কোড ব্যবহার করুন'}
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setShow2FaModal(false)}
                  style={{
                    flex: 1,
                    padding: '11px',
                    borderRadius: 10,
                    border: '1px solid var(--admin-border, #CBD5E1)',
                    background: 'transparent',
                    color: 'var(--admin-text, #475569)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={codeLoading || !code.trim()}
                  style={{
                    flex: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '11px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: codeLoading || !code.trim() ? 'not-allowed' : 'pointer',
                    opacity: codeLoading || !code.trim() ? 0.7 : 1
                  }}
                >
                  {codeLoading ? <Loader2 size={16} className="spin-icon" /> : null}
                  যাচাই ও সংরক্ষণ <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
