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

  // Still loading
  if (!loaded) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        Checking subscription...
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
          Subscription Required
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#A16207', lineHeight: 1.6 }}>
          {moduleName
            ? `Access to ${moduleName} requires an active subscription.`
            : 'This feature requires an active subscription.'
          }
          {' '}Upgrade your plan to continue using all premium features.
        </p>
        <button
          className="admin-btn admin-btn-primary"
          style={{ padding: '14px 32px', borderRadius: 12, fontWeight: 800, fontSize: 15 }}
          onClick={() => navigate('/admin/subscription')}
        >
          ⚡ View Plans & Subscribe
        </button>
      </div>
    </div>
  )
}
