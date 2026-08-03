// CheckoutPage.jsx — Payment form with promo code, method selection
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getSubscriptionPackages, validatePromoCode, purchaseSubscription } from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'
import { toast } from 'react-toastify'

const PAYMENT_METHODS = [
  { key: 'bkash', label: 'bKash', icon: '📱', color: '#E2136E' },
  { key: 'nagad', label: 'Nagad', icon: '📲', color: '#F6921E' },
  { key: 'rocket', label: 'Rocket', icon: '🚀', color: '#8C3494' },
  { key: 'manual', label: 'Manual / Bank Transfer', icon: '🏦', color: '#3B82F6' },
]

export default function CheckoutPage() {
  const { packageId } = useParams()
  const navigate = useNavigate()
  const { refreshSubscription } = useSubscription()

  const [pkg, setPkg] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [promoError, setPromoError] = useState(false)

  // Form state
  const [paymentMethod, setPaymentMethod] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState(null)
  const [validatingPromo, setValidatingPromo] = useState(false)

  useEffect(() => {
    loadPackage()
  }, [packageId])

  const loadPackage = async () => {
    try {
      const res = await getSubscriptionPackages()
      const packages = res.data?.data || []
      const found = packages.find(p => String(p.id) === String(packageId))
      if (found) {
        setPkg(found)
      } else {
        toast.error('Package not found')
        navigate('/admin/subscription')
      }
    } catch {
      toast.error('Failed to load package')
    } finally {
      setLoading(false)
    }
  }

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return
    setValidatingPromo(true)
    try {
      const res = await validatePromoCode(promoCode)
      setPromoResult(res.data?.data)
      toast.success('Promo code applied!')
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid promo code'
      setPromoError(true)
      setPromoResult(null)
    } finally {
      setValidatingPromo(false)
    }
  }

  const calculateTotal = () => {
    if (!pkg) return { original: 0, discount: 0, promo: 0, total: 0 }

    const original = parseFloat(pkg.price)
    let discount = 0

    // Package discount
    if (pkg.discount_percent > 0) discount += (original * pkg.discount_percent / 100)
    if (pkg.discount_amount > 0) discount += parseFloat(pkg.discount_amount)

    let afterPkgDiscount = Math.max(0, original - discount)

    // Promo discount
    let promoDiscount = 0
    if (promoResult) {
      if (promoResult.discount_type === 'percent') {
        promoDiscount = afterPkgDiscount * promoResult.discount_value / 100
      } else {
        promoDiscount = Math.min(promoResult.discount_value, afterPkgDiscount)
      }
    }

    const total = Math.max(0, afterPkgDiscount - promoDiscount)
    return { original, discount, promo: promoDiscount, total: Math.round(total) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!paymentMethod) {
      toast.error('Please select a payment method')
      return
    }
    if ((paymentMethod !== 'sslcommerz') && !paymentReference.trim()) {
      toast.error('Please enter payment reference / transaction ID')
      return
    }

    setSubmitting(true)
    try {
      await purchaseSubscription({
        package_id: pkg.id,
        payment_method: paymentMethod,
        payment_reference: paymentReference.trim(),
        promo_code: promoResult ? promoCode : null,
      })
        toast.success('Subscription activated!')
        refreshSubscription()
        setShowSuccess(true)
      } catch (err) {
      toast.error(err.response?.data?.message || 'Purchase failed')
    } finally {
      setSubmitting(false)
    }
  }

  const pricing = calculateTotal()

  if (loading) return <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
  if (!pkg) return null

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🛒 Checkout</h2>
          <p className="admin-page-subtitle">Complete your subscription purchase</p>
        </div>
        <Link to="/admin/subscription" className="admin-btn admin-btn-outline">← Back to Plans</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32, alignItems: 'flex-start' }}>

        {/* Left — Payment Form */}
        <div>
          <form onSubmit={handleSubmit}>
            {/* Promo Code */}
            <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>🎟️ Promo Code</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  className="admin-form-input"
                  placeholder="Enter promo code (e.g. WELCOME50)"
                  value={promoCode}
                  onChange={e => setPromoCode(e.target.value.toUpperCase())}
                  style={{ flex: 1, textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}
                />
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={handleValidatePromo}
                  disabled={validatingPromo || !promoCode.trim()}
                >
                  {validatingPromo ? '...' : 'Apply'}
                </button>
              </div>
              {promoResult && (
                <div style={{
                  marginTop: 12, background: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between'
                }}>
                  <span style={{ color: '#166534', fontWeight: 700, fontSize: 13 }}>
                    ✅ {promoResult.code} applied
                  </span>
                  <span style={{ color: '#166534', fontWeight: 800 }}>
                    -{promoResult.discount_type === 'percent' ? `${promoResult.discount_value}%` : `৳${promoResult.discount_value}`}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="admin-card" style={{ marginBottom: 24, padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>💳 Payment Method</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {PAYMENT_METHODS.map(method => (
                  <label
                    key={method.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
                      borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
                      border: paymentMethod === method.key ? `2px solid ${method.color}` : '1px solid var(--admin-border)',
                      background: paymentMethod === method.key ? `${method.color}15` : 'var(--admin-card-bg)',
                    }}
                  >
                    <input
                      type="radio" name="payment_method" value={method.key}
                      checked={paymentMethod === method.key}
                      onChange={() => setPaymentMethod(method.key)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: 24 }}>{method.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-text)' }}>{method.label}</span>
                  </label>
                ))}
              </div>

              {paymentMethod && paymentMethod !== 'sslcommerz' && (
                <div style={{ marginTop: 20 }}>
                  <label className="admin-form-label">
                    {paymentMethod === 'manual' ? 'Bank Transfer Reference / Receipt No.' : 'Transaction ID (TxnID)'}
                  </label>
                  <input
                    className="admin-form-input"
                    placeholder={paymentMethod === 'manual' ? 'e.g. BANK-REF-12345' : 'e.g. TXN123456789'}
                    value={paymentReference}
                    onChange={e => setPaymentReference(e.target.value)}
                  />
                  <p style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 6 }}>
                    {paymentMethod === 'manual'
                      ? 'Upload or enter your bank deposit / transfer reference. Admin will verify manually.'
                      : `Send ৳${pricing.total} to our ${paymentMethod} number and enter the Transaction ID here.`
                    }
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="admin-btn admin-btn-primary"
              disabled={submitting}
              style={{ width: '100%', padding: '14px', borderRadius: 12, fontSize: 15, fontWeight: 800 }}
            >
              {submitting ? 'Processing...' : `Pay ৳${pricing.total} & Subscribe`}
            </button>
          </form>
        </div>

        {/* Right — Order Summary */}
        <div className="admin-card" style={{ padding: 28, position: 'sticky', top: 96 }}>
          <h3 style={{ margin: '0 0 20px', fontWeight: 800, fontSize: 16, color: 'var(--admin-text)' }}>📦 Order Summary</h3>

          <div style={{ background: 'var(--admin-sidebar-user-bg)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 4px', fontWeight: 800, color: 'var(--admin-text)', fontSize: 18 }}>
              {pkg.name}
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
              {pkg.duration_months} {pkg.duration_months === 1 ? 'month' : 'months'} subscription
            </p>
          </div>

          <div style={{ fontSize: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#475569' }}>
              <span>Base Price</span>
              <span>৳{Math.round(pricing.original)}</span>
            </div>

            {pricing.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#059669' }}>
                <span>Package Discount</span>
                <span>-৳{Math.round(pricing.discount)}</span>
              </div>
            )}

            {pricing.promo > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: '#D97706' }}>
                <span>Promo Code</span>
                <span>-৳{Math.round(pricing.promo)}</span>
              </div>
            )}

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              borderTop: '2px solid var(--admin-border)', paddingTop: 12, marginTop: 12,
              fontWeight: 900, fontSize: 20, color: 'var(--admin-text)'
            }}>
              <span>Total</span>
              <span style={{ color: '#00A88C' }}>৳{pricing.total}</span>
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 16, lineHeight: 1.5 }}>
            ⓘ Your subscription is activated instantly upon confirming your payment.
          </p>
        </div>
      </div>

      {showSuccess && (
        <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="admin-modal" style={{ maxWidth: 500, padding: 0, overflow: 'hidden', borderRadius: 24 }}>
            <div style={{
              background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
              padding: '48px 32px', textAlign: 'center', color: 'white'
            }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
              <h2 style={{ fontSize: 32, fontWeight: 900, margin: '0 0 8px' }}>Congratulations!</h2>
              <p style={{ fontSize: 16, opacity: 0.9, margin: 0 }}>Your practice is now upgraded</p>
            </div>
            
            <div style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ marginBottom: 32 }}>
                <p style={{ margin: '0 0 8px', color: 'var(--admin-text-muted)', fontSize: 14 }}>You have successfully subscribed to:</p>
                <h3 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--admin-text)' }}>{pkg.name}</h3>
                <div style={{ 
                  display: 'inline-block', marginTop: 12, padding: '6px 16px', 
                  background: '#F0FDF4', color: '#166534', borderRadius: 20, 
                  fontSize: 13, fontWeight: 700, border: '1px solid #BBF7D0'
                }}>
                  ✅ Subscription Active
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <button 
                  className="admin-btn admin-btn-outline" 
                  style={{ padding: '14px', borderRadius: 14, fontWeight: 700 }}
                  onClick={() => navigate('/admin/subscription/history')}
                >
                  View History
                </button>
                <button 
                  className="admin-btn admin-btn-primary" 
                  style={{ padding: '14px', borderRadius: 14, fontWeight: 700 }}
                  onClick={() => navigate('/admin')}
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {promoError && (
        <div className="admin-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="admin-modal" style={{ maxWidth: 400, padding: 32, textAlign: 'center', borderRadius: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 12px', color: 'var(--admin-text)' }}>
              Invalid Promo Code
            </h3>
            <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              The promo code you entered is not right. Please type a valid promo code to enjoy your discount.
            </p>
            <button 
              className="admin-btn admin-btn-primary" 
              style={{ width: '100%', padding: '12px', borderRadius: 12, fontWeight: 700 }}
              onClick={() => setPromoError(false)}
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
