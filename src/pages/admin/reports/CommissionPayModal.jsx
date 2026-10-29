// CommissionPayModal.jsx — Doctor & Hospital Pay Commission Flow
import React, { useState, useEffect } from 'react'
import { 
  X, CreditCard, Smartphone, Building2, 
  CheckCircle2, AlertTriangle, ShieldCheck, 
  Copy, Check, Landmark, ArrowRight, HelpCircle
} from 'lucide-react'
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
  const [amount, setAmount] = useState(Number(dueAmount) || 0)
  const [trxId, setTrxId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copiedKey, setCopiedKey] = useState(null)

  useEffect(() => {
    if (show) {
      setAmount(Number(dueAmount) || 0)
      setTrxId('')
      setNotes('')
    }
  }, [show, dueAmount])

  if (!show) return null

  const handleCopy = (text, key) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(String(text).trim())
      } else {
        const el = document.createElement('textarea')
        el.value = String(text).trim()
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
      setCopiedKey(key)
      toast.success('ক্লিপবোর্ডে কপি করা হয়েছে!')
      setTimeout(() => setCopiedKey(null), 1800)
    } catch {
      toast.error('কপি ব্যর্থ হয়েছে')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!trxId.trim()) {
      toast.error('অনুগ্রহ করে ট্রানজ্যাকশন আইডি (TrxID) বা ব্যাংক রেফারেন্স দিন।')
      return
    }

    if (!amount || Number(amount) <= 0) {
      toast.error('অনুগ্রহ করে সঠিক পরিশোধের পরিমাণ দিন।')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        amount: Number(amount),
        payment_method: method,
        transaction_reference: trxId.trim(),
        notes: notes.trim() || undefined,
      }

      const res = isHospital
        ? await hospitalPayCommission(payload)
        : await doctorPayCommission(payload)

      toast.success(res.data?.message || 'কমিশন পরিশোধের অনুরোধ সফলভাবে সাবমিট হয়েছে!')
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
      background: 'rgba(15, 23, 42, 0.72)',
      backdropFilter: 'blur(5px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div className="admin-card" style={{
        maxWidth: 540,
        width: '100%',
        borderRadius: 20,
        padding: '24px 28px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
        background: '#ffffff',
        border: '1px solid var(--admin-border, #e2e8f0)',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <CreditCard size={22} strokeWidth={2.4} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                বকেয়া কমিশন পরিশোধ (Pay Commission)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                {isHospital ? 'হাসপাতাল কাউন্টারের' : 'ডাক্তারের নিজস্ব চেম্বারের'} সংগৃহীত ফি থেকে প্ল্যাটফর্ম কমিশন সেটেলমেন্ট
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
              color: '#94A3B8',
              padding: 6,
              borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount Summary Box */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.28)',
          borderRadius: 14,
          padding: '14px 18px',
          marginBottom: 16
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, color: '#92400E', fontWeight: 600 }}>বকেয়া অ্যাপয়েন্টমেন্ট সংখ্যা:</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E', background: 'rgba(245, 158, 11, 0.18)', padding: '2px 8px', borderRadius: 6 }}>
              {pendingCount} টি
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, fontWeight: 700, color: '#78350F' }}>মোট বকেয়া কমিশন:</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#D97706' }}>
              ৳{Number(dueAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Maker-Checker Workflow Note */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.06)',
          border: '1px solid rgba(59, 130, 246, 0.22)',
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 16,
          fontSize: 12,
          color: '#1E40AF',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          lineHeight: 1.5
        }}>
          <ShieldCheck size={16} color="#2563EB" style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            পেমেন্টের TrxID সাবমিট করার সাথে সাথে অ্যাপয়েন্টমেন্টগুলোর স্ট্যাটাস <strong>VERIFYING (যাচাইাধীন)</strong> হবে। অ্যাডমিন অনুমোদন দিলে স্বয়ংক্রিয়ভাবে <strong>'PAID & LOCKED'</strong> হিসেবে ফাইনাল হবে।
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Payment Method Selector */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: '#0F172A' }}>
              পেমেন্টের মাধ্যম নির্বাচন করুন
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { id: 'bkash', label: 'bKash (বিকাশ)', icon: Smartphone, color: '#E2136E' },
                { id: 'nagad', label: 'Nagad (নগদ)', icon: Smartphone, color: '#F6921E' },
                { id: 'bank_transfer', label: 'ব্যাংক ট্রান্সফার', icon: Landmark, color: '#0284C7' },
              ].map(item => {
                const isSelected = method === item.id
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    onClick={() => setMethod(item.id)}
                    style={{
                      border: `1.5px solid ${isSelected ? item.color : '#E2E8F0'}`,
                      background: isSelected ? `${item.color}0D` : '#FFFFFF',
                      borderRadius: 12,
                      padding: '10px 8px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Icon size={18} color={isSelected ? item.color : '#64748B'} style={{ margin: '0 auto 4px' }} />
                    <div style={{ fontSize: 11.5, fontWeight: isSelected ? 800 : 600, color: isSelected ? item.color : '#334155' }}>
                      {item.label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Account Instruction Note Box with Copy Buttons */}
          <div style={{
            background: '#F8FAFC',
            border: '1px solid #CBD5E1',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: 16,
            fontSize: 12,
            color: '#334155',
            lineHeight: 1.6
          }}>
            {method === 'bkash' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>bKash পেমেন্ট / সেন্ড মানি নম্বর:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy('01747465666', 'bkash')}
                    style={{
                      background: copiedKey === 'bkash' ? '#10B981' : 'rgba(226, 19, 110, 0.1)',
                      color: copiedKey === 'bkash' ? '#ffffff' : '#E2136E',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {copiedKey === 'bkash' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'bkash' ? 'কপি হয়েছে' : 'নম্বর কপি'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#E2136E' }}>
                  01747-465666
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                  • বিকাশ অ্যাপ থেকে 'Payment' বা 'Send Money' সম্পন্ন করে TrxID সংগ্রহ করুন।
                </div>
              </div>
            )}

            {method === 'nagad' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>Nagad পেমেন্ট / সেন্ড মানি নম্বর:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy('01747465666', 'nagad')}
                    style={{
                      background: copiedKey === 'nagad' ? '#10B981' : 'rgba(246, 146, 30, 0.1)',
                      color: copiedKey === 'nagad' ? '#ffffff' : '#F6921E',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {copiedKey === 'nagad' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'nagad' ? 'কপি হয়েছে' : 'নম্বর কপি'}
                  </button>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#F6921E' }}>
                  01747-465666
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                  • নগদ অ্যাপ থেকে সেন্ড মানি সম্পন্ন করে প্রাপ্ত ট্রানজ্যাকশন আইডি নিচে দিন।
                </div>
              </div>
            )}

            {method === 'bank_transfer' && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span><strong>অফিশিয়াল ব্যাংক অ্যাকাউন্ট:</strong></span>
                  <button
                    type="button"
                    onClick={() => handleCopy('2050213020000000', 'bank')}
                    style={{
                      background: copiedKey === 'bank' ? '#10B981' : 'rgba(2, 132, 199, 0.1)',
                      color: copiedKey === 'bank' ? '#ffffff' : '#0284C7',
                      border: 'none',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    {copiedKey === 'bank' ? <Check size={12} /> : <Copy size={12} />}
                    {copiedKey === 'bank' ? 'কপি হয়েছে' : 'A/C কপি'}
                  </button>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                  ব্যাংক: Islami Bank Bangladesh Ltd. (হবিগঞ্জ শাখা)
                </div>
                <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>
                  হিসাবের নাম: <strong>Doctor Booklet Ltd.</strong>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 800, color: '#0284C7', marginTop: 2 }}>
                  A/C: 2050213020000000
                </div>
              </div>
            )}
          </div>

          {/* Amount Field with Quick Preset */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A' }}>
                পরিশোধের পরিমাণ (টাকা) <span style={{ color: '#EF4444' }}>*</span>
              </label>
              {Number(dueAmount) > 0 && Number(amount) !== Number(dueAmount) && (
                <button
                  type="button"
                  onClick={() => setAmount(Number(dueAmount))}
                  style={{
                    background: 'rgba(0, 168, 140, 0.1)',
                    color: '#00A88C',
                    border: 'none',
                    borderRadius: 4,
                    padding: '2px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  পুরো বকেয়া (৳{Number(dueAmount).toLocaleString()})
                </button>
              )}
            </div>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 14,
                fontWeight: 700,
                color: '#0F172A'
              }}
            />
          </div>

          {/* TrxID / Reference Field */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: '#0F172A' }}>
              ট্রানজ্যাকশন আইডি (TrxID) / ব্যাংক ভাউচার স্লিপ নং <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 9K28XLPQ92 বা ডিপোজিট ভাউচার নং"
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'monospace'
              }}
            />
          </div>

          {/* Optional Note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: '#0F172A' }}>
              রেফারেন্স নোট (ঐচ্ছিক)
            </label>
            <input
              type="text"
              placeholder="e.g. চলতি মাসের কাউন্টার কমিশন পরিশোধ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="admin-form-input"
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 12.5
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="admin-btn admin-btn-outline"
              style={{ padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700 }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting || !trxId.trim() || !amount || Number(amount) <= 0}
              className="admin-btn admin-btn-primary"
              style={{
                padding: '9px 22px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 800,
                background: '#10B981',
                borderColor: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: (submitting || !trxId.trim() || !amount || Number(amount) <= 0) ? 'not-allowed' : 'pointer',
                opacity: (submitting || !trxId.trim() || !amount || Number(amount) <= 0) ? 0.7 : 1,
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
              }}
            >
              <ShieldCheck size={16} />
              <span>{submitting ? 'সাবমিট করা হচ্ছে...' : `৳${Number(amount || 0).toLocaleString()} পরিশোধ ও যাচাইকরণে পাঠান`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
