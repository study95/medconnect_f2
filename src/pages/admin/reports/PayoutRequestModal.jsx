import React, { useState } from 'react'
import { X, ArrowDownRight, Smartphone, Building2, ShieldCheck, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { doctorRequestPayout, hospitalRequestPayout } from '../../../api/adminApi'

export default function PayoutRequestModal({
  show,
  onClose,
  availableBalance = 0,
  onSuccess,
  isHospital = false,
}) {
  const [amount, setAmount] = useState(availableBalance > 0 ? String(availableBalance) : '')
  const [method, setMethod] = useState('bkash')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!show) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    const numAmount = Number(amount)
    if (!numAmount || numAmount < 100) {
      toast.error('সর্বনিম্ন উত্তোলন পরিমাণ ৳১০০ হতে হবে।')
      return
    }
    if (numAmount > Number(availableBalance)) {
      toast.error('উত্তোলনের পরিমাণ বর্তমান ওয়ালেট ব্যালেন্সের চেয়ে বেশি হতে পারবে না।')
      return
    }
    if (!accountNumber.trim()) {
      toast.error('অনুগ্রহ করে অ্যাকাউন্ট নম্বর বা মোবাইল নম্বর দিন।')
      return
    }

    setSubmitting(true)
    try {
      const accountDetails = {
        account_number: accountNumber.trim(),
        method: method,
      }

      if (method === 'bank') {
        accountDetails.bank_name = bankName.trim()
        accountDetails.branch_name = branchName.trim()
        accountDetails.account_holder_name = accountHolder.trim()
      }

      const payload = {
        amount: numAmount,
        payout_method: method,
        account_details: accountDetails,
      }

      const res = isHospital
        ? await hospitalRequestPayout(payload)
        : await doctorRequestPayout(payload)

      toast.success(res.data?.message || 'উত্তোলন অনুরোধ সফলভাবে জমা দেওয়া হয়েছে!')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'উত্তোলন অনুরোধ ব্যর্থ হয়েছে।')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="admin-card" style={{
        maxWidth: 520,
        width: '100%',
        borderRadius: 20,
        padding: '28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        background: '#ffffff',
        border: '1px solid var(--admin-border, #e2e8f0)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(59, 130, 246, 0.12)',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wallet size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                উপার্জন উত্তোলন (Request Payout)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--admin-text-muted, #64748b)' }}>
                অনলাইন বুকিং থেকে প্রাপ্ত নিট আয় ব্যাংক বা মোবাইল ওয়ালেটে স্থানান্তর
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Balance Card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.03) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, color: '#047857', fontWeight: 700 }}>উত্তোলনযোগ্য ব্যালেন্স:</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#059669' }}>
              ৳{Number(availableBalance).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Amount Field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--admin-text, #0f172a)' }}>
              উত্তোলনের পরিমাণ (টাকা) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              min="100"
              max={availableBalance}
              required
              placeholder="e.g. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #cbd5e1)',
                fontSize: 14,
                fontWeight: 700
              }}
            />
          </div>

          {/* Payment Method Selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text, #0f172a)' }}>
              টাকা পাওয়ার মাধ্যম নির্বাচন করুন
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {[
                { id: 'bkash', label: 'bKash', icon: Smartphone, color: '#E2136E' },
                { id: 'nagad', label: 'Nagad', icon: Smartphone, color: '#F6921E' },
                { id: 'rocket', label: 'Rocket', icon: Smartphone, color: '#8C318C' },
                { id: 'bank', label: 'Bank', icon: Building2, color: '#0284c7' },
              ].map(item => {
                const isSelected = method === item.id
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => setMethod(item.id)}
                    style={{
                      border: `1.5px solid ${isSelected ? item.color : '#e2e8f0'}`,
                      background: isSelected ? `${item.color}0a` : '#ffffff',
                      borderRadius: 12,
                      padding: '10px 6px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} color={isSelected ? item.color : '#64748b'} style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 11, fontWeight: isSelected ? 800 : 600, color: isSelected ? item.color : '#334155' }}>
                      {item.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Account Details Fields */}
          {method === 'bank' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--admin-text, #0f172a)' }}>
                  ব্যাংকের নাম <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eastern Bank PLC"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="admin-form-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--admin-text, #0f172a)' }}>
                  শাখা (Branch) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanmondi Branch"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  className="admin-form-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--admin-text, #0f172a)' }}>
                  হোল্ডারের নাম <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priotush Sutradhar"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="admin-form-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--admin-text, #0f172a)' }}>
                  অ্যাকাউন্ট নম্বর <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 1234567890123"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="admin-form-input"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600 }}
                />
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--admin-text, #0f172a)' }}>
                {method === 'bkash' ? 'বিকাশ' : (method === 'nagad' ? 'নগদ' : 'রকেট')} মোবাইল নম্বর <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 017xxxxxxxx"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="admin-form-input"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--admin-border, #cbd5e1)',
                  fontSize: 14,
                  fontWeight: 600
                }}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="admin-btn admin-btn-outline"
              style={{ padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700 }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting || !amount || Number(amount) < 100}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                background: '#2563EB',
                borderColor: '#2563EB',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              <ArrowDownRight size={16} />
              <span>{submitting ? 'অনুরোধ পাঠানো হচ্ছে...' : `৳${Number(amount || 0).toLocaleString()} উত্তোলন অনুরোধ পাঠান`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
