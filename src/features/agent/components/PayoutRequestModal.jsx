import React, { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, ShieldCheck, Wallet, ArrowRight, Loader2, Building2, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react'
import agentApi from '../../../api/agentApi'
import { useAuth } from '../../../context/AuthContext'

export default function PayoutRequestModal({ isOpen, onClose, availableBalance = 0, defaultPhone = '', onSuccess }) {
  const { user } = useAuth()
  const registeredPhone = (defaultPhone || user?.phone || user?.agent?.phone || '').trim()

  const [amount, setAmount] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('bkash')
  const [accountNumber, setAccountNumber] = useState(registeredPhone)
  const [bankName, setBankName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [routingNumber, setRoutingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(null)
  const [touched, setTouched] = useState({})

  // Initialize or re-populate registered phone when modal opens
  useEffect(() => {
    if (isOpen) {
      if (payoutMethod !== 'bank' && !accountNumber && registeredPhone) {
        setAccountNumber(registeredPhone)
      }
      setServerError(null)
    }
  }, [isOpen, registeredPhone])

  if (!isOpen) return null

  const numAmount = parseFloat(amount) || 0
  const tdsAmount = Math.round(numAmount * 0.1 * 100) / 100
  const netPayable = Math.max(0, Math.round((numAmount - tdsAmount) * 100) / 100)

  // Validation Logic
  const getAmountError = () => {
    if (!amount || amount.trim() === '') {
      return 'উত্তোলনের পরিমাণ লিখুন।'
    }
    if (numAmount < 500) {
      return 'নূন্যতম উত্তোলনের পরিমাণ ৫০০ টাকা।'
    }
    if (numAmount > availableBalance) {
      return `আপনার উপলব্ধ ব্যালেন্স (৳ ${availableBalance.toFixed(2)}) এর চেয়ে বেশি উত্তোলন করা যাবে না।`
    }
    if (numAmount > 50000) {
      return 'একবারে সর্বোচ্চ ৫০,০০০ টাকা উত্তোলন করা যাবে।'
    }
    return null
  }

  const getAccountError = () => {
    const trimmed = accountNumber.trim()
    if (!trimmed) {
      return payoutMethod === 'bank' ? 'ব্যাংক একাউন্ট নম্বর আবশ্যক।' : 'মোবাইল নম্বর আবশ্যক।'
    }
    if (payoutMethod !== 'bank') {
      const cleanPhone = trimmed.replace(/\D/g, '')
      if (!/^01[3-9]\d{8}$/.test(cleanPhone)) {
        return 'সঠিক ১১ ডিজিটের সচল মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।'
      }
    } else {
      if (trimmed.length < 6) {
        return 'সঠিক ব্যাংক একাউন্ট নম্বর দিন (কমপক্ষে ৬ ডিজিট)।'
      }
    }
    return null
  }

  const getBankNameError = () => {
    if (payoutMethod === 'bank' && !bankName.trim()) {
      return 'ব্যাংকের নাম আবশ্যক।'
    }
    return null
  }

  const getBranchNameError = () => {
    if (payoutMethod === 'bank' && !branchName.trim()) {
      return 'শাখার নাম আবশ্যক।'
    }
    return null
  }

  const amountError = getAmountError()
  const accountError = getAccountError()
  const bankNameError = getBankNameError()
  const branchNameError = getBranchNameError()

  const isFormValid = !amountError && !accountError && !bankNameError && !branchNameError && availableBalance >= 500

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handlePayoutMethodChange = (newMethod) => {
    setPayoutMethod(newMethod)
    setTouched((prev) => ({ ...prev, accountNumber: false }))

    if (newMethod === 'bank') {
      if (accountNumber === registeredPhone) {
        setAccountNumber('')
      }
    } else {
      if (!accountNumber && registeredPhone) {
        setAccountNumber(registeredPhone)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)

    // Touch all fields to show all errors
    setTouched({
      amount: true,
      accountNumber: true,
      bankName: true,
      branchName: true,
    })

    if (!isFormValid) {
      return
    }

    setLoading(true)
    try {
      const accountDetails = {
        account_number: accountNumber.trim(),
      }
      if (payoutMethod === 'bank') {
        accountDetails.bank_name = bankName.trim()
        accountDetails.branch_name = branchName.trim()
        accountDetails.routing_number = routingNumber.trim()
      }

      await agentApi.requestPayoutWithdrawal({
        amount: numAmount,
        payout_method: payoutMethod,
        account_details: accountDetails,
      })

      if (onSuccess) {
        onSuccess()
      }
      onClose()
    } catch (err) {
      console.error('Payout request error:', err)
      const msg = err?.response?.data?.error?.message || err?.response?.data?.message || 'উইথড্র রিকোয়েস্ট ব্যর্থ হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
      setServerError(msg)
    } finally {
      setLoading(false)
    }
  }

  const isPhoneEdited = payoutMethod !== 'bank' && accountNumber !== registeredPhone && registeredPhone

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
        maxWidth: 480,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0',
        animation: 'payoutModalSlideUp 0.25s ease-out',
        position: 'relative'
      }}>
        {/* Top Header */}
        <div style={{
          padding: '22px 24px 18px',
          borderBottom: '1px solid #F1F5F9',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0F172A' }}>
                কমিশন উইথড্র রিকোয়েস্ট
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                উপলব্ধ ব্যালেন্স: <strong style={{ color: availableBalance >= 500 ? '#059669' : '#D97706' }}>৳ {availableBalance.toFixed(2)}</strong>
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
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body & Form */}
        <form onSubmit={handleSubmit} style={{ padding: '22px 24px' }}>
          {/* Low Balance Warning Banner */}
          {availableBalance < 500 && (
            <div style={{
              marginBottom: 16,
              padding: '12px 14px',
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              fontSize: 12.5,
              color: '#92400E'
            }}>
              <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: 1, color: '#D97706' }} />
              <div>
                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 2 }}>
                  অপর্যাপ্ত ব্যালেন্স
                </div>
                <div style={{ color: '#B45309', lineHeight: 1.45 }}>
                  আপনার বর্তমান ব্যালেন্স <strong>৳ {availableBalance.toFixed(2)}</strong>। নূন্যতম উইথড্র করতে কমপক্ষে <strong>৳ ৫০০.০০</strong> ওয়ালেটে জমা থাকতে হবে।
                </div>
              </div>
            </div>
          )}

          {/* Server Error Message */}
          {serverError && (
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
              <span>{serverError}</span>
            </div>
          )}

          {/* Required notice */}
          <div style={{ fontSize: 11, color: '#94A3B8', marginBottom: 14 }}>
            <span style={{ color: '#EF4444', fontWeight: 700 }}>*</span> চিহ্নিত ক্ষেত্রগুলো পূরণ করা বাধ্যতামূলক
          </div>

          {/* Amount Field */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              উত্তোলনের পরিমাণ (টাকা) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 14, fontSize: 16, fontWeight: 800, color: touched.amount && amountError ? '#EF4444' : '#64748B' }}>৳</span>
              <input
                type="number"
                min="500"
                max={availableBalance}
                step="any"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value)
                  if (!touched.amount) {
                    setTouched((prev) => ({ ...prev, amount: true }))
                  }
                }}
                onBlur={() => handleBlur('amount')}
                placeholder="যেমন: ১০০০ (নূন্যতম ৫০০)"
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 32px',
                  borderRadius: 10,
                  border: touched.amount && amountError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                  background: touched.amount && amountError ? '#FEF2F2' : '#FFFFFF',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onFocus={(e) => {
                  if (!(touched.amount && amountError)) {
                    e.currentTarget.style.borderColor = '#059669'
                  }
                }}
              />
            </div>

            {/* In-line Amount Error Message */}
            {touched.amount && amountError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11.5, color: '#DC2626', fontWeight: 600 }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{amountError}</span>
              </div>
            ) : null}

            {/* Quick helper & Max balance button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#94A3B8', marginTop: 5 }}>
              <span>নূন্যতম উইথড্র: ৳ ৫০০.০০</span>
              <button
                type="button"
                onClick={() => {
                  setAmount(String(availableBalance))
                  setTouched((prev) => ({ ...prev, amount: true }))
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: availableBalance >= 500 ? '#059669' : '#94A3B8',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                সর্বোচ্চ ব্যালেন্স (৳ {availableBalance.toFixed(2)})
              </button>
            </div>
          </div>

          {/* Payment Method Field */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
              পেমেন্ট মাধ্যম <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={payoutMethod}
              onChange={(e) => handlePayoutMethodChange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13.5,
                fontWeight: 600,
                color: '#0F172A',
                background: '#FFFFFF',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="bkash">বিকাশ (bKash Personal / Agent)</option>
              <option value="nagad">নগদ (Nagad)</option>
              <option value="rocket">রকেট (Rocket)</option>
              <option value="bank">ব্যাংক একাউন্ট ট্রান্সফার (Bank Transfer)</option>
            </select>
          </div>

          {/* Account Number Field */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                {payoutMethod === 'bank' ? 'ব্যাংক একাউন্ট নম্বর' : 'মোবাইল ফিনান্সিয়াল সার্ভিস (MFS) নম্বর'} <span style={{ color: '#EF4444' }}>*</span>
              </label>
              {isPhoneEdited && (
                <button
                  type="button"
                  onClick={() => {
                    setAccountNumber(registeredPhone)
                    setTouched((prev) => ({ ...prev, accountNumber: true }))
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#059669',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    padding: 0
                  }}
                  title="আপনার মূল রেজিস্ট্রেশন নম্বরে ফেরত যান"
                >
                  <RefreshCw size={11} /> মূল নম্বরে ফিরুন
                </button>
              )}
            </div>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value)
                if (!touched.accountNumber) {
                  setTouched((prev) => ({ ...prev, accountNumber: true }))
                }
              }}
              onBlur={() => handleBlur('accountNumber')}
              placeholder={payoutMethod === 'bank' ? 'যেমন: ১২৩.১০১.XXXX' : 'যেমন: ০১৭XXXXXXXX'}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: touched.accountNumber && accountError ? '1.5px solid #EF4444' : '1.5px solid #CBD5E1',
                background: touched.accountNumber && accountError ? '#FEF2F2' : '#FFFFFF',
                fontSize: 13.5,
                color: '#0F172A',
                outline: 'none',
                fontFamily: 'monospace',
                transition: 'all 0.15s ease'
              }}
              onFocus={(e) => {
                if (!(touched.accountNumber && accountError)) {
                  e.currentTarget.style.borderColor = '#059669'
                }
              }}
            />

            {/* In-line Account Error Message */}
            {touched.accountNumber && accountError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 5, fontSize: 11.5, color: '#DC2626', fontWeight: 600 }}>
                <AlertCircle size={13} style={{ flexShrink: 0 }} />
                <span>{accountError}</span>
              </div>
            ) : payoutMethod !== 'bank' ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11, color: isPhoneEdited ? '#D97706' : '#059669' }}>
                {isPhoneEdited ? (
                  <>
                    <AlertTriangle size={12} style={{ flexShrink: 0 }} />
                    <span>আপনি বিকল্প মোবাইল নম্বর প্রদান করছেন। উইথড্রর অর্থ এই নম্বরেই যাবে।</span>
                  </>
                ) : registeredPhone ? (
                  <>
                    <CheckCircle2 size={12} style={{ flexShrink: 0 }} />
                    <span>আপনার রেজিস্টার্ড মোবাইল নম্বর স্বয়ংক্রিয়ভাবে দেওয়া হয়েছে। প্রয়োজনে পরিবর্তন করতে পারেন।</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Bank Transfer Specific Fields */}
          {payoutMethod === 'bank' && (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: '14px',
              marginBottom: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  ব্যাংকের নাম <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => {
                    setBankName(e.target.value)
                    if (!touched.bankName) setTouched((prev) => ({ ...prev, bankName: true }))
                  }}
                  onBlur={() => handleBlur('bankName')}
                  placeholder="যেমন: Dutch Bangla Bank / BRAC Bank"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: touched.bankName && bankNameError ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    background: touched.bankName && bankNameError ? '#FEF2F2' : '#FFFFFF',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
                {touched.bankName && bankNameError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                    <AlertCircle size={12} />
                    <span>{bankNameError}</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    শাখা (Branch) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => {
                      setBranchName(e.target.value)
                      if (!touched.branchName) setTouched((prev) => ({ ...prev, branchName: true }))
                    }}
                    onBlur={() => handleBlur('branchName')}
                    placeholder="যেমন: ধানমন্ডি শাখা"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: touched.branchName && branchNameError ? '1px solid #EF4444' : '1px solid #CBD5E1',
                      background: touched.branchName && branchNameError ? '#FEF2F2' : '#FFFFFF',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  {touched.branchName && branchNameError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                      <AlertCircle size={12} />
                      <span>{branchNameError}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                    রাউটিং নম্বর <span style={{ color: '#94A3B8', fontWeight: 500 }}>(ঐচ্ছিক)</span>
                  </label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="যেমন: ০৯০২৭XXXX"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 13, outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tax Notice & Net Breakdown */}
          <div style={{
            background: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 20,
            fontSize: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569', marginBottom: 4 }}>
              <span>মোট উত্তোলন (Gross):</span>
              <span style={{ fontWeight: 700, color: '#0F172A' }}>৳ {numAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#B45309', marginBottom: 6 }}>
              <span>উৎস কর কর্তন (TDS ১০%):</span>
              <span style={{ fontWeight: 700 }}>- ৳ {tdsAmount.toFixed(2)}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              color: '#064E3B',
              borderTop: '1px solid #A7F3D0',
              paddingTop: 6,
              fontSize: 13.5,
              fontWeight: 800
            }}>
              <span>প্রদেয় মোট অর্থ (Net):</span>
              <span style={{ color: '#059669' }}>৳ {netPayable.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, color: '#059669', marginTop: 8 }}>
              <ShieldCheck size={12} />
              <span>১০% উৎস কর (TDS) সরকারি কোষাগারে সরাসরি জমা হয়।</span>
            </div>
          </div>

          {/* Form Actions */}
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
              disabled={loading || availableBalance < 500}
              style={{
                padding: '10px 22px',
                borderRadius: 10,
                border: 'none',
                background: (loading || availableBalance < 500) ? '#94A3B8' : '#059669',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                cursor: (loading || availableBalance < 500) ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                boxShadow: (loading || availableBalance < 500) ? 'none' : '0 2px 8px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              <span>{loading ? 'জমা হচ্ছে...' : 'রিকোয়েস্ট সাবমিট করুন'}</span>
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes payoutModalSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
