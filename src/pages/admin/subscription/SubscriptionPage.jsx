// SubscriptionPage.jsx — Marketing page with package selection
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSubscriptionPackages } from '../../../api/subscriptionApi'
import { useSubscription } from '../../../context/SubscriptionContext'

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
      
    } finally {
      setLoading(false)
    }
  }

  const getMonthlyPrice = (pkg) => {
    const effective = pkg.effective_price || pkg.price
    return Math.round(effective / pkg.duration_months)
  }

  const getSavings = (pkg) => {
    if (pkg.discount_percent > 0) return `${pkg.discount_percent}% ছাড়`
    if (pkg.discount_amount > 0) return `৳${pkg.discount_amount} ছাড়`
    return null
  }

  const features = [
    { icon: '📅', title: 'অ্যাপয়েন্টমেন্ট ব্যবস্থাপনা', desc: 'রোগীদের সকল অ্যাপয়েন্টমেন্ট সহজে ট্র্যাক ও নিয়ন্ত্রণ করুন' },
    { icon: '📝', title: 'ডিজিটাল প্রেসক্রিপশন', desc: 'পেশাদার ডিজিটাল প্রেসক্রিপশন তৈরি ও প্রিন্ট করুন' },
    { icon: '💊', title: 'ঔষধের ডেটাবেজ', desc: 'স্মার্ট ঔষধ অটো-সাজেশন ও সমৃদ্ধ ডেটাবেজ' },
    { icon: '📋', title: 'ক্লিনিক্যাল নোট ও টেমপ্লেট', desc: 'প্রেসক্রিপশনের জন্য পুনঃব্যবহারযোগ্য পরামর্শ ও নোট সংরক্ষণ' },
    { icon: '💳', title: 'পেমেন্ট ট্র্যাকিং', desc: 'সকল লেনদেন ও পেমেন্ট হিস্ট্রি সহজে পর্যবেক্ষণ করুন' },
    { icon: '📊', title: 'অ্যানালিটিক্স ড্যাশবোর্ড', desc: 'আপনার চিকিৎসা কার্যক্রম ও রোগীর পরিসংখ্যান বিশ্লেষণ' },
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
              ✅ আপনার সাবস্ক্রিপশন সক্রিয় রয়েছে
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
              {isTrial ? `ফ্রি ট্রায়াল · ` : subscription ? `${subscription.package_name} · ` : ''}
              {daysRemaining !== null ? `${daysRemaining} দিন বাকি · মেয়াদ উত্তীর্ণ: ${expiryDate}` : 'সক্রিয়'}
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
          ⚡ আপনার প্র্যাকটিসকে আরও গতিশীল করুন
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--admin-text)', margin: '0 0 12px', lineHeight: 1.3 }}>
          আপনার প্র্যাকটিস আধুনিকায়ন করুন<br />
          <span style={{ color: '#00A88C' }}>ডক্টর বুকলেট প্রো</span>-এর সাথে
        </h1>
        <p style={{ fontSize: 15, color: 'var(--admin-text-muted)', maxWidth: 520, margin: '0 auto', lineHeight: 1.6 }}>
          অ্যাপয়েন্টমেন্ট ব্যবস্থাপনা, ডিজিটাল প্রেসক্রিপশন, মেডিসিন ডেটাবেজ,
          ক্লিনিক্যাল নোট ও পেমেন্ট ট্র্যাকিং — সব একই প্ল্যাটফর্মে।
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
        আপনার সুবিধাজনক প্ল্যান বেছে নিন
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--admin-text-muted)', marginBottom: 32, fontSize: 14 }}>
        আপনার প্র্যাকটিসের জন্য উপযুক্ত প্ল্যান নির্বাচন করুন। প্রতিটি প্ল্যানে সকল ফিচারের পূর্ণ অ্যাক্সেস অন্তর্ভুক্ত।
      </p>

      {loading ? (
        <div className="admin-loading"><div className="admin-spinner" /> প্যাকেজ লোড হচ্ছে...</div>
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
                  ✅ বর্তমানে সক্রিয়
                </div>
              ) : pkg.is_popular && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #00A88C, #00C9A7)',
                  color: 'white', padding: '4px 16px', borderRadius: 20,
                  fontSize: 11, fontWeight: 800, letterSpacing: '0.5px'
                }}>
                  ⭐ সর্বাধিক জনপ্রিয়
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
                    / {pkg.duration_months} মাস
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
                  ≈ ৳{getMonthlyPrice(pkg)} / মাস
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
                {isActivePkg ? 'প্ল্যানের বিবরণ দেখুন' : 'প্ল্যান বেছে নিন'}
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
              ইতিমধ্যে একটি প্যাকেজ সক্রিয় আছে!
            </h3>
            <div style={{ background: 'var(--admin-sidebar-user-bg)', borderRadius: 12, padding: 16, marginBottom: 24, border: '1px solid var(--admin-border)' }}>
              <p style={{ margin: '0 0 8px', fontSize: 14, color: 'var(--admin-text-muted)' }}>
                আপনার ইতিমধ্যে একটি সক্রিয় সাবস্ক্রিপশন রয়েছে:
              </p>
              <h4 style={{ margin: 0, fontSize: 18, color: '#00A88C', fontWeight: 800 }}>
                {subscription?.package_name || 'প্রিমিয়াম প্ল্যান'}
              </h4>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                মেয়াদ উত্তীর্ণ: <strong>{expiryDate}</strong> ({daysRemaining} দিন বাকি)
              </p>
            </div>
            
            <p style={{ fontSize: 14, color: 'var(--admin-text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
              আপনি কি নিশ্চিত যে আপনি এখনই <strong>{activeWarningModal.name}</strong> প্ল্যানটি কিনতে চান? এতে অতিরিক্ত একটি প্যাকেজ যুক্ত হবে।
            </p>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="admin-btn admin-btn-outline"
                style={{ flex: 1 }}
                onClick={() => setActiveWarningModal(null)}
              >
                বাতিল
              </button>
              <button
                className="admin-btn admin-btn-primary"
                style={{ flex: 1 }}
                onClick={() => navigate(`/admin/subscription/checkout/${activeWarningModal.id}`)}
              >
                হ্যাঁ, কিনতে চাই
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
