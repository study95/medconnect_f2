import { ShieldAlert, LogOut, Clock } from 'lucide-react'

export default function IdleWarningModal({
  show,
  remainingSeconds,
  onStayLoggedIn,
  onLogoutNow,
}) {
  if (!show) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="idle-warning-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '24px 24px 20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            margin: '0 auto 14px',
            borderRadius: '50%',
            background: '#FEF3C7',
            color: '#D97706',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert size={28} />
        </div>

        <h3
          id="idle-warning-title"
          style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#0F172A' }}
        >
          নিরাপত্তা সতর্কতা: সেশন শেষ হতে চলেছে
        </h3>

        <p style={{ margin: '0 0 16px', fontSize: 13.5, lineHeight: 1.6, color: '#475569' }}>
          আপনি দীর্ঘক্ষণ নিষ্ক্রিয় আছেন। আপনার অ্যাকাউন্ট ও রোগীর তথ্যের নিরাপত্তার স্বার্থে আর কিছুক্ষণের মধ্যেই স্বয়ংক্রিয়ভাবে লগআউট হয়ে যাবে।
        </p>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 999,
            background: '#FEF2F2',
            color: '#DC2626',
            fontSize: 14,
            fontWeight: 800,
            marginBottom: 20,
          }}
        >
          <Clock size={16} />
          <span>{remainingSeconds} সেকেন্ড বাকি</span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onStayLoggedIn}
            style={{
              flex: 1,
              minWidth: 150,
              padding: '11px 16px',
              borderRadius: 10,
              border: 'none',
              background: '#059669',
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            সেশন চালু রাখুন
          </button>

          <button
            type="button"
            onClick={onLogoutNow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 16px',
              borderRadius: 10,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <LogOut size={15} /> লগআউট করুন
          </button>
        </div>
      </div>
    </div>
  )
}
