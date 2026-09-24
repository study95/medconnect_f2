// SubscriptionGate.jsx — Wraps premium modules; blocks access if no subscription
import { useNavigate } from 'react-router-dom'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../context/AuthContext'

export default function SubscriptionGate({ children, moduleName }) {
  const navigate = useNavigate()
  const { isAdmin, isDoctor } = useAuth()
  const { hasActiveSubscription, loaded } = useSubscription()

  // Admins always pass through
  if (isAdmin) return children

  // Non-doctors pass through
  if (!isDoctor) return children

  const moduleTranslations = {
    'Prescriptions': 'ডিজিটাল প্রেসক্রিপশন',
    'Medicines': 'ওষুধ তালিকা ও ব্যবস্থাপনা',
    'My Notes': 'ক্লিনিক্যাল নোটস',
    'Payments': 'পেমেন্ট ও হিসাব'
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

  // No access — show upgrade prompt
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: 32
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #FEF3C7, #FFFBEB)',
        borderRadius: 24, padding: '48px 40px', maxWidth: 480, width: '100%',
        border: '1px solid #FDE68A'
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 900, color: '#92400E' }}>
          সাবস্ক্রিপশন প্রয়োজন
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#A16207', lineHeight: 1.6 }}>
          {bnModule} ফিচারটি ব্যবহার করতে একটি সক্রিয় সাবস্ক্রিপশন প্রয়োজন। সব প্রিমিয়াম সুবিধা উপভোগ করতে আপনার প্ল্যান সাবস্ক্রাইব অথবা রিনিউ করুন।
        </p>
        <button
          className="admin-btn admin-btn-primary"
          style={{ padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15 }}
          onClick={() => navigate('/admin/subscription')}
        >
          ⚡ প্ল্যান দেখুন ও সাবস্ক্রাইব করুন
        </button>
      </div>
    </div>
  )
}
