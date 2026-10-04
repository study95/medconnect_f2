// SubscriptionGate.jsx — Wraps premium modules; blocks access if no subscription
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'

export default function SubscriptionGate({ children, moduleName }) {
  const navigate = useNavigate()
  const { isAdmin, isDoctor, isManager, getRoles } = useAuth()
  const roles = getRoles ? getRoles() : []
  const isHospital = roles.includes('hospital') || roles.includes('manager') || Boolean(isManager)
  const targetLink = isHospital ? '/hospital/hospital-subscription' : '/doctor/subscription'
  const { hasActiveSubscription, loaded } = useSubscription()

  // Admins always pass through
  if (isAdmin) return children

  // Non-providers pass through
  if (!isDoctor && !isHospital) return children

  const moduleTranslations = {
    'Prescriptions': 'ডিজিタル প্রেসক্রিপশন',
    'Medicines': 'ওষুধ তালিকা ও ব্যবস্থাপনা',
    'My Notes': 'ক্লিনিক্যাল নোটস',
    'Payments': 'পেমেন্ট ও হিসাব',
    'Doctor Allocation': 'হাসপাতাল ডাক্তার সিট বরাদ্দ',
    'Queue Displays': 'লাইভ কিউ টিভি ডিসপ্লে'
  }
  const bnModule = moduleName ? (moduleTranslations[moduleName] || moduleName) : 'এই'

  // Still loading
  if (!loaded) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        সাবস্ক্রিপশন যাচাই করা হচ্ছে...
      </div>
    )
  }

  // Has access
  if (hasActiveSubscription) return children

  // No access — show premium paywall card
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '65vh', textAlign: 'center', padding: '32px 16px'
    }}>
      <div style={{
        background: 'var(--admin-card-bg, #ffffff)',
        color: 'var(--admin-text, #0f172a)',
        borderRadius: 24, padding: '40px 36px', maxWidth: 500, width: '100%',
        border: '1px solid var(--admin-border, #e2e8f0)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{
          width: '60px', height: '60px', borderRadius: '18px',
          background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
          color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 18px', boxShadow: '0 8px 20px rgba(37, 99, 235, 0.15)'
        }}>
          <span style={{ fontSize: '28px' }}>👑</span>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: '21px', fontWeight: 900, color: 'var(--admin-text, #0f172a)', letterSpacing: '-0.3px' }}>
          {bnModule} ব্যবহারের জন্য সাবস্ক্রিপশন প্রয়োজন
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '13.5px', color: '#64748b', lineHeight: 1.6 }}>
          আপনার ট্রায়াল বা সাবস্ক্রিপশনের মেয়াদ শেষ হয়েছে। নিরবচ্ছিন্ন ক্লিনিক্যাল প্র্যাকটিস, নতুন প্রেসক্রিপশন ও সকল প্রিমিয়াম সেবা সচল রাখতে পছন্দের প্যাকেজটি সাবস্ক্রাইব করুন।
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            className="admin-btn admin-btn-primary"
            style={{
              padding: '14px 28px', borderRadius: 14, fontWeight: 800, fontSize: '14.5px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              border: 'none', color: '#ffffff', cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
            onClick={() => navigate(targetLink)}
          >
            <span>🚀 এখনই প্যাকেজ আপগ্রেড করুন</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 20px', borderRadius: 12, fontWeight: 600, fontSize: '13px',
              background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer'
            }}
          >
            পূর্বের পেজে ফিরে যান
          </button>
        </div>
      </div>
    </div>
  )
}
