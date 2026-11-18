import React, { useState } from 'react'
import { X, UserPlus, AlertCircle, Loader2, Eye, EyeOff, ShieldCheck, Wallet, Sparkles, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import adminAgentApi from '../../../api/adminAgentApi'

export default function AgentCreateModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    nid_number: '',
    rule_tier_id: 'standard_tier',
    payout_method: 'bkash',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorList, setErrorList] = useState([])
  const [fieldErrors, setFieldErrors] = useState({})

  if (!isOpen) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear field-specific error as user types
    if (fieldErrors[name]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorList([])
    setFieldErrors({})

    // Client-side quick check
    const clientErrors = {}
    if (!formData.name.trim()) clientErrors.name = 'এজেন্টের নাম আবশ্যক।'
    if (!formData.email.trim()) clientErrors.email = 'ইমেইল অ্যাড্রেস আবশ্যক।'
    if (!formData.phone.trim()) clientErrors.phone = 'মোবাইল নম্বর আবশ্যক।'
    if (formData.password && formData.password.length > 0 && formData.password.length < 8) {
      clientErrors.password = 'পাসওয়ার্ড প্রদান করলে কমপক্ষে ৮ ক্যারেক্টার হতে হবে।'
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors)
      setErrorList(Object.values(clientErrors))
      setLoading(false)
      toast.error('অনুগ্রহ করে প্রয়োজনীয় তথ্যগুলো পূরণ করুন।')
      return
    }

    try {
      // Clean payload: strip empty password so backend can generate secure random password
      const payload = { ...formData }
      if (!payload.password || !payload.password.trim()) {
        delete payload.password
      }
      if (!payload.nid_number || !payload.nid_number.trim()) {
        delete payload.nid_number
      }

      const res = await adminAgentApi.createAgent(payload)
      toast.success(res?.message || `Agent ${res?.data?.agent_code || ''} provisioned successfully!`)
      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Failed to create agent:', err)
      const data = err?.response?.data
      const backendErrors = data?.errors || {}
      setFieldErrors(backendErrors)

      const extractedErrors = []
      if (typeof backendErrors === 'object' && Object.keys(backendErrors).length > 0) {
        Object.entries(backendErrors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            msgs.forEach((m) => extractedErrors.push(m))
          } else if (typeof msgs === 'string') {
            extractedErrors.push(msgs)
          }
        })
      }

      const mainMsg = extractedErrors.length > 0
        ? extractedErrors
        : [data?.message || err?.message || 'Failed to create agent.']

      setErrorList(mainMsg)
      toast.error(typeof mainMsg[0] === 'string' ? mainMsg[0] : 'Validation failed')
    } finally {
      setLoading(false)
    }
  }

  const getFieldError = (name) => {
    const err = fieldErrors[name]
    if (!err) return null
    return Array.isArray(err) ? err[0] : err
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div 
        style={{
          background: 'var(--admin-card-bg, #FFFFFF)',
          border: '1px solid var(--admin-border, #E2E8F0)',
          borderRadius: 20,
          maxWidth: 540,
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--admin-border, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--admin-bg, #F8FAFC)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(0, 184, 117, 0.3)'
            }}>
              <UserPlus size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                Provision New Field Agent
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
                Auto-generates Agent Code, Spatie Role &amp; Double-Entry Wallet
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.15s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }}>
          {errorList.length > 0 && (
            <div style={{
              marginBottom: 18,
              padding: '14px 16px',
              borderRadius: 12,
              background: '#FEF2F2',
              border: '1px solid #FECDD3',
              color: '#991B1B',
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, marginBottom: errorList.length > 1 ? 6 : 0 }}>
                <AlertCircle size={16} style={{ flexShrink: 0, color: '#DC2626' }} />
                <span>ভ্যালিডেশন এরর (Validation Issues):</span>
              </div>
              <ul style={{ margin: '4px 0 0', paddingLeft: 22, lineHeight: 1.5 }}>
                {errorList.map((err, i) => (
                  <li key={i}>{typeof err === 'string' ? err : JSON.stringify(err)}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} id="agent-create-form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Full Name */}
            <div>
              <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Agent Full Name <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Tanvir Ahmed Chowdhury"
                style={{
                  width: '100%',
                  height: 42,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: `1.5px solid ${getFieldError('name') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}`,
                  background: 'var(--admin-card-bg, #FFFFFF)',
                  color: 'var(--admin-text, #0F172A)',
                  fontSize: 13.5,
                  outline: 'none',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => e.target.style.borderColor = '#00B875'}
                onBlur={(e) => e.target.style.borderColor = getFieldError('name') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}
              />
              {getFieldError('name') && (
                <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                  {getFieldError('name')}
                </span>
              )}
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Email Address <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="agent@doctorbooklet.com"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('email') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}`,
                    background: 'var(--admin-card-bg, #FFFFFF)',
                    color: 'var(--admin-text, #0F172A)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('email') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}
                />
                {getFieldError('email') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('email')}
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Mobile Phone <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="017XXXXXXXX"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('phone') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}`,
                    background: 'var(--admin-card-bg, #FFFFFF)',
                    color: 'var(--admin-text, #0F172A)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('phone') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}
                />
                {getFieldError('phone') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('phone')}
                  </span>
                )}
              </div>
            </div>

            {/* Password & NID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Initial Password (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Auto-generated if empty"
                    style={{
                      width: '100%',
                      height: 42,
                      padding: '0 40px 0 14px',
                      borderRadius: 10,
                      border: `1.5px solid ${getFieldError('password') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}`,
                      background: 'var(--admin-card-bg, #FFFFFF)',
                      color: 'var(--admin-text, #0F172A)',
                      fontSize: 13.5,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#00B875'}
                    onBlur={(e) => e.target.style.borderColor = getFieldError('password') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--admin-text-muted, #94A3B8)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {getFieldError('password') ? (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('password')}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', marginTop: 4, display: 'block' }}>
                    Leave blank to auto-generate a secure password.
                  </span>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  National ID (NID)
                </label>
                <input
                  type="text"
                  name="nid_number"
                  value={formData.nid_number}
                  onChange={handleChange}
                  placeholder="e.g. 1990123456789"
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: `1.5px solid ${getFieldError('nid_number') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}`,
                    background: 'var(--admin-card-bg, #FFFFFF)',
                    color: 'var(--admin-text, #0F172A)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#00B875'}
                  onBlur={(e) => e.target.style.borderColor = getFieldError('nid_number') ? '#EF4444' : 'var(--admin-border, #CBD5E1)'}
                />
                {getFieldError('nid_number') && (
                  <span style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, display: 'block', fontWeight: 600 }}>
                    {getFieldError('nid_number')}
                  </span>
                )}
              </div>
            </div>

            {/* Rule Tier & Payout Method */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Commission Rule Tier
                </label>
                <select
                  name="rule_tier_id"
                  value={formData.rule_tier_id}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: '1.5px solid var(--admin-border, #CBD5E1)',
                    background: 'var(--admin-card-bg, #FFFFFF)',
                    color: 'var(--admin-text, #0F172A)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                >
                  <option value="standard_tier">Standard Tier (৳500 / Approval)</option>
                  <option value="metro_tier">Metro / Specialist Tier</option>
                  <option value="super_tier">Super Agent Tier</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: 'var(--admin-text-muted, #475569)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Default Payout Method
                </label>
                <select
                  name="payout_method"
                  value={formData.payout_method}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    height: 42,
                    padding: '0 14px',
                    borderRadius: 10,
                    border: '1.5px solid var(--admin-border, #CBD5E1)',
                    background: 'var(--admin-card-bg, #FFFFFF)',
                    color: 'var(--admin-text, #0F172A)',
                    fontSize: 13.5,
                    outline: 'none',
                  }}
                >
                  <option value="bkash">bKash Personal</option>
                  <option value="nagad">Nagad Wallet</option>
                  <option value="rocket">Rocket Account</option>
                  <option value="bank">Direct Bank Transfer</option>
                </select>
              </div>
            </div>

            {/* Information Card */}
            <div style={{
              background: 'rgba(0, 184, 117, 0.06)',
              border: '1px solid rgba(0, 184, 117, 0.2)',
              borderRadius: 12,
              padding: '12px 14px',
              display: 'flex',
              gap: 10,
              fontSize: 12,
              color: '#065F46',
              lineHeight: 1.45
            }}>
              <Sparkles size={16} style={{ flexShrink: 0, marginTop: 1, color: '#00B875' }} />
              <div>
                <strong>Auto-Provisioning:</strong> Once created, an Agent Account Number (e.g. <code>ACC-AGT-001</code>) and double-entry liability ledger are linked automatically. The agent can immediately log in and onboard healthcare providers.
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--admin-border, #E2E8F0)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          background: 'var(--admin-bg, #F8FAFC)'
        }}>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: '1px solid var(--admin-border, #CBD5E1)',
              background: 'var(--admin-card-bg, #FFFFFF)',
              color: 'var(--admin-text-muted, #475569)',
              fontSize: 13,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="agent-create-form"
            disabled={loading}
            style={{
              padding: '9px 22px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #00B875 0%, #009E64 100%)',
              color: '#ffffff',
              fontSize: 13,
              fontWeight: 800,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(0, 184, 117, 0.3)',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Provisioning...</span>
              </>
            ) : (
              <>
                <Check size={16} strokeWidth={2.5} />
                <span>Provision Field Agent</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
