import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Stethoscope, 
  Building2,
  ShieldCheck, 
  ChevronRight, 
  QrCode, 
  Copy, 
  Check, 
  Search, 
  ArrowUpRight,
  TrendingUp,
  Award,
  AlertTriangle,
  Lock
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import agentApi from '../../api/agentApi'
import { useAuth } from '../../context/AuthContext'
import PayoutRequestModal from '../../features/agent/components/PayoutRequestModal'
import AgentQRCardModal from '../../features/agent/components/AgentQRCardModal'

export default function AgentDashboardPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')
  const [loading, setLoading] = useState(true)
  const [walletSummary, setWalletSummary] = useState({ available_balance: 0, settled_balance: 0, currency: 'BDT' })
  const [recentRequests, setRecentRequests] = useState([])
  
  // Modals & Filters
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [codeCopied, setCodeCopied] = useState(false)

  const agentCode = user?.agent?.public_id || user?.agent?.agent_code || user?.public_id || user?.agent_code || 'AGT-PARTNER'

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const [walletRes, requestsRes] = await Promise.all([
        agentApi.getWalletStatement({ per_page: 5 }).catch(() => ({ data: {} })),
        agentApi.getOnboardingRequests({ per_page: 20 }).catch(() => ({ data: [] })),
      ])

      if (walletRes.data?.summary) {
        setWalletSummary(walletRes.data.summary)
      }
      setRecentRequests(requestsRes.data || [])
    } catch (err) {
      console.error('Failed to load agent dashboard:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  const approvedCount = recentRequests.filter((r) => r.status === 'approved').length
  const pendingCount = recentRequests.filter((r) => ['submitted', 'under_review'].includes(r.status)).length
  const revisionCount = recentRequests.filter((r) => ['rejected', 'revision_requested'].includes(r.status)).length

  // Monthly Target Progress
  const monthlyTarget = 20
  const progressPercent = Math.min(100, Math.round((approvedCount / monthlyTarget) * 100))
  const remainingForBonus = Math.max(0, monthlyTarget - approvedCount)

  const handleCopyAgentCode = async () => {
    try {
      await navigator.clipboard.writeText(agentCode)
      setCodeCopied(true)
      toast.success(`Agent Code (${agentCode}) কপি হয়েছে!`)
      setTimeout(() => setCodeCopied(false), 2000)
    } catch {
      toast.error('কোড কপি করতে ব্যর্থ হয়েছে।')
    }
  }

  // Filtered Candidate Submissions
  const filteredRequests = recentRequests.filter((req) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'approved' && req.status !== 'approved') return false
      if (statusFilter === 'pending' && !['submitted', 'under_review'].includes(req.status)) return false
      if (statusFilter === 'revision' && !['rejected', 'revision_requested'].includes(req.status)) return false
    }

    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      req.request_code?.toLowerCase().includes(term) ||
      req.payload?.name?.toLowerCase().includes(term) ||
      req.payload?.bmdc?.toLowerCase().includes(term) ||
      req.payload?.phone?.includes(term)
    )
  })

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <style>{`
        .agent-dash-container {
          max-width: 1220px;
          margin: 0 auto;
          padding: 24px 20px 60px;
        }
        .agent-hero-card {
          background: linear-gradient(135deg, #064E3B 0%, #065F46 45%, #047857 75%, #0D9488 100%);
          border-radius: 20px;
          padding: 26px 32px;
          color: #FFFFFF;
          box-shadow: 0 12px 32px -8px rgba(6, 78, 59, 0.45);
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }
        .agent-actions-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          position: relative;
          z-index: 1;
        }
        .agent-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }
        .agent-metric-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 20px 22px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .agent-search-box {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          padding: 6px 12px;
          width: 220px;
        }
        .agent-filter-chips {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .agent-sub-item {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 14px;
          transition: background 0.15s ease;
        }

        @media (max-width: 768px) {
          .agent-dash-container {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .agent-hero-card {
            padding: 16px 14px !important;
            border-radius: 16px !important;
            margin-bottom: 14px !important;
            gap: 14px !important;
          }
          .agent-hero-name {
            font-size: 18px !important;
          }
          .agent-actions-wrap {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .agent-actions-wrap button,
          .agent-actions-wrap a {
            width: 100% !important;
            justify-content: center !important;
            padding: 9px 8px !important;
            font-size: 12px !important;
            border-radius: 9px !important;
            text-align: center !important;
            box-sizing: border-box !important;
          }
          .agent-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10px !important;
            margin-bottom: 14px !important;
          }
          .agent-metric-card {
            padding: 14px !important;
            border-radius: 14px !important;
          }
          .agent-balance-card {
            grid-column: span 2 !important;
          }
          .agent-metric-card .metric-val {
            font-size: 21px !important;
          }
          .agent-goal-banner {
            padding: 12px 14px !important;
            margin-bottom: 14px !important;
          }
          .agent-table-header {
            padding: 14px 14px !important;
            gap: 12px !important;
          }
          .agent-search-box {
            width: 100% !important;
          }
          .agent-filter-chips {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            padding-bottom: 4px !important;
            scrollbar-width: none !important;
            display: flex !important;
            gap: 6px !important;
          }
          .agent-filter-chips button {
            flex-shrink: 0 !important;
            padding: 5px 11px !important;
            font-size: 11px !important;
          }
          .agent-sub-item {
            padding: 12px 14px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 10px !important;
          }
          .agent-sub-item-meta {
            width: 100% !important;
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            padding-top: 8px !important;
            border-top: 1px dashed #F1F5F9 !important;
          }
        }
      `}</style>
      <div className="agent-dash-container">
        
        {/* ── Executive Partner Profile & Action Hub (Dream Green) ── */}
        <div className="agent-hero-card">
          {/* Subtle Ambient Dream Glow Shapes */}
          <div style={{
            position: 'absolute',
            top: -50,
            right: 80,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: -60,
            left: 180,
            width: 240,
            height: 240,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />

          {/* Left: Executive Identity Block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1 }}>
            <div style={{
              width: 54,
              height: 54,
              borderRadius: 15,
              overflow: 'hidden',
              background: '#FFFFFF',
              color: '#064E3B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
              flexShrink: 0
            }}>
              {user?.photo ? (
                <img src={user.photo} alt={user?.name || 'Agent'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{user?.name ? user.name.charAt(0).toUpperCase() : 'A'}</span>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <h2 className="agent-hero-name" style={{ margin: 0, fontSize: 21, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                  {user?.name || 'Field Partner'}
                </h2>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(255, 255, 255, 0.18)',
                  backdropFilter: 'blur(8px)',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '2px 9px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  <ShieldCheck size={13} color="#6EE7B7" />
                  Verified
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.75)', fontWeight: 600 }}>Agent Code:</span>
                <button
                  onClick={handleCopyAgentCode}
                  title="Click to copy Agent Code"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(0, 0, 0, 0.25)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: 6,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    color: '#6EE7B7',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                >
                  <span>{agentCode}</span>
                  {codeCopied ? <Check size={11} color="#10B981" /> : <Copy size={11} color="#A7F3D0" />}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Primary Action Group (Dream Glass & White Card) */}
          <div className="agent-actions-wrap">
            <button
              onClick={() => setQrModalOpen(true)}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: 10,
                padding: '9px 15px',
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <QrCode size={15} color="#A7F3D0" />
              <span>QR Card &amp; Share</span>
            </button>

            <button
              onClick={() => setPayoutModalOpen(true)}
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: 10,
                padding: '9px 15px',
                fontSize: 13,
                fontWeight: 600,
                color: '#FFFFFF',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.22)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <Wallet size={15} color="#A7F3D0" />
              <span>Withdraw Request</span>
            </button>

            <Link
              to="/agent/onboard/doctor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: isAgentSuspended ? '#F1F5F9' : '#FFFFFF',
                color: isAgentSuspended ? '#94A3B8' : '#004D2C',
                borderRadius: 10,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                border: '1px solid rgba(255, 255, 255, 0.85)'
              }}
              onMouseEnter={(e) => {
                if (!isAgentSuspended) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.22)'
                  e.currentTarget.style.background = '#F8FAFC'
                }
              }}
              onMouseLeave={(e) => {
                if (!isAgentSuspended) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)'
                  e.currentTarget.style.background = '#FFFFFF'
                }
              }}
            >
              {isAgentSuspended ? <Lock size={15} color="#94A3B8" /> : <Plus size={16} strokeWidth={2.5} color="#059669" />}
              <span>{isAgentSuspended ? 'Doctor (Locked)' : 'Onboard Doctor'}</span>
            </Link>

            <Link
              to="/agent/onboard/hospital"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: isAgentSuspended ? '#F1F5F9' : '#FFFFFF',
                color: isAgentSuspended ? '#94A3B8' : '#004D2C',
                borderRadius: 10,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.16)',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease',
                border: '1px solid rgba(255, 255, 255, 0.85)'
              }}
              onMouseEnter={(e) => {
                if (!isAgentSuspended) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.22)'
                  e.currentTarget.style.background = '#F8FAFC'
                }
              }}
              onMouseLeave={(e) => {
                if (!isAgentSuspended) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.16)'
                  e.currentTarget.style.background = '#FFFFFF'
                }
              }}
            >
              {isAgentSuspended ? <Lock size={15} color="#94A3B8" /> : <Building2 size={16} strokeWidth={2.2} color="#059669" />}
              <span>{isAgentSuspended ? 'Hospital (Locked)' : 'Onboard Hospital'}</span>
            </Link>
          </div>
        </div>

        {/* ── KPI Metrics Grid (Stripe Minimalist Clean Cards) ── */}
        <div className="agent-metrics-grid">
          {/* Card 1: Available Balance */}
          <div className="agent-metric-card agent-balance-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Wallet size={18} />
              </div>
              <button
                onClick={() => setPayoutModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#059669',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3
                }}
              >
                <span>পেআউট</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              উত্তোলনযোগ্য ব্যালেন্স
            </div>
            <div className="metric-val" style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginTop: 4 }}>
              ৳{parseFloat(walletSummary.available_balance || 0).toFixed(2)}
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>
              পেআউটের সময় ১০% TDS কর্তনযোগ্য
            </div>
          </div>

          {/* Card 2: Total Submissions */}
          <div className="agent-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#2563EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={18} />
              </div>
              <Link to="/agent/tracker" style={{ fontSize: 12, fontWeight: 700, color: '#059669', textDecoration: 'none' }}>
                ট্র্যাকার →
              </Link>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              মোট প্রার্থী
            </div>
            <div className="metric-val" style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginTop: 4 }}>
              {recentRequests.length}
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>
              পাইপলাইনে থাকা ডাক্তার প্রার্থী
            </div>
          </div>

          {/* Card 3: Approved Providers */}
          <div className="agent-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckCircle2 size={18} />
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              ভেরিফাইড ডাক্তার
            </div>
            <div className="metric-val" style={{ fontSize: 26, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em', marginTop: 4 }}>
              {approvedCount}
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>
              ডাক্তার বুকলেটে সক্রিয়
            </div>
          </div>

          {/* Card 4: Under Review */}
          <div className="agent-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#D97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Clock size={18} />
              </div>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              যাচাইকরণ প্রক্রিয়ায়
            </div>
            <div className="metric-val" style={{ fontSize: 26, fontWeight: 900, color: '#D97706', letterSpacing: '-0.02em', marginTop: 4 }}>
              {pendingCount}
            </div>
            <div style={{ fontSize: 11.5, color: '#94A3B8', marginTop: 6 }}>
              BMDC পর্যালোচনা চলমান
            </div>
          </div>
        </div>

        {/* ── Monthly Goal Strip (Linear Style, Minimalist) ── */}
        <div className="agent-goal-banner" style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '16px 22px',
          marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={16} color="#059669" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                মাসিক অনবোর্ডিং টার্গেট: {approvedCount} of {monthlyTarget} সম্পন্ন ({progressPercent}%)
              </span>
            </div>

            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: remainingForBonus === 0 ? '#059669' : '#64748B',
              background: remainingForBonus === 0 ? '#ECFDF5' : '#F1F5F9',
              padding: '3px 10px',
              borderRadius: 6
            }}>
              {remainingForBonus === 0 ? '🎉 টার্গেট পূরণ হয়েছে!' : `আর ${remainingForBonus} জন সম্পন্ন করলে ৳২,০০০ বোনাস`}
            </span>
          </div>

          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: '#059669',
              borderRadius: 6,
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* ── Candidate Submissions (Clean Apple/Stripe Table View) ── */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
          overflow: 'hidden'
        }}>
          {/* Table Header & Controls */}
          <div className="agent-table-header" style={{
            padding: '20px 24px',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>
                সাম্প্রতিক অনবোর্ডিং সাবমিশন
              </h3>
              <p style={{ margin: '3px 0 0', fontSize: 12.5, color: '#64748B' }}>
                আপনার সাবমিট করা ডাক্তারদের বর্তমান ভেরিফিকেশন ও কমিশন স্ট্যাটাস
              </p>
            </div>

            {/* Search Box & Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', width: '100%', maxWidth: '100%' }}>
              <div className="agent-search-box">
                <Search size={14} color="#94A3B8" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="নাম বা BMDC খুঁজুন..."
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: 12.5,
                    width: '100%',
                    color: '#0F172A'
                  }}
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Chips */}
              <div className="agent-filter-chips">
                {[
                  { key: 'all', label: `সকল (${recentRequests.length})` },
                  { key: 'approved', label: `অনুমোদিত (${approvedCount})` },
                  { key: 'pending', label: `রিভিউ (${pendingCount})` },
                  { key: 'revision', label: `সংশোধন (${revisionCount})` }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    style={{
                      border: '1px solid',
                      borderColor: statusFilter === tab.key ? '#059669' : '#E2E8F0',
                      background: statusFilter === tab.key ? '#ECFDF5' : '#FFFFFF',
                      color: statusFilter === tab.key ? '#059669' : '#64748B',
                      padding: '5px 10px',
                      borderRadius: 6,
                      fontSize: 11.5,
                      fontWeight: statusFilter === tab.key ? 800 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submissions List Content */}
          {loading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ display: 'inline-block', width: 22, height: 22, border: '2.5px solid #059669', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ fontSize: 12.5, marginTop: 10 }}>ডাটা লোড হচ্ছে...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: '#94A3B8' }}>
              <Stethoscope size={32} style={{ opacity: 0.35, margin: '0 auto 10px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: 14.5, fontWeight: 700, color: '#475569' }}>
                {search ? 'কোনো ফলাফল পাওয়া যায়নি' : 'এখনও কোনো ডাক্তার সাবমিট করা হয়নি'}
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: 12.5, color: '#94A3B8' }}>
                {search ? 'অন্য নাম বা BMDC নম্বর দিয়ে অনুসন্ধান করুন।' : 'কমিশন অর্জনের জন্য আপনার প্রথম ডাক্তার অনবোর্ডিং শুরু করুন।'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/agent/onboard/doctor"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: isAgentSuspended ? '#94A3B8' : '#059669',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  {isAgentSuspended ? <Lock size={14} /> : <Plus size={14} />}
                  <span>{isAgentSuspended ? 'Doctor (Locked)' : '+ Onboard Doctor'}</span>
                </Link>

                <Link
                  to="/agent/onboard/hospital"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: isAgentSuspended ? '#94A3B8' : '#10B981',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  {isAgentSuspended ? <Lock size={14} /> : <Building2 size={14} />}
                  <span>{isAgentSuspended ? 'Hospital (Locked)' : '+ Onboard Hospital'}</span>
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {filteredRequests.map((req, idx) => {
                const isApproved = req.status === 'approved'
                const isRejected = ['rejected', 'revision_requested'].includes(req.status)
                const isPending = ['submitted', 'under_review'].includes(req.status)

                return (
                  <div
                    key={req.id}
                    className="agent-sub-item"
                    style={{
                      padding: '16px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 14,
                      borderBottom: idx === filteredRequests.length - 1 ? 'none' : '1px solid #F1F5F9',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F8FAFC' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = '#FFFFFF' }}
                  >
                    {/* Doctor Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: '#F1F5F9',
                        color: '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 800,
                        flexShrink: 0
                      }}>
                        {req.payload?.name ? req.payload.name.replace(/^Dr\.?\s*/i, '').charAt(0).toUpperCase() : 'D'}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                          {req.payload?.name || 'Doctor Candidate'}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#059669' }}>
                            {req.request_code}
                          </span>
                          <span>•</span>
                          <span>BMDC: {req.payload?.bmdc || 'N/A'}</span>
                          {req.payload?.phone && (
                            <>
                              <span>•</span>
                              <span>{req.payload.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Pill & Date */}
                    <div className="agent-sub-item-meta" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: 11.5,
                          fontWeight: 700,
                          background: isApproved ? '#ECFDF5' : isRejected ? '#FEF2F2' : '#FFFBEB',
                          color: isApproved ? '#059669' : isRejected ? '#DC2626' : '#D97706',
                          border: `1px solid ${isApproved ? '#A7F3D0' : isRejected ? '#FECACA' : '#FDE68A'}`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <span style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isApproved ? '#10B981' : isRejected ? '#EF4444' : '#F59E0B'
                        }} />
                        {isApproved ? 'VERIFIED & PAID' : isRejected ? 'REVISION NEEDED' : 'IN VERIFICATION'}
                      </span>

                      <span style={{ fontSize: 12, color: '#94A3B8', whiteSpace: 'nowrap' }}>
                        {req.created_at ? new Date(req.created_at).toLocaleDateString() : ''}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      <PayoutRequestModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        availableBalance={parseFloat(walletSummary.available_balance || 0)}
        defaultPhone={user?.phone || user?.agent?.phone || ''}
        onSuccess={() => {
          setPayoutModalOpen(false)
          toast.success('উইথড্র রিকোয়েস্ট সফলভাবে জমা হয়েছে!')
          loadDashboard()
        }}
      />

      <AgentQRCardModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        agentCode={agentCode}
        agentName={user?.name || 'Field Partner'}
        agentPhone={user?.phone || user?.agent?.phone || ''}
        agentPhoto={user?.photo || user?.agent?.photo || ''}
      />
    </div>
  )
}
