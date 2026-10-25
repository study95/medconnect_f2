import React, { useState } from 'react'
import { X, CreditCard, Smartphone, Building2, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { doctorPayCommission, hospitalPayCommission } from '../../../api/adminApi'

export default function CommissionPayModal({
  show,
  onClose,
  dueAmount = 0,
  pendingCount = 0,
  onSuccess,
  isHospital = false,
}) {
  const [method, setMethod] = useState('bkash')
  const [trxId, setTrxId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!show) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!trxId.trim()) {
      toast.error('অনুগ্রহ করে ট্রানজ্যাকশন আইডি (TrxID) বা ব্যাংক রেফারেন্স দিন।')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        amount: Number(dueAmount),
        payment_method: method,
        transaction_reference: trxId.trim(),
        notes: notes.trim() || undefined,
      }

      const res = isHospital
        ? await hospitalPayCommission(payload)
        : await doctorPayCommission(payload)

      toast.success(res.data?.message || 'কমিশন পরিশোধ সফলভাবে সম্পন্ন হয়েছে!')
      onSuccess?.()
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'কমিশন পরিশোধ ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।')
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
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                বকেয়া কমিশন পরিশোধ (Pay Due)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--admin-text-muted, #64748b)' }}>
                {isHospital ? 'হাসপাতালের' : 'ডাক্তারের'} কাউন্টার ক্যাশ বুকিংয়ের বকেয়া প্ল্যাটফর্ম কমিশন সেটেলমেন্ট
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

        {/* Amount Summary Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>বকেয়া অ্যাপয়েন্টমেন্ট সংখ্যা:</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400e' }}>{pendingCount} টি</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#78350f' }}>পরিশোধযোগ্য মোট কমিশন:</span>
            <span style={{ fontSize: 24, fontWeight: 900, color: '#d97706' }}>
              ৳{Number(dueAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Maker-Checker Workflow Note */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 18,
          fontSize: 12,
          color: '#1e40af',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          lineHeight: 1.5
        }}>
          <span style={{ fontSize: 15, marginTop: -1 }}>ℹ️</span>
          <span>
            পেমেন্টের TrxID সাবমিট করার পর স্ট্যাটাস <strong>VERIFYING (যাচাইাধীন)</strong> হবে। অ্যাডমিন ব্যাংক/bKash স্টেটমেন্ট যাচাই করে অনুমোদন দিলে এটি চূড়ান্তভাবে <strong>'PAID & LOCKED'</strong> হবে।
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Payment Method Selector */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text, #0f172a)' }}>
              পেমেন্ট মাধ্যম নির্বাচন করুন
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'bkash', label: 'bKash (বিকাশ)', icon: Smartphone, color: '#E2136E' },
                { id: 'nagad', label: 'Nagad (নগদ)', icon: Smartphone, color: '#F6921E' },
                { id: 'bank_transfer', label: 'ব্যাংক ট্রান্সফার', icon: Building2, color: '#0284c7' },
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
                      padding: '12px 10px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={20} color={isSelected ? item.color : '#64748b'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontSize: 11.5, fontWeight: isSelected ? 800 : 600, color: isSelected ? item.color : '#334155' }}>
                      {item.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Account Instruction Note */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 18,
            fontSize: 12.5,
            color: '#475569',
            lineHeight: 1.6
          }}>
            {method === 'bkash' && (
              <>
                <strong>bKash Merchant / Payment No:</strong> 01711-000000 (মার্চেন্ট পেমেন্ট বা সেন্ড মানি করুন)
              </>
            )}
            {method === 'nagad' && (
              <>
                <strong>Nagad Merchant No:</strong> 01711-000000 (নগদ মার্চেন্ট পে বা সেন্ড মানি করুন)
              </>
            )}
            {method === 'bank_transfer' && (
              <>
                <strong>Bank Account:</strong> Eastern Bank PLC (EBL), A/C Name: Doctor Booklet Ltd, A/C No: 1234567890
              </>
            )}
          </div>

          {/* TrxID / Reference Field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--admin-text, #0f172a)' }}>
              ট্রানজ্যাকশন আইডি (TrxID) / ব্যাংক ভাউচার নং <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 9K28XLPQ92 বা ডিপোজিট স্লিপ নং"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #cbd5e1)',
                fontSize: 13.5,
                fontWeight: 600
              }}
            />
          </div>

          {/* Optional Note */}
          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: 'var(--admin-text, #0f172a)' }}>
              রেফারেন্স নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="e.g. অক্টোবর মাসের চেম্বার কমিশন"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: 10,
                border: '1px solid var(--admin-border, #cbd5e1)',
                fontSize: 13
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
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
              disabled={submitting || !trxId.trim()}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '10px 24px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                background: '#10B981',
                borderColor: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: submitting ? 'not-allowed' : 'pointer'
              }}
            >
              <ShieldCheck size={16} />
              <span>{submitting ? 'সাবমিট করা হচ্ছে...' : `৳${Number(dueAmount).toLocaleString()} সাবমিট ও যাচাইকরণে পাঠান`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
