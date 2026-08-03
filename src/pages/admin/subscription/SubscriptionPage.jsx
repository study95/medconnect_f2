// SubscriptionPage.jsx — Marketing page with package selection
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubscriptionPackages } from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'
import { toast } from 'react-toastify'

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const { hasActiveSubscription, subscription, isTrial, daysRemaining, expiryDate } = useSubscription()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeWarningModal, setActiveWarningModal] = useState(null)

  useEffect(() => {
    loadPackages()
  }, [])

  const loadPackages = async () => {
    try {
      const res = await getSubscriptionPackages()
      setPackages(res.data?.data || [])
    } catch (err) {
      toast.error('Failed to load packages')
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyPrice = (pkg) => {
    const effective = pkg.effective_price || pkg.price
    return Math.round(effective / pkg.duration_months)
  }

  const getSavings = (pkg) => {
    if (pkg.discount_percent > 0) return `Save ${pkg.discount_percent}%`
    if (pkg.discount_amount > 0) return `Save ৳${pkg.discount_amount}`
    return null
  }

  const features = [
    { icon: '📅', title: 'Appointment Management', desc: 'Track and manage all patient appointments' },
    { icon: '📝', title: 'Digital Prescriptions', desc: 'Write and print professional prescriptions' },
    { icon: '💊', title: 'Medicine Database', desc: 'Smart medicine autocomplete with full database' },
    { icon: '📋', title: 'Clinical Notes', desc: 'Save reusable advice templates for prescriptions' },
    { icon: '💳', title: 'Payment Tracking', desc: 'Monitor all payment records and transactions' },
    { icon: '📊', title: 'Analytics Dashboard', desc: 'Insights into your practice performance' },
  ]

  return (
    <div>
      {/* Current Status Banner */}
      {hasActiveSubscription && (
        <div style={{
          background: 'var(--admin-sidebar-active)',
          border: '1px solid var(--admin-sidebar-accent)',
          borderRadius: 16, padding: '20px 28px', marginBottom: 32,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12
        }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--admin-sidebar-accent)', fontSize: 16, fontWeight: 800 }}>
              ✅ Your subscription is active
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
              {isTrial ? `Free trial · ` : subscription ? `${subscription.package_name} · ` : ''}
              {daysRemaining !== null ? `${daysRemaining} days remaining · Expires ${expiryDate}` : 'Active'}
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 48, padding: '24px 0' }}>
        <div style={{
          display: 'inline-flex', padding: '6px 16px', borderRadius: 20,
          background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: 12,
          marginBottom: 16, letterSpacing: '0.5px'
        }}>
          ⚡ UNLOCK YOUR FULL POTENTIAL
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--admin-text)', margin: '0 0 12px', lineHeight: 1.3 }}>
          Upgrade Your Practice with<br />
          <span style={{ color: '#00A88C' }}>Doctor Booklet Pro</span>
        </h1>
        <p style={{ fontSize: 15, color: 'var(--admin-text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          Get access to appointment management, digital prescriptions, medicine database,
          clinical notes, and payment tracking — all in one platform.
        </p>
      </div>

      {/* Features Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16, marginBottom: 48
      }}>
        {features.map(f => (
          <div key={f.title} style={{
            background: 'var(--admin-card-bg)', borderRadius: 14, border: '1px solid var(--admin-border)',
            padding: '20px', display: 'flex', gap: 14, alignItems: 'flex-start'
          }}>
            <span style={{ fontSize: 24 }}>{f.icon}</span>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>{f.title}</h4>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Cards */}
      <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: 'var(--admin-text)', marginBottom: 8 }}>
        Choose Your Plan
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', marginBottom: 32, fontSize: 14 }}>
        Select the plan that fits your practice. All plans include full access to every feature.
      </p>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> Loading packages...</div>
      ) : (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 24, marginBottom: 48
        }}>
          {packages.map(pkg => {
            const isActivePkg = subscription && Number(subscription.package_id) === Number(pkg.id);
 
            return (
            <div key={pkg.id} style={{
              background: isActivePkg ? 'var(--admin-sidebar-user-bg)' : 'var(--admin-card-bg)', borderRadius: 20,
              border: isActivePkg ? '2px solid #3B82F6' : pkg.is_popular ? '2px solid #00A88C' : '1px solid var(--admin-border)',
              padding: '32px 28px',
              boxShadow: isActivePkg ? '0 4px 20px rgba(59, 130, 246, 0.15)' : pkg.is_popular ? '0 8px 30px rgba(0, 168, 140, 0.12)' : 'var(--admin-shadow-sm)',
              position: 'relative', display: 'flex', flexDirection: 'column',
              transition: 'transform 0.2s, box-shadow 0.2s',
              transform: isActivePkg ? 'scale(1.02)' : 'scale(1)'
            }}>
              {isActivePkg ? (
                <div style={{
                  position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                  background: '#3B82F6', color: 'white', padding: '6px 20px', borderRadius: 20,
                  fontSize: 12, fontWeight: 900, letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                }}>
                  ✅ CURRENTLY ACTIVE
                </div>
              ) : pkg.is_popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
                  color: 'white', padding: '4px 16px', borderRadius: 20,
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.5px'
                }}>
                  ⭐ MOST POPULAR
                </div>
              )}

              <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: 'var(--admin-text)' }}>
                {pkg.name}
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 12, color: 'var(--admin-text-muted)', lineHeight: 1.5 }}>
                {pkg.description}
              </p>

              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 900, color: 'var(--admin-text)' }}>
                    ৳{Math.round(pkg.effective_price || pkg.price)}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                    / {pkg.duration_months} {pkg.duration_months === 1 ? 'month' : 'months'}
                  </span>
                </div>

                {(pkg.discount_percent > 0 || pkg.discount_amount > 0) && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ textDecoration: 'line-through', color: '#CBD5E1', fontSize: 14 }}>
                      ৳{Math.round(pkg.price)}
                    </span>
                    <span style={{
                      background: '#FEF3C7', color: '#D97706', padding: '2px 8px',
                      borderRadius: 6, fontSize: 11, fontWeight: 700
                    }}>
                      {getSavings(pkg)}
                    </span>
                  </div>
                )}

                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#64748B' }}>
                  ≈ ৳{getMonthlyPrice(pkg)}/month
                </p>
              </div>

              <div style={{ flex: 1, marginBottom: 20 }}>
                {(pkg.features || []).map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ color: '#10B981', fontSize: 14 }}>✓</span>
                    <span style={{ fontSize: 13, color: 'var(--admin-text-muted)', textTransform: 'capitalize' }}>
                      {f.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>

              <button
                className={`admin-btn ${isActivePkg ? 'admin-btn-outline' : pkg.is_popular ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, fontWeight: 700,
                  borderColor: isActivePkg ? '#3B82F6' : undefined,
                  color: isActivePkg ? '#3B82F6' : undefined
                }}
                onClick={() => {
                  if (isActivePkg) {
                    navigate('/admin/subscription/history');
                  } else if (hasActiveSubscription && subscription) {
                    setActiveWarningModal(pkg);
                  } else {
                    navigate(`/admin/subscription/checkout/${pkg.id}`);
                  }
                }}
              >
                {isActivePkg ? 'See Plan Details' : 'Select Plan'}
              </button>
            </div>
          )})}
        </div>
      )}

      {/* Warning Modal */}
      {activeWarningModal && (
        <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="admin-modal" style={{ maxWidth: 450, padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: 'var(--admin-text)' }}>
              Already Active Package!
            </h3>
            <div style={{ background: 'var(--admin-sidebar-user-bg)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid var(--admin-border)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--admin-text-muted)' }}>
                You already have an active subscription:
              </p>
              <h4 style={{ margin: 0, fontSize: 18, color: '#00A88C', fontWeight: 800 }}>
                {subscription?.package_name || 'Premium Plan'}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                Valid until: <strong>{expiryDate}</strong> ({daysRemaining} days left)
              </p>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to purchase the <strong>{activeWarningModal.name}</strong> plan right now? This will create an additional/overlapping package.
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="admin-btn admin-btn-outline"
                style={{ flex: 1 }}
                onClick={() => setActiveWarningModal(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate(`/admin/subscription/checkout/${activeWarningModal.id}`)}
              >
                Yes, Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
