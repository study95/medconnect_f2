import React, { useState, useEffect } from 'react'
import { X, User, Mail, Phone, ShieldCheck, Loader2, AlertCircle, CheckCircle2, Camera } from 'lucide-react'
import { updateMyProfile } from '../../../api/authApi'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-hot-toast'

export default function AgentProfileModal({ isOpen, onClose }) {
  const { user, fetchCurrentUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setPhotoFile(null)
      setPhotoPreview(user.photo || user.agent?.photo || null)
      setError(null)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  const agentCode = user?.agent?.public_id || user?.agent?.agent_code || user?.public_id || user?.agent_code || 'AGT-PARTNER'
  const agentPhone = user?.agent?.phone || user?.phone || ''

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('অনুগ্রহ করে একটি সঠিক ছবি (JPG, PNG বা WEBP) নির্বাচন করুন।')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে।')
      return
    }
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('আপনার পূর্ণ নাম লিখুন।')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('name', name.trim())
      if (email.trim()) {
        formData.append('email', email.trim())
      }
      if (photoFile) {
        formData.append('photo', photoFile)
      }

      const res = await updateMyProfile(formData)
      if (res?.data?.success || res?.status === 200) {
        toast.success('প্রোফাইল সফলভাবে আপডেট করা হয়েছে!')
        if (typeof fetchCurrentUser === 'function') {
          await fetchCurrentUser(true)
        }
        onClose()
      } else {
        setError(res?.data?.message || 'প্রোফাইল আপডেট ব্যর্থ হয়েছে।')
      }
    } catch (err) {
      console.error('Profile update error:', err)
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'প্রোফাইল আপডেট করতে সমস্যা হয়েছে।'
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
              background: 'rgba(6, 95, 70, 0.1)',
              color: '#065F46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
                এজেন্ট প্রোফাইল আপডেট
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                আপনার ব্যক্তিগত তথ্য পরিবর্তন করুন
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

          {/* Profile Photo Picker */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 18,
            padding: '14px 16px',
            background: '#F8FAFC',
            borderRadius: 14,
            border: '1.5px dashed #CBD5E1'
          }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #065F46 0%, #047857 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 800,
                border: '2.5px solid #10B981',
                boxShadow: '0 4px 10px rgba(6, 95, 70, 0.15)'
              }}>
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={name || 'Agent'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span>{name ? name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <label
                htmlFor="agent-photo-upload"
                style={{
                  position: 'absolute',
                  bottom: -2,
                  right: -2,
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: '#065F46',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  border: '2px solid #FFFFFF',
                  transition: 'background 0.15s ease'
                }}
                title="ছবি আপলোড করুন"
              >
                <Camera size={13} />
              </label>
              <input
                id="agent-photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                প্রোফাইল ছবি (ঐচ্ছিক)
              </div>
              <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                JPG, PNG বা WEBP (সর্বোচ্চ ৫ MB)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, flexWrap: 'wrap' }}>
                <label
                  htmlFor="agent-photo-upload"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#065F46',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {photoFile ? 'অন্য ছবি বাছাই করুন' : (photoPreview ? 'ছবি পরিবর্তন করুন' : 'ছবি আপলোড করুন')}
                </label>
                {photoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoFile(null)
                      setPhotoPreview(user?.photo || user?.agent?.photo || null)
                    }}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#DC2626',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    বাতিল
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Agent Code & Status (Readonly Information Card) */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Agent Public ID
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46', fontFamily: 'monospace', marginTop: 2 }}>
                {agentCode}
              </div>
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              fontSize: 11.5,
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: 6
            }}>
              <ShieldCheck size={14} />
              <span>Verified Agent</span>
            </div>
          </div>

          {/* Phone Field (Readonly for Security) */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              রেজিস্টার্ড মোবাইল নম্বর
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: '#94A3B8' }}>
                <Phone size={15} />
              </span>
              <input
                type="text"
                disabled
                value={agentPhone || 'সংযুক্ত নেই'}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 10,
                  border: '1.5px solid #E2E8F0',
                  background: '#F1F5F9',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#64748B',
                  outline: 'none',
                  cursor: 'not-allowed'
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
              * মোবাইল নম্বর পরিবর্তনের জন্য প্ল্যাটফর্ম অ্যাডমিনের সাথে যোগাযোগ করুন।
            </div>
          </div>

          {/* Name Field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              পূর্ণ নাম <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: '#64748B' }}>
                <User size={15} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="যেমন: আবদুল্লাহ চৌধুরী"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#059669' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
              />
            </div>
          </div>

          {/* Email Field */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              ইমেইল অ্যাড্রেস
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, color: '#64748B' }}>
                <Mail size={15} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="যেমন: agent@example.com"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 36px',
                  borderRadius: 10,
                  border: '1.5px solid #CBD5E1',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'border-color 0.15s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#059669' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#CBD5E1' }}
              />
            </div>
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
              disabled={loading || !name.trim()}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background: (loading || !name.trim()) ? '#94A3B8' : '#059669',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: (loading || !name.trim()) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: (loading || !name.trim()) ? 'none' : '0 2px 8px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              <span>{loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}</span>
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
