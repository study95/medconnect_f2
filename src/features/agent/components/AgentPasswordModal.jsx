import React, { useState } from 'react'
import { X, Lock, KeyRound, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { updatePasswordApi } from '../../../api/authApi'
import { toast } from 'react-hot-toast'

export default function AgentPasswordModal({ isOpen, onClose }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  // Password Rules Checklist
  const hasMinLength = newPassword.length >= 8
  const hasLetter = /[a-zA-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const isConfirmed = newPassword && confirmPassword && newPassword === confirmPassword
  const isFormValid = currentPassword && hasMinLength && hasLetter && hasNumber && isConfirmed

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError('বর্তমান পাসওয়ার্ড লিখুন।')
      return
    }

    if (!hasMinLength || !hasLetter || !hasNumber) {
      setError('নতুন পাসওয়ার্ড কমপক্ষে ৮ অক্ষর এবং সংখ্যা ও অক্ষরের সমন্বয়ে হতে হবে।')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('নতুন পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।')
      return
    }

    setLoading(true)
    try {
      const res = await updatePasswordApi({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      })

      if (res?.data?.success || res?.status === 200) {
        toast.success('পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        onClose()
      } else {
        setError(res?.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।')
      }
    } catch (err) {
      console.error('Password update error:', err)
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে। বর্তমান পাসওয়ার্ড সঠিক আছে কিনা পরীক্ষা করুন।'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

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
        maxWidth: 460,
        width: '100%',
        maxHeight: '90vh',
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
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                পাসওয়ার্ড পরিবর্তন করুন
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                একাউন্টের নিরাপত্তার জন্য শক্তিশালী পাসওয়ার্ড দিন
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

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px' }}>
          {error && (
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
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Current Password Field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              বর্তমান পাসওয়ার্ড <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: '#64748B' }}>
                <KeyRound size={15} />
              </span>
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="আপনার বর্তমান পাসওয়ার্ড দিন"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 36px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5,
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#059669' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              নতুন পাসওয়ার্ড <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: '#64748B' }}>
                <Lock size={15} />
              </span>
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ড (কমপক্ষে ৮ অক্ষর)"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 36px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5,
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#059669' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Checklist */}
            <div style={{
              marginTop: 8,
              padding: '10px 12px',
              background: '#F8FAFC',
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              fontSize: 11.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasMinLength ? '#059669' : '#94A3B8' }}>
                <CheckCircle2 size={13} color={hasMinLength ? '#059669' : '#CBD5E1'} />
                <span>কমপক্ষে ৮টি অক্ষরের হতে হবে</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: hasLetter && hasNumber ? '#059669' : '#94A3B8' }}>
                <CheckCircle2 size={13} color={hasLetter && hasNumber ? '#059669' : '#CBD5E1'} />
                <span>অক্ষর (A-Z, a-z) ও সংখ্যা (0-9) এর সমন্বয় থাকতে হবে</span>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              নতুন পাসওয়ার্ড নিশ্চিত করুন <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: '#64748B' }}>
                <Lock size={15} />
              </span>
              <input
                type={showConfirm ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="নতুন পাসওয়ার্ডটি পুনরায় লিখুন"
                style={{
                  width: '100%',
                  padding: '10px 40px 10px 36px',
                  borderRadius: 10,
                  border: confirmPassword && !isConfirmed ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                  background: confirmPassword && !isConfirmed ? '#FEF2F2' : '#FFFFFF',
                  fontSize: 13.5,
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => {
                  if (!(confirmPassword && !isConfirmed)) {
                    e.currentTarget.style.borderColor = '#059669'
                  }
                }}
                onBlur={(e) => {
                  if (!(confirmPassword && !isConfirmed)) {
                    e.currentTarget.style.borderColor = '#CBD5E1'
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute',
                  right: 12,
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: 4
                }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && !isConfirmed && (
              <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4, fontWeight: 600 }}>
                * নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background: (loading || !isFormValid) ? '#94A3B8' : '#059669',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: (loading || !isFormValid) ? 'none' : '0 2px 8px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              <span>{loading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</span>
            </button>
          </div>
        </form>
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
