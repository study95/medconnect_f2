// HospitalSubscriptionExperiencePage.jsx — Phase 4.2 & 4.4 Enterprise Hospital Subscription & Capacity Experience
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getHospitalBillingOverview,
  getHospitalAvailablePlans,
  previewHospitalPlanChange,
  cancelHospitalBillingSubscription,
  allocateHospitalDoctorSeat,
  revokeHospitalDoctorSeat,
  emailHospitalInvoice
} from '../../../api/subscriptionApi'
import { getDoctors } from '../../../api/doctorApi'
import {
  Building2, Users, Check, AlertTriangle, Clock, Zap, Shield,
  RefreshCw, Lock, FileText, Calendar, Info, AlertCircle,
  CheckCircle2, ChevronRight, X, UserPlus, UserMinus, Monitor,
  Activity, PhoneCall, Mail, Headphones, History, Search,
  Printer, Sparkles
} from 'lucide-react'
import '../../../styles/hospital-subscription.css'

export default function HospitalSubscriptionExperiencePage() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'annual'

  // Modal & Drawer states
  const [actionFeedback, setActionFeedback] = useState(null)
  const [showTimeline, setShowTimeline] = useState(false)

  // Doctor Seat Management states
  const [doctorSearch, setDoctorSearch] = useState('')
  const [showAllocateModal, setShowAllocateModal] = useState(false)
  const [newDoctorId, setNewDoctorId] = useState('')
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('')
  const [doctorSearchResults, setDoctorSearchResults] = useState([])
  const [searchingDoctors, setSearchingDoctors] = useState(false)
  const [allocatingSeat, setAllocatingSeat] = useState(false)
  const [doctorToRevoke, setDoctorToRevoke] = useState(null)
  const [revokingSeat, setRevokingSeat] = useState(false)

  // Subscription Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingSub, setCancellingSub] = useState(false)

  // Invoices actions
  const [emailingInvoiceId, setEmailingInvoiceId] = useState(null)

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const [overviewRes, plansRes] = await Promise.all([
        getHospitalBillingOverview(),
        getHospitalAvailablePlans()
      ])
      setOverview(overviewRes.data)
      setPlans(plansRes.data || [])
    } catch (err) {
      console.error('Failed to load hospital billing data:', err)
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to load institutional billing details. Please try again.'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Auto-dismiss feedback after 6 seconds
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [actionFeedback])

  // Search doctors when doctorSearchQuery changes inside the allocate modal
  useEffect(() => {
    if (!doctorSearchQuery.trim() || doctorSearchQuery.length < 2) {
      setDoctorSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        setSearchingDoctors(true)
        const res = await getDoctors({ search: doctorSearchQuery.trim(), per_page: 8 })
        const list = res.data?.data || res.data || []
        setDoctorSearchResults(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error('Error searching doctors:', err)
      } finally {
        setSearchingDoctors(false)
      }
    }, 350)

    return () => clearTimeout(timer)
  }, [doctorSearchQuery])

  // Redirect to Checkout — the ONLY way to subscribe or change plans.
  const handleProceedToCheckout = (plan) => {
    navigate(`/admin/subscription/checkout?plan_id=${plan.id}&cycle=${billingCycle}`)
  }

  const handleAllocateDoctor = async (e) => {
    if (e) e.preventDefault()
    if (!newDoctorId) return
    try {
      setAllocatingSeat(true)
      await allocateHospitalDoctorSeat(Number(newDoctorId))
      setActionFeedback({
        type: 'success',
        text: `Doctor seat (ID #${newDoctorId}) allocated successfully to the facility roster!`
      })
      setNewDoctorId('')
      setDoctorSearchQuery('')
      setDoctorSearchResults([])
      setShowAllocateModal(false)
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to allocate doctor seat. Please check the Doctor ID.'
      })
    } finally {
      setAllocatingSeat(false)
    }
  }

  const handleSelectDoctorFromSearch = (doc) => {
    setNewDoctorId(String(doc.id))
    setDoctorSearchQuery(`${doc.name} (ID: #${doc.id})`)
    setDoctorSearchResults([])
  }

  const handleConfirmRevokeDoctor = async () => {
    if (!doctorToRevoke) return
    try {
      setRevokingSeat(true)
      await revokeHospitalDoctorSeat(doctorToRevoke.id)
      setActionFeedback({
        type: 'info',
        text: `Doctor seat for Dr. ${doctorToRevoke.name} has been revoked.`
      })
      setDoctorToRevoke(null)
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to revoke doctor seat.'
      })
    } finally {
      setRevokingSeat(false)
    }
  }

  const handleConfirmCancelSub = async () => {
    try {
      setCancellingSub(true)
      await cancelHospitalBillingSubscription(false)
      setActionFeedback({
        type: 'info',
        text: 'Institutional subscription cancellation scheduled for the end of the billing cycle.'
      })
      setShowCancelModal(false)
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Error cancelling institutional subscription.'
      })
    } finally {
      setCancellingSub(false)
    }
  }

  const handleEmailInvoice = async (invoiceId, invoiceNumber) => {
    try {
      setEmailingInvoiceId(invoiceId)
      await emailHospitalInvoice(invoiceId)
      setActionFeedback({
        type: 'success',
        text: `Invoice #${invoiceNumber} has been dispatched to your facility billing email.`
      })
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to email invoice receipt.'
      })
    } finally {
      setEmailingInvoiceId(null)
    }
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  // Helper: Status badge renderer
  const renderStatusBadge = (status) => {
    const s = String(status || 'active').toLowerCase()
    if (s === 'active') {
      return (
        <span className="hosp-sub-badge-status active">
          <span className="hosp-sub-dot pulse" style={{ background: '#10b981' }} />
          Active Facility Tier
        </span>
      )
    }
    if (s === 'trialing') {
      return (
        <span className="hosp-sub-badge-status trialing">
          <span className="hosp-sub-dot pulse" style={{ background: '#2563eb' }} />
          Trial Period
        </span>
      )
    }
    if (s === 'grace_period') {
      return (
        <span className="hosp-sub-badge-status grace">
          <span className="hosp-sub-dot pulse" style={{ background: '#f59e0b' }} />
          Grace Period
        </span>
      )
    }
    return (
      <span className="hosp-sub-badge-status expired">
        <span className="hosp-sub-dot" style={{ background: '#ef4444' }} />
        {s.toUpperCase()}
      </span>
    )
  }

  // ─── LOADING SKELETON ───
  if (loading) {
    return (
      <div className="hosp-sub-container">
        <div className="hosp-sub-skeleton mb-4" style={{ height: '36px', width: '360px' }} />
        <div className="hosp-sub-skeleton mb-4" style={{ height: '200px', width: '100%', borderRadius: '20px' }} />
        <div className="row g-3 mb-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-12 col-sm-6 col-lg-3">
              <div className="hosp-sub-skeleton" style={{ height: '120px', borderRadius: '16px' }} />
            </div>
          ))}
        </div>
        <div className="hosp-sub-skeleton" style={{ height: '340px', width: '100%', borderRadius: '20px' }} />
      </div>
    )
  }

  const sub = overview?.current_plan
  const hospital = overview?.hospital
  const banners = overview?.banners || {}
  const staged = banners?.staged_renewal
  const seatAllocation = overview?.seat_allocation || {}
  const allocatedDoctors = overview?.allocated_doctors || []
  const usages = overview?.usages || []
  const invoices = overview?.invoices || []
  const pendingRequest = overview?.pending_request
  const timeline = overview?.timeline || []

  // Filter allocated doctors based on search
  const filteredDoctors = allocatedDoctors.filter(doc => {
    if (!doctorSearch.trim()) return true
    const q = doctorSearch.toLowerCase()
    return (
      doc.name?.toLowerCase().includes(q) ||
      doc.specialty?.name?.toLowerCase().includes(q) ||
      doc.degree?.toLowerCase().includes(q) ||
      doc.phone?.toLowerCase().includes(q) ||
      doc.email?.toLowerCase().includes(q) ||
      String(doc.id).includes(q)
    )
  })

  // Utilization progress color calculation
  const seatPct = seatAllocation.utilization_pct || 0
  const seatProgressColor = seatPct >= 90 ? 'rose' : seatPct >= 70 ? 'amber' : 'emerald'

  return (
    <div className="hosp-sub-container hosp-sub-fade-in">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            <span>Dashboard</span>
            <ChevronRight size={13} />
            <span style={{ color: '#2563eb', fontWeight: 700 }}>Hospital Subscription & Capacity</span>
          </div>
          <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
              Hospital Subscription & Capacity Management
            </h1>
            <span className="hosp-sub-badge-tier">
              Institutional
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
            {hospital?.name || 'Hospital Clinical Facility'} • License #{hospital?.license_number || 'N/A'} • Multi-Doctor Quotas & Entitlements
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/admin/subscription/history')}
            className="hosp-sub-btn-secondary"
            title="View institutional subscription and payment transaction history"
          >
            <History size={15} style={{ color: '#2563eb' }} />
            <span>Subscription History</span>
          </button>

          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(true)}
              className="hosp-sub-btn-secondary"
              title="View lifecycle events timeline"
            >
              <Activity size={15} style={{ color: '#2563eb' }} />
              <span>Lifecycle Timeline ({timeline.length})</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="hosp-sub-btn-secondary"
            title="Synchronize subscription and quota status"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} style={{ color: '#2563eb' }} />
            <span>{refreshing ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* ─── ACTION TOAST / FEEDBACK ─── */}
      {actionFeedback && (
        <div
          className={`hosp-sub-banner ${
            actionFeedback.type === 'error' ? 'danger' : actionFeedback.type === 'info' ? 'info' : 'warning'
          } hosp-sub-fade-in`}
          style={{
            background: actionFeedback.type === 'success' ? '#ecfdf5' : undefined,
            borderColor: actionFeedback.type === 'success' ? '#a7f3d0' : undefined,
            color: actionFeedback.type === 'success' ? '#065f46' : undefined
          }}
        >
          <div className="d-flex align-items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 size={18} style={{ color: '#10b981' }} />
            ) : actionFeedback.type === 'error' ? (
              <AlertCircle size={18} style={{ color: '#ef4444' }} />
            ) : (
              <Info size={18} style={{ color: '#3b82f6' }} />
            )}
            <span style={{ fontSize: '13.5px', fontWeight: 600 }}>{actionFeedback.text}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── 1. ACTIVE PENDING PAYMENT LOCK BANNER ─── */}
      {overview?.is_checkout_locked && (
        <div className="hosp-sub-banner warning hosp-sub-fade-in">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>
                Payment Verification Under Administrative Review
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                {overview.lock_reason || 'Your institutional manual payment has been received and is currently under verification. Plan upgrades remain locked until an administrator verifies the transaction reference.'}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => navigate('/admin/subscription/history')}
              className="hosp-sub-btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}
            >
              Track in History
            </button>
            <span
              style={{
                padding: '4px 12px',
                borderRadius: '9999px',
                background: 'rgba(245, 158, 11, 0.25)',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase'
              }}
            >
              Under Review
            </span>
          </div>
        </div>
      )}

      {/* ─── STAGED RENEWAL BANNER ─── */}
      {staged && (
        <div className={`hosp-sub-banner ${
          staged.level === 'critical' ? 'danger' :
          staged.level === 'urgent'   ? 'warning' :
          staged.level === 'warning'  ? 'warning' : 'info'
        }`}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: staged.level === 'critical' ? '#ef4444' : staged.level === 'urgent' ? '#ea580c' : '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>{staged.title}</div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>{staged.message}</div>
            </div>
          </div>
          <button
            onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hosp-sub-btn-secondary"
            style={{ fontWeight: 800 }}
          >
            Manage Renewal
          </button>
        </div>
      )}

      {/* ─── PENDING PLAN SWITCH BANNER ─── */}
      {pendingRequest && (
        <div className="hosp-sub-banner info">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#2563eb',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <RefreshCw size={20} className="animate-spin" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14.5px' }}>
                Pending Institutional Plan Change Request
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                Requested switch to <strong>{pendingRequest.target_plan}</strong> ({pendingRequest.target_cycle}) with prorated balance ৳{Number(pendingRequest.amount_due).toLocaleString()}. An administrator will activate this once confirmed.
              </div>
            </div>
          </div>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(37, 99, 235, 0.2)',
              color: '#1d4ed8',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase'
            }}
          >
            Awaiting Approval
          </span>
        </div>
      )}

      {/* ─── 2. INSTITUTIONAL HERO BANNER ─── */}
      <div className="hosp-sub-hero">
        <div className="hosp-sub-hero-glow" />

        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-4 position-relative" style={{ zIndex: 1 }}>
          <div>
            <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
              <span className="hosp-sub-badge-tier">
                <Shield size={12} />
                {sub?.plan?.tier || 'Hospital Starter'} Tier
              </span>
              {renderStatusBadge(sub?.status)}
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 4px 0', letterSpacing: '-0.4px' }}>
              {sub?.plan?.name || 'Hospital Clinical Facility Tier'}
            </h2>
            <p className="text-muted" style={{ fontSize: '13.5px', margin: 0, maxWidth: '640px' }}>
              {sub?.current_period_ends_at
                ? `Active institutional period until ${new Date(sub.current_period_ends_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}.`
                : 'Institutional multi-seat license and clinical quotas actively provisioned.'}
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-4">
            <div className="text-sm-end">
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Institutional Cycle Fee
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                ৳ {Number(sub?.current_price || sub?.plan?.price_monthly || 3500).toLocaleString()}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                  {' '}/ {sub?.billing_cycle || 'monthly'}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="hosp-sub-btn-primary"
              >
                <Zap size={14} />
                <span>Change Tier</span>
              </button>
              {sub?.status === 'active' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="hosp-sub-btn-danger"
                >
                  Cancel Plan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. CAPACITY & KPI METRIC DECK ─── */}
      <div className="hosp-sub-kpi-grid">
        {/* Doctor Seats Utilization */}
        <div className="hosp-sub-kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Doctor Seats
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                {seatAllocation.allocated_seats || 0} / {seatAllocation.is_unlimited ? '∞ Unlimited' : seatAllocation.total_seats_limit || 0}
              </div>
            </div>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb'
              }}
            >
              <Users size={18} />
            </div>
          </div>

          <div className="hosp-sub-progress-track">
            <div
              className={`hosp-sub-progress-bar ${seatProgressColor}`}
              style={{ width: `${Math.min(100, seatPct)}%` }}
            />
          </div>

          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
            <span>{seatPct}% roster allocated</span>
            <span style={{ fontWeight: 700, color: seatAllocation.can_allocate_more ? '#059669' : '#d97706' }}>
              {seatAllocation.can_allocate_more
                ? `${(seatAllocation.total_seats_limit || 0) - (seatAllocation.allocated_seats || 0)} seats free`
                : 'Quota reached'}
            </span>
          </div>
        </div>

        {/* OPD Ticket Quota */}
        {usages.find(u => u.key === 'opd_tickets' || u.key === 'tickets') ? (
          (() => {
            const u = usages.find(item => item.key === 'opd_tickets' || item.key === 'tickets')
            const color = u.status === 'critical' ? 'rose' : u.status === 'warning' ? 'amber' : 'emerald'
            return (
              <div className="hosp-sub-kpi-card" key="opd">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                      OPD Daily Tickets
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                      {u.used} / {u.limit}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#059669'
                    }}
                  >
                    <Activity size={18} />
                  </div>
                </div>

                <div className="hosp-sub-progress-track">
                  <div
                    className={`hosp-sub-progress-bar ${color}`}
                    style={{ width: `${Math.min(100, u.percentage || 0)}%` }}
                  />
                </div>

                <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
                  <span>Run-rate projection</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>
                    ~{u.forecast?.forecasted_usage || u.used} end-cycle
                  </span>
                </div>
              </div>
            )
          })()
        ) : (
          <div className="hosp-sub-kpi-card">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                  Hospital Units
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                  Active Facility
                </div>
              </div>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: '#4f46e5'
                }}
              >
                <Building2 size={18} />
              </div>
            </div>
            <div className="text-muted mt-3" style={{ fontSize: '12px' }}>
              Registered with full institutional modules.
            </div>
          </div>
        )}

        {/* Waiting Lounge TV Screens */}
        <div className="hosp-sub-kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Lounge TV Displays
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                Multi-Screen Quota
              </div>
            </div>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(147, 51, 234, 0.1)',
                color: '#9333ea'
              }}
            >
              <Monitor size={18} />
            </div>
          </div>

          <div className="hosp-sub-progress-track">
            <div className="hosp-sub-progress-bar blue" style={{ width: '45%' }} />
          </div>

          <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '11px', color: '#64748b' }}>
            <span>Queue Display Boards</span>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>Included in Tier</span>
          </div>
        </div>

        {/* Institutional Billing Cycle */}
        <div className="hosp-sub-kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                Billing Cycle
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0', textTransform: 'capitalize' }}>
                {sub?.billing_cycle || 'Monthly'}
              </div>
            </div>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#d97706'
              }}
            >
              <Calendar size={18} />
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3" style={{ fontSize: '12px', color: '#64748b' }}>
            <span>Next Invoice Due:</span>
            <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
              {sub?.current_period_ends_at ? new Date(sub.current_period_ends_at).toLocaleDateString() : 'Auto-renewing'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. AFFILIATED DOCTOR SEATS ROSTER & ALLOCATION MANAGER ─── */}
      <div className="hosp-sub-card">
        <div className="hosp-sub-card-header">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                padding: '10px',
                borderRadius: '12px',
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563eb'
              }}
            >
              <Users size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                Affiliated Doctor Seats Roster
              </h3>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                Manage practitioner licenses actively practicing under your facility's institutional tier quota.
              </p>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search roster..."
                style={{
                  paddingLeft: '34px',
                  paddingRight: '12px',
                  paddingTop: '8px',
                  paddingBottom: '8px',
                  fontSize: '12px',
                  background: 'var(--admin-bg, #f8fafc)',
                  border: '1px solid var(--admin-border, #e2e8f0)',
                  borderRadius: '10px',
                  outline: 'none',
                  minWidth: '200px'
                }}
              />
            </div>

            {/* Allocate Seat Button */}
            <button
              onClick={() => setShowAllocateModal(true)}
              disabled={!seatAllocation.can_allocate_more}
              className="hosp-sub-btn-primary"
              title={!seatAllocation.can_allocate_more ? 'Doctor seat quota limit reached' : 'Assign seat to a doctor'}
            >
              <UserPlus size={14} />
              <span>Allocate Doctor Seat</span>
            </button>
          </div>
        </div>

        {/* Limit Warning Banner */}
        {!seatAllocation.can_allocate_more && (
          <div className="hosp-sub-banner warning mb-4" style={{ padding: '12px 16px' }}>
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <span style={{ fontSize: '12.5px' }}>
                <strong>Doctor seat allocation quota reached ({seatAllocation.allocated_seats}/{seatAllocation.total_seats_limit}).</strong> Upgrade your institutional plan for higher practitioner capacity.
              </span>
            </div>
            <button
              onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', border: 'none', fontWeight: 800, textDecoration: 'underline', color: 'inherit', cursor: 'pointer' }}
            >
              Upgrade Tier
            </button>
          </div>
        )}

        {/* Doctor Roster Table */}
        <div className="hosp-sub-table-wrapper">
          <table className="hosp-sub-table">
            <thead>
              <tr>
                <th>Doctor</th>
                <th>Specialty & Degree</th>
                <th>Contact</th>
                <th>Seat Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <Users size={38} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-text, #334155)' }}>
                        {allocatedDoctors.length === 0
                          ? 'No doctors currently assigned to this hospital quota'
                          : 'No doctors match your search query'}
                      </div>
                      <div style={{ fontSize: '12px', marginTop: '4px' }}>
                        {allocatedDoctors.length === 0
                          ? 'Click "Allocate Doctor Seat" above to assign a practitioner to your facility.'
                          : 'Try adjusting the search filter.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDoctors.map(doc => {
                  const initials = doc.name
                    ? doc.name.replace(/^(Dr\.|Prof\.|Assoc\.|Asst\.)\s+/i, '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    : 'DR'

                  return (
                    <tr key={doc.id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="hosp-sub-avatar">
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                              {doc.name}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              Doctor ID: #{doc.id} {doc.bmdc_number ? `• BMDC: ${doc.bmdc_number}` : ''}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {doc.specialty?.name || 'General Physician'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          {doc.degree || 'MBBS'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px' }}>
                          {doc.phone || 'No phone'}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                          {doc.email || 'No email registered'}
                        </div>
                      </td>
                      <td>
                        <span className="hosp-sub-badge-status active">
                          <span className="hosp-sub-dot" style={{ background: '#10b981' }} />
                          Allocated
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setDoctorToRevoke(doc)}
                          className="hosp-sub-btn-danger"
                          title="Revoke doctor license seat"
                        >
                          <UserMinus size={13} />
                          <span>Revoke</span>
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. INSTITUTIONAL USAGE GAUGES & FORECASTING ─── */}
      {usages.length > 0 && (
        <div className="hosp-sub-card">
          <div className="pb-3 mb-4" style={{ borderBottom: '1px solid var(--admin-border, #e2e8f0)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              Institutional Quota Consumption & Forecasting
            </h3>
            <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
              Live capacity monitoring, threshold warnings, and end-of-cycle run-rate projections.
            </p>
          </div>

          <div className="row g-3">
            {usages.map((usage) => {
              const color = usage.status === 'critical' ? 'rose' : usage.status === 'warning' ? 'amber' : 'blue'
              return (
                <div key={usage.key} className="col-12 col-sm-6 col-lg-3">
                  <div
                    style={{
                      padding: '18px',
                      borderRadius: '16px',
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-card-bg, #ffffff)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{usage.title}</span>
                        <span style={{ fontSize: '13px', fontWeight: 800 }}>
                          {usage.used} / {usage.limit}
                        </span>
                      </div>

                      <div className="hosp-sub-progress-track">
                        <div
                          className={`hosp-sub-progress-bar ${color}`}
                          style={{ width: `${Math.min(100, usage.percentage || 0)}%` }}
                        />
                      </div>

                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                        {usage.description}
                      </div>
                    </div>

                    <div
                      className="d-flex justify-content-between align-items-center pt-2 mt-3"
                      style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)', fontSize: '11px' }}
                    >
                      <span style={{ color: '#94a3b8' }}>Forecast Run-Rate:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: usage.forecast?.projected_status === 'will_exceed' ? '#dc2626' :
                                 usage.forecast?.projected_status === 'warning'     ? '#d97706' : '#059669'
                        }}
                      >
                        ~{usage.forecast?.forecasted_usage || usage.used} projected
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ─── 6. HOSPITAL INSTITUTIONAL TIERS MATRIX & PRICING ─── */}
      <div id="pricing-plans-section" className="hosp-sub-card">
        <div className="hosp-sub-card-header">
          <div>
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={20} style={{ color: '#2563eb' }} />
              <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0, letterSpacing: '-0.3px' }}>
                Hospital Institutional Tiers
              </h3>
            </div>
            <p className="text-muted" style={{ fontSize: '13px', margin: '3px 0 0 0' }}>
              Select an enterprise clinical capacity tier tailored for medical clinics, multi-specialty centers, and hospital networks.
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="hosp-sub-cycle-toggle">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`hosp-sub-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`hosp-sub-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            >
              <span>Annual Billing</span>
              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#059669',
                  fontWeight: 800,
                  textTransform: 'uppercase'
                }}
              >
                Save ~20%
              </span>
            </button>
          </div>
        </div>

        <div className="hosp-sub-pricing-grid">
          {plans.map(plan => {
            const isCurrent = sub?.plan?.id === plan.id
            const displayPrice = billingCycle === 'annual' ? plan.price_annual : plan.price_monthly

            return (
              <div
                key={plan.id}
                className={`hosp-sub-plan-card ${plan.is_most_popular ? 'popular' : ''} ${isCurrent ? 'current' : ''}`}
              >
                {plan.is_most_popular && (
                  <div className="hosp-sub-badge-popular">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="hosp-sub-badge-tier">
                      {plan.tier} Tier
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> Active Plan
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0' }}>
                    {plan.name}
                  </h4>
                  <p className="text-muted" style={{ fontSize: '12.5px', minHeight: '38px', margin: 0, lineHeight: 1.5 }}>
                    {plan.description}
                  </p>

                  <div style={{ margin: '20px 0' }}>
                    <div className="d-flex align-items-baseline gap-1">
                      <span style={{ fontSize: '30px', fontWeight: 900, letterSpacing: '-0.5px' }}>
                        ৳ {Number(displayPrice).toLocaleString()}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                        / {billingCycle}
                      </span>
                    </div>
                    {billingCycle === 'annual' && plan.annual_savings_amount > 0 && (
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} />
                        <span>Save ৳{Number(plan.annual_savings_amount).toLocaleString()} annually</span>
                      </div>
                    )}
                  </div>

                  {/* Feature Checklist */}
                  <div style={{ paddingTop: '16px', borderTop: '1px solid var(--admin-border, #e2e8f0)', fontSize: '12.5px' }}>
                    <div className="d-flex flex-column gap-2">
                      {plan.features?.map((f, idx) => (
                        <div key={idx} className="d-flex align-items-start gap-2">
                          {f.is_enabled ? (
                            <Check size={14} style={{ color: '#059669', flexShrink: 0, marginTop: '2px' }} />
                          ) : (
                            <X size={14} style={{ color: '#cbd5e1', flexShrink: 0, marginTop: '2px' }} />
                          )}
                          <span style={{ color: f.is_enabled ? 'var(--admin-text, #334155)' : '#94a3b8', textDecoration: f.is_enabled ? 'none' : 'line-through' }}>
                            {f.feature_name} {f.is_enabled && !f.is_unlimited && `(${f.quota_limit} quota)`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ paddingTop: '20px', marginTop: '20px', borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
                  {isCurrent ? (
                    <button
                      disabled
                      className="w-100"
                      style={{
                        padding: '11px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        color: '#059669',
                        fontWeight: 700,
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        cursor: 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <CheckCircle2 size={14} />
                      <span>Active Institutional Tier</span>
                    </button>
                  ) : overview?.is_checkout_locked ? (
                    <button
                      disabled
                      title="Plan changes are locked while your payment is under verification"
                      className="w-100"
                      style={{
                        padding: '11px',
                        background: 'var(--admin-bg, #f1f5f9)',
                        border: '1px solid var(--admin-border, #e2e8f0)',
                        color: '#94a3b8',
                        fontWeight: 700,
                        borderRadius: '12px',
                        fontSize: '12.5px',
                        cursor: 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Lock size={13} />
                      <span>Payment Under Verification</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProceedToCheckout(plan)}
                      className="hosp-sub-btn-primary w-100"
                    >
                      <Zap size={14} />
                      <span>Proceed to Checkout</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 7. ENTERPRISE CONCIERGE & INVOICES ─── */}
      <div className="row g-4">
        {/* Enterprise Concierge Card */}
        <div className="col-12 col-lg-4">
          <div className="hosp-sub-concierge h-100">
            <div>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  width: 'fit-content',
                  marginBottom: '16px'
                }}
              >
                <Headphones size={24} style={{ color: '#93c5fd' }} />
              </div>
              <h4 style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.3px', margin: '0 0 10px 0' }}>
                Enterprise Concierge & Offline Settlement
              </h4>
              <p style={{ fontSize: '12.5px', color: '#bfdbfe', lineHeight: 1.6, margin: 0 }}>
                Require custom institutional service agreements, multi-facility billing, or corporate bank wire reconciliations? Our account managers are at your service.
              </p>
            </div>

            <div style={{ paddingTop: '20px', marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div className="d-flex flex-column gap-3" style={{ fontSize: '12.5px', color: '#dbeafe' }}>
                <div className="d-flex align-items-center gap-2">
                  <PhoneCall size={15} style={{ color: '#93c5fd' }} />
                  <span style={{ fontWeight: 600 }}>Priority Hotline: +880 1711 000 000</span>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Mail size={15} style={{ color: '#93c5fd' }} />
                  <span style={{ fontWeight: 600 }}>institutional-billing@medconnect.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="col-12 col-lg-8">
          <div className="hosp-sub-card h-100 mb-0">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-3" style={{ borderBottom: '1px solid var(--admin-border, #e2e8f0)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} style={{ color: '#2563eb' }} />
                <span>Institutional Billing Invoices</span>
              </h3>
              <span className="text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>
                {invoices.length} Total Recorded
              </span>
            </div>

            {invoices.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No previous invoices recorded for this hospital facility account.
              </div>
            ) : (
              <div className="hosp-sub-table-wrapper">
                <table className="hosp-sub-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Issue Date</th>
                      <th>Total Amount</th>
                      <th>Payment Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {inv.invoice_number}
                        </td>
                        <td className="text-muted" style={{ fontSize: '12px' }}>
                          {inv.issue_date}
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          ৳ {Number(inv.total_amount).toLocaleString()}
                        </td>
                        <td>
                          <span className={`hosp-sub-badge-status ${inv.status === 'paid' ? 'active' : 'grace'}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="d-flex align-items-center justify-content-end gap-1">
                            <button
                              onClick={() => handleEmailInvoice(inv.id, inv.invoice_number)}
                              disabled={emailingInvoiceId === inv.id}
                              className="hosp-sub-btn-secondary"
                              style={{ padding: '5px 8px' }}
                              title="Email invoice receipt"
                            >
                              <Mail size={14} className={emailingInvoiceId === inv.id ? 'animate-spin' : ''} />
                            </button>
                            <button
                              onClick={handlePrintInvoice}
                              className="hosp-sub-btn-secondary"
                              style={{ padding: '5px 8px' }}
                              title="Print / Save PDF"
                            >
                              <Printer size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 8. DOCTOR SEAT ALLOCATION MODAL (WITH LIVE SEARCH) ─── */}
      {showAllocateModal && (
        <div className="hosp-sub-modal-backdrop">
          <div className="hosp-sub-modal hosp-sub-fade-in">
            <div className="d-flex justify-content-between align-items-start pb-3 mb-3" style={{ borderBottom: '1px solid var(--admin-border, #e2e8f0)' }}>
              <div className="d-flex align-items-center gap-2">
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    color: '#2563eb'
                  }}
                >
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                    Allocate Doctor License Seat
                  </h3>
                  <p className="text-muted" style={{ fontSize: '12px', margin: '2px 0 0 0' }}>
                    Assign a practitioner to practice under your institutional quota.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllocateModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAllocateDoctor}>
              {/* Doctor Search input */}
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  Search Registered Doctor (Name / Specialty)
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="Type doctor's name or specialty..."
                    value={doctorSearchQuery}
                    onChange={(e) => setDoctorSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      paddingLeft: '34px',
                      paddingRight: '12px',
                      paddingTop: '9px',
                      paddingBottom: '9px',
                      fontSize: '13px',
                      borderRadius: '10px',
                      border: '1px solid var(--admin-border, #e2e8f0)',
                      background: 'var(--admin-bg, #f8fafc)',
                      outline: 'none'
                    }}
                  />
                  {searchingDoctors && (
                    <RefreshCw size={13} className="animate-spin" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#2563eb' }} />
                  )}
                </div>

                {/* Suggestions List */}
                {doctorSearchResults.length > 0 && (
                  <div className="hosp-sub-doc-suggestions">
                    {doctorSearchResults.map(doc => (
                      <div
                        key={doc.id}
                        className="hosp-sub-doc-item"
                        onClick={() => handleSelectDoctorFromSearch(doc)}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '12.5px' }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {doc.specialty?.name || 'General'} • ID: #{doc.id}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="hosp-sub-btn-secondary"
                          style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700 }}
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor ID input */}
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  Or Directly Enter Doctor ID
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 104"
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid var(--admin-border, #e2e8f0)',
                    background: 'var(--admin-bg, #f8fafc)',
                    outline: 'none'
                  }}
                />
              </div>

              <div
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(37, 99, 235, 0.08)',
                  border: '1px solid rgba(37, 99, 235, 0.2)',
                  fontSize: '12px',
                  color: '#1e40af',
                  marginBottom: '20px'
                }}
              >
                Allocating a seat grants the practitioner full chamber scheduling, patient queue boards, and clinical prescription quotas within your hospital facility.
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="hosp-sub-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={allocatingSeat || !newDoctorId}
                  className="hosp-sub-btn-primary"
                >
                  <UserPlus size={14} />
                  <span>{allocatingSeat ? 'Assigning...' : 'Confirm Allocation'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 9. REVOKE DOCTOR SEAT CONFIRMATION MODAL ─── */}
      {doctorToRevoke && (
        <div className="hosp-sub-modal-backdrop">
          <div className="hosp-sub-modal hosp-sub-fade-in">
            <div className="d-flex align-items-center gap-2 mb-3" style={{ color: '#dc2626' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                Revoke Doctor Seat
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              Are you sure you want to revoke the facility license seat for <strong>Dr. {doctorToRevoke.name}</strong> (Doctor ID #{doctorToRevoke.id})? This will unbind their access to this hospital's quota and free up 1 seat on your roster.
            </p>

            <div className="d-flex justify-content-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
              <button
                type="button"
                onClick={() => setDoctorToRevoke(null)}
                className="hosp-sub-btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeDoctor}
                disabled={revokingSeat}
                className="hosp-sub-btn-danger"
              >
                <UserMinus size={14} />
                <span>{revokingSeat ? 'Revoking...' : 'Revoke License'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 10. SUBSCRIPTION CANCELLATION MODAL ─── */}
      {showCancelModal && (
        <div className="hosp-sub-modal-backdrop">
          <div className="hosp-sub-modal hosp-sub-fade-in">
            <div className="d-flex align-items-center gap-2 mb-3" style={{ color: '#dc2626' }}>
              <div
                style={{
                  padding: '8px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#dc2626'
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--admin-text, #0f172a)' }}>
                Cancel Hospital Subscription
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              Are you sure you want to cancel your hospital facility subscription? Your institutional features, affiliated doctor seats, and OPD queues will remain active until the end of your current billing cycle on{' '}
              <strong>{sub?.current_period_ends_at ? new Date(sub.current_period_ends_at).toLocaleDateString() : 'the cycle end'}</strong>.
            </p>

            <div className="d-flex justify-content-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="hosp-sub-btn-secondary"
              >
                Keep Subscription
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelSub}
                disabled={cancellingSub}
                className="hosp-sub-btn-danger"
              >
                {cancellingSub ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 11. LIFECYCLE TIMELINE DRAWER ─── */}
      {showTimeline && (
        <div className="hosp-sub-drawer-backdrop" onClick={() => setShowTimeline(false)}>
          <div className="hosp-sub-drawer hosp-sub-fade-in" onClick={e => e.stopPropagation()}>
            <div className="hosp-sub-drawer-header">
              <div className="d-flex align-items-center gap-2">
                <Activity size={18} style={{ color: '#2563eb' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>
                  Subscription Lifecycle Timeline
                </h3>
              </div>
              <button
                onClick={() => setShowTimeline(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="hosp-sub-drawer-body">
              <div className="d-flex flex-column gap-3">
                {timeline.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '48px 0' }}>
                    No lifecycle events recorded for this subscription yet.
                  </div>
                ) : (
                  timeline.map((event) => (
                    <div key={event.id} className="hosp-sub-timeline-item">
                      <div className="hosp-sub-timeline-dot" />
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                        {event.title}
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.5 }}>
                        {event.description}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{new Date(event.occurred_at).toLocaleString()}</span>
                        <span>•</span>
                        <span>By: {event.performed_by}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
