// CommissionOverdueBanner.jsx — Provider Due & Overdue Settlement Policy Alert Banner
import React, { useState } from 'react'
import { AlertTriangle, Clock, CreditCard, FileText, X, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function CommissionOverdueBanner({
  summary = {},
  onPayClick,
  onMemoClick,
  providerType = 'hospital'
}) {
  const [dismissed, setDismissed] = useState(false)

  const pendingAmount = Number(summary.pending_commission || 0)
  const pendingCount = Number(summary.pending_count || 0)
  const hasOverdue = Boolean(summary.has_overdue && Number(summary.overdue_amount || 0) > 0)
  const overdueAmount = Number(summary.overdue_amount || 0)
  const overdueCount = Number(summary.overdue_count || 0)

  // Don't show if no pending dues or manually dismissed
  if (pendingAmount <= 0 || dismissed) {
    return null
  }

  const isCritical = hasOverdue

  return (
    <div style={{
      background: isCritical 
        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.03) 100%)' 
        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%)',
      border: `1.5px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)'}`,
      borderRadius: 14,
      padding: '14px 18px',
      marginBottom: 18,
      boxShadow: isCritical ? '0 4px 12px rgba(239, 68, 68, 0.08)' : '0 4px 12px rgba(245, 158, 11, 0.06)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      animation: 'fadeIn 0.3s ease-out'
    }}>
      {/* Left Details */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, maxWidth: '720px' }}>
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 10,
          background: isCritical ? '#EF4444' : '#F59E0B',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: isCritical ? '0 2px 8px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(245, 158, 11, 0.3)'
        }}>
          {isCritical ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              padding: '2px 8px',
              borderRadius: 6,
              background: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              color: isCritical ? '#DC2626' : '#B45309'
            }}>
              {isCritical ? '⚠️ OVERDUE ALERT (বকেয়া মেয়াদোত্তীর্ণ)' : '⏳ SETTLEMENT REMINDER (বকেয়া পরিশোধের নোটিশ)'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
              মোট বকেয়া: <span style={{ color: isCritical ? '#DC2626' : '#D97706', fontSize: 15 }}>৳{pendingAmount.toLocaleString()}</span> ({pendingCount} টি অ্যাপয়েন্টমেন্ট)
            </span>
          </div>

          <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
            {isCritical ? (
              <>
                আপনার <strong style={{ color: '#DC2626' }}>{overdueCount}টি অ্যাপয়েন্টমেন্টের ৳{overdueAmount.toLocaleString()} টাকা</strong> কমিশন ১৫ দিনের বেশি সময় ধরে বকেয়া রয়েছে। স্বাস্থ্যসেবা ও অনলাইন বুকিং নিরবচ্ছিন্ন রাখতে অনুগ্রহ করে অবিলম্বে পরিশোধ করুন।
              </>
            ) : (
              <>
                কাউন্টার ক্যাশ বুকিংয়ের প্ল্যাটফর্ম কমিশন প্রতি মাসের ১-৭ তারিখের মধ্যে পরিশোধযোগ্য। বিলিং স্টেটমেন্ট দেখে বিকাশ, নগদ বা ব্যাংক ট্রান্সফারের মাধ্যমে সহজেই পরিশোধ করতে পারেন।
              </>
            )}
          </p>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {onMemoClick && (
          <button
            type="button"
            onClick={onMemoClick}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              background: '#ffffff',
              border: '1px solid #CBD5E1',
              color: '#334155',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5
            }}
          >
            <FileText size={14} />
            <span>ইনভয়েস দেখুন</span>
          </button>
        )}

        <button
          type="button"
          onClick={onPayClick}
          style={{
            padding: '7px 16px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 800,
            background: isCritical ? '#DC2626' : '#10B981',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: isCritical ? '0 2px 6px rgba(220, 38, 38, 0.3)' : '0 2px 6px rgba(16, 185, 129, 0.3)'
          }}
        >
          <CreditCard size={14} />
          <span>এখনই পরিশোধ করুন</span>
          <ArrowRight size={13} />
        </button>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          title="ব্যানারটি বন্ধ করুন"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#94A3B8',
            padding: 4,
            borderRadius: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
