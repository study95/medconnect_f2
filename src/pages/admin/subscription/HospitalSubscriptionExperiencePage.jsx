// HospitalSubscriptionExperiencePage.jsx — Phase 4.2, 4.4 & Phase 6 Enterprise Hospital Subscription & Capacity Experience
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getHospitalBillingOverview,
  getHospitalAvailablePlans,
  previewHospitalPlanChange,
  cancelHospitalBillingSubscription,
  allocateHospitalDoctorSeat,
  revokeHospitalDoctorSeat,
  emailHospitalInvoice,
  getHospitalSeatSummary,
  getHospitalAllocatedDoctors,
  getHospitalSeatInvitations,
  sendHospitalDoctorInvitation,
  cancelHospitalDoctorInvitation,
  revokeHospitalDoctorSeatRecord,
  getHospitalSeatHistory
} from '../../../api/subscriptionApi'
import { getDoctors } from '../../../api/doctorApi'
import {
  Building2, Users, Check, AlertTriangle, Clock, Zap, Shield,
  RefreshCw, Lock, FileText, Calendar, Info, AlertCircle,
  CheckCircle2, ChevronRight, X, UserPlus, UserMinus, Monitor,
  Activity, PhoneCall, Mail, Headphones, History, Search,
  Printer, Sparkles, Send, UserCheck, XCircle, Tag, CheckCircle
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

  // Doctor Seat Management states (Phase 6)
  const [seatSummary, setSeatSummary] = useState(null)
  const [seatTab, setSeatTab] = useState('roster') // 'roster' | 'invitations' | 'history'
  const [invitations, setInvitations] = useState([])
  const [invitationsFilter, setInvitationsFilter] = useState('all')
  const [invitationNotes, setInvitationNotes] = useState('')
  const [cancellingInvitationId, setCancellingInvitationId] = useState(null)
  const [seatHistory, setSeatHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [liveAllocatedDoctors, setLiveAllocatedDoctors] = useState(null)

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

      const [overviewRes, plansRes, summaryRes, invitationsRes, allocatedDocsRes] = await Promise.all([
        getHospitalBillingOverview(),
        getHospitalAvailablePlans(),
        getHospitalSeatSummary().catch(() => null),
        getHospitalSeatInvitations().catch(() => null),
        getHospitalAllocatedDoctors().catch(() => null)
      ])
      setOverview(overviewRes.data)
      setPlans(plansRes.data || [])

      if (summaryRes?.data?.summary) {
        setSeatSummary(summaryRes.data.summary)
      }
      if (invitationsRes?.data) {
        const invList = Array.isArray(invitationsRes.data?.data)
          ? invitationsRes.data.data
          : (Array.isArray(invitationsRes.data) ? invitationsRes.data : [])
        setInvitations(invList)
      }
      if (allocatedDocsRes?.data) {
        setLiveAllocatedDoctors(Array.isArray(allocatedDocsRes.data) ? allocatedDocsRes.data : null)
      }
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

  const loadSeatHistory = async () => {
    try {
      setLoadingHistory(true)
      const res = await getHospitalSeatHistory({ per_page: 30 })
      const historyList = Array.isArray(res?.data?.data)
        ? res.data.data
        : (Array.isArray(res?.data) ? res.data : [])
      setSeatHistory(historyList)
    } catch (err) {
      console.error('Failed to load seat history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (seatTab === 'history') {
      loadSeatHistory()
    }
  }, [seatTab])

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

  // Phase 6: Official Seat Invitation
  const handleSendDoctorInvitation = async (e) => {
    if (e) e.preventDefault()
    if (!newDoctorId) return
    try {
      setAllocatingSeat(true)
      const res = await sendHospitalDoctorInvitation({
        doctor_id: Number(newDoctorId),
        notes: invitationNotes.trim() || undefined
      })
      setActionFeedback({
        type: 'success',
        text: res.message || `Official invitation sent to Doctor ID #${newDoctorId}! Seat reserved.`
      })
      setNewDoctorId('')
      setDoctorSearchQuery('')
      setDoctorSearchResults([])
      setInvitationNotes('')
      setShowAllocateModal(false)
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to send doctor seat invitation. Please check doctor eligibility.'
      })
    } finally {
      setAllocatingSeat(false)
    }
  }

  // Phase 6: Cancel Pending Invitation
  const handleCancelInvitation = async (invitationId) => {
    try {
      setCancellingInvitationId(invitationId)
      await cancelHospitalDoctorInvitation(invitationId)
      setActionFeedback({
        type: 'info',
        text: 'Doctor seat invitation cancelled successfully. Reserved quota restored.'
      })
      loadData(true)
    } catch (err) {
      setActionFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to cancel invitation.'
      })
    } finally {
      setCancellingInvitationId(null)
    }
  }

  const handleSelectDoctorFromSearch = (doc) => {
    setNewDoctorId(String(doc.id))
    setDoctorSearchQuery(`${doc.name} (ID: #${doc.id})`)
    setDoctorSearchResults([])
  }

  // Phase 6: Revoke Doctor Seat with Mandatory Audit Reason
  const handleConfirmRevokeDoctor = async () => {
    if (!doctorToRevoke) return
    if (!revokeReason.trim() || revokeReason.trim().length < 3) {
      setActionFeedback({
        type: 'error',
        text: 'A mandatory audit reason of at least 3 characters is required to revoke a seat.'
      })
      return
    }
    try {
      setRevokingSeat(true)
      await revokeHospitalDoctorSeatRecord({
        doctor_id: doctorToRevoke.id,
        reason: revokeReason.trim()
      })
      setActionFeedback({
        type: 'info',
        text: `Doctor seat for Dr. ${doctorToRevoke.name} has been revoked and recorded in audit trail.`
      })
      setDoctorToRevoke(null)
      setRevokeReason('')
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
          সক্রিয় ফ্যাসিলিটি প্ল্যান
        </span>
      )
    }
    if (s === 'trialing') {
      return (
        <span className="hosp-sub-badge-status trialing">
          <span className="hosp-sub-dot pulse" style={{ background: '#2563eb' }} />
          ফ্রি ট্রায়াল
        </span>
      )
    }
    if (s === 'grace_period') {
      return (
        <span className="hosp-sub-badge-status grace">
          <span className="hosp-sub-dot pulse" style={{ background: '#f59e0b' }} />
          গ্রেস পিরিয়ড
        </span>
      )
    }
    return (
      <span className="hosp-sub-badge-status expired">
        <span className="hosp-sub-dot" style={{ background: '#ef4444' }} />
        {s === 'cancelled' ? 'বাতিলকৃত' : s === 'expired' ? 'মেয়াদোত্তীর্ণ' : s.toUpperCase()}
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
  const seatAllocation = seatSummary || overview?.seat_allocation || {}
  const allocatedDoctors = liveAllocatedDoctors || overview?.allocated_doctors || []
  const usages = overview?.usages || []
  const invoices = overview?.invoices || []
  const pendingRequest = overview?.pending_request
  const timeline = overview?.timeline || []

  // Capacity metrics derived from backend API (Single Source of Truth)
  const totalSeats = seatAllocation.total_seats ?? seatAllocation.total_seats_limit ?? 0
  const allocatedSeats = seatAllocation.allocated_seats ?? allocatedDoctors.length
  const pendingSeats = seatAllocation.pending_invitations ?? 0
  const availableSeats = seatAllocation.available_seats ?? (seatAllocation.is_unlimited ? 999 : Math.max(0, totalSeats - allocatedSeats - pendingSeats))
  const canAllocateMore = seatAllocation.can_allocate_more ?? (seatAllocation.is_unlimited || availableSeats > 0)
  const isUnlimitedSeats = seatAllocation.is_unlimited ?? false
  const seatPct = seatAllocation.utilization_pct ?? (totalSeats > 0 ? Math.round(((allocatedSeats + pendingSeats) / totalSeats) * 100) : 0)
  const seatProgressColor = seatPct >= 90 ? 'rose' : seatPct >= 70 ? 'amber' : 'emerald'

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

  // Filter invitations based on tab filter & search
  const filteredInvitations = invitations.filter(inv => {
    if (invitationsFilter !== 'all' && inv.status !== invitationsFilter) return false
    if (!doctorSearch.trim()) return true
    const q = doctorSearch.toLowerCase()
    return (
      inv.doctor?.name?.toLowerCase().includes(q) ||
      inv.doctor?.specialty?.name?.toLowerCase().includes(q) ||
      String(inv.doctor_id).includes(q) ||
      inv.invited_by_user?.name?.toLowerCase().includes(q)
    )
  })

  const pendingInvitationsCount = invitations.filter(i => i.status === 'pending').length

  return (
    <div className="hosp-sub-container hosp-sub-fade-in">
      {/* ─── PAGE HEADER & CONTROLS ─── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            <span>ড্যাশবোর্ড</span>
            <ChevronRight size={13} />
            <span style={{ color: '#2563eb', fontWeight: 700 }}>হাসপাতাল সাবস্ক্রিপশন ও ক্যাপাসিটি</span>
          </div>
          <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
            <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, letterSpacing: '-0.4px' }}>
              হাসপাতাল সাবস্ক্রিপশন ও ক্যাপাসিটি ব্যবস্থাপনা
            </h1>
            <span className="hosp-sub-badge-tier">
              প্রাতিষ্ঠানিক
            </span>
          </div>
          <p className="text-muted" style={{ fontSize: '13px', margin: '4px 0 0 0' }}>
            {hospital?.name || 'হাসপাতাল ক্লিনিক্যাল ফ্যাসিলিটি'} • লাইসেন্স #{hospital?.license_number || 'প্রযোজ্য নয়'} • মাল্টি-ডাক্তার কোটা ও সুবিধা
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('/admin/subscription/history')}
            className="hosp-sub-btn-secondary"
            title="প্রাতিষ্ঠানিক সাবস্ক্রিপশন ও পেমেন্ট হিস্ট্রি দেখুন"
          >
            <History size={15} style={{ color: '#2563eb' }} />
            <span>সাবস্ক্রিপশন হিস্ট্রি</span>
          </button>

          {timeline.length > 0 && (
            <button
              onClick={() => setShowTimeline(true)}
              className="hosp-sub-btn-secondary"
              title="লাইফসাইকেল ইভেন্ট টাইমলাইন দেখুন"
            >
              <Activity size={15} style={{ color: '#2563eb' }} />
              <span>লাইফসাইকেল টাইমলাইন ({timeline.length})</span>
            </button>
          )}

          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="hosp-sub-btn-secondary"
            title="সাবস্ক্রিপশন ও কোটার স্থিতি সিঙ্ক করুন"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} style={{ color: '#2563eb' }} />
            <span>{refreshing ? 'সিঙ্ক হচ্ছে...' : 'সিঙ্ক করুন'}</span>
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
                পেমেন্ট ভেরিফিকেশন অ্যাডমিন পর্যালোচনায় রয়েছে
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                {overview.lock_reason || 'আপনার প্রাতিষ্ঠানিক ম্যানুয়াল পেমেন্ট গৃহীত হয়েছে এবং বর্তমানে যাচাই চলছে। ট্রানজ্যাকশন অনুমোদিত হলে প্ল্যানটি স্বয়ংক্রিয়ভাবে সক্রিয় হবে।'}
              </div>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => navigate('/admin/subscription/history')}
              className="hosp-sub-btn-secondary"
              style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}
            >
              হিস্ট্রিতে দেখুন
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
              পর্যালোচনায়
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
            রিনিউয়াল পরিচালনা করুন
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
                প্রাতিষ্ঠানিক প্ল্যান পরিবর্তনের অনুরোধ অপেক্ষমাণ
              </div>
              <div style={{ fontSize: '12.5px', opacity: 0.95, marginTop: '2px' }}>
                অনুরোধকৃত প্ল্যান: <strong>{pendingRequest.target_plan}</strong> ({pendingRequest.target_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}), সমন্বিত ব্যালেন্স: ৳{Number(pendingRequest.amount_due).toLocaleString()}। অ্যাডমিন যাচাইয়ের পর কার্যকর হবে।
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
            অনুমোদনের অপেক্ষায়
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
                {sub?.plan?.tier_bn || sub?.plan?.tier || 'হাসপাতাল স্টার্টার'} টায়ার
              </span>
              {renderStatusBadge(sub?.status)}
            </div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '6px 0 4px 0', letterSpacing: '-0.4px' }}>
              {sub?.plan?.name_bn || sub?.plan?.name || 'হাসপাতাল ক্লিনিক্যাল ফ্যাসিলিটি প্ল্যান'}
            </h2>
            <p className="text-muted" style={{ fontSize: '13.5px', margin: 0, maxWidth: '640px' }}>
              {sub?.current_period_ends_at
                ? `${new Date(sub.current_period_ends_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })} পর্যন্ত বর্তমান প্রাতিষ্ঠানিক সাবস্ক্রিপশন মেয়াদ সক্রিয় রয়েছে।`
                : 'প্রাতিষ্ঠানিক মাল্টি-সিট লাইসেন্স এবং ক্লিনিক্যাল কোটা সক্রিয় রয়েছে।'}
            </p>
          </div>

          <div className="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-4">
            <div className="text-sm-end">
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                প্রাতিষ্ঠানিক সাইকেল ফি
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: 'var(--admin-text, #0f172a)' }}>
                ৳ {Number(sub?.current_price || sub?.plan?.price_monthly || 3500).toLocaleString()}
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>
                  {' '}/ {sub?.billing_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              <button
                onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="hosp-sub-btn-primary"
              >
                <Zap size={14} />
                <span>প্ল্যান পরিবর্তন</span>
              </button>
              {sub?.status === 'active' && (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="hosp-sub-btn-danger"
                >
                  প্ল্যান বাতিল
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. CAPACITY & KPI METRIC DECK ─── */}
      <div className="hosp-sub-kpi-grid">
        {/* Doctor Seats Utilization (Phase 6) */}
        <div className="hosp-sub-kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                ডাক্তার সিট কোটা
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                {allocatedSeats} জন সক্রিয় {pendingSeats > 0 && <span style={{ fontSize: '13px', fontWeight: 600, color: '#d97706' }}>(+{pendingSeats} সংরক্ষিত)</span>} / {isUnlimitedSeats ? '∞ আনলিমিটেড' : totalSeats}
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
            <span>{seatPct}% কোটা বরাদ্দকৃত</span>
            <span style={{ fontWeight: 700, color: canAllocateMore ? '#059669' : '#d97706' }}>
              {canAllocateMore
                ? (isUnlimitedSeats ? 'আনলিমিটেড' : `${availableSeats}টি সিট খালি আছে`)
                : 'কোটা পূর্ণ হয়েছে'}
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
                      দৈনিক ওপিডি টিকিট
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
                  <span>রান-রেট প্রক্ষেপণ</span>
                  <span style={{ fontWeight: 700, color: '#059669' }}>
                    ~{u.forecast?.forecasted_usage || u.used} সাইকেল শেষে
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
                  হাসপাতাল ইউনিট
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                  সক্রিয় ফ্যাসিলিটি
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
              সম্পূর্ণ প্রাতিষ্ঠানিক মডিউলসহ সক্রিয় রয়েছে।
            </div>
          </div>
        )}

        {/* Waiting Lounge TV Screens */}
        <div className="hosp-sub-kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                লাউঞ্জ টিভি ডিসপ্লে
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                মাল্টি-স্ক্রিন কোটা
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
            <span>কিউ ডিসপ্লে বোর্ড</span>
            <span style={{ fontWeight: 700, color: '#2563eb' }}>প্ল্যানে অন্তর্ভুক্ত</span>
          </div>
        </div>

        {/* Institutional Billing Cycle */}
        <div className="hosp-sub-kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                বিলিং সাইকেল
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0 0 0' }}>
                {sub?.billing_cycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}
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
            <span>পরবর্তী ইনভয়েস ইস্যু:</span>
            <span style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
              {sub?.current_period_ends_at ? new Date(sub.current_period_ends_at).toLocaleDateString('bn-BD') : 'স্বয়ংক্রিয় রিনিউয়াল'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 4. HOSPITAL SEAT ALLOCATION & INVITATION WORKSPACE (PHASE 6) ─── */}
      <div className="hosp-sub-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="hosp-sub-card-header" style={{ padding: '20px 24px', borderBottom: 'none' }}>
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
                হাসপাতাল সিট বরাদ্দ ও ডাক্তারদের আমন্ত্রণ
              </h3>
              <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
                চিকিৎসকদের লাইসেন্স সিট পরিচালনা করুন, অফিশিয়াল আমন্ত্রণ পাঠান এবং অডিট ইতিহাস পর্যালোচনা করুন।
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
                placeholder={seatTab === 'invitations' ? "আমন্ত্রণ ফিল্টার করুন..." : "ডাক্তারদের খুঁজুন..."}
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

            {/* Allocate / Invite Doctor Seat Button */}
            <button
              onClick={() => setShowAllocateModal(true)}
              disabled={!canAllocateMore}
              className="hosp-sub-btn-primary"
              title={!canAllocateMore ? 'ডাক্তার সিট কোটা পূর্ণ হয়ে গেছে' : 'ডাক্তারকে সিটে আমন্ত্রণ জানান'}
            >
              <UserPlus size={14} />
              <span>ডাক্তারকে সিটে আমন্ত্রণ জানান</span>
            </button>
          </div>
        </div>

        {/* Limit Warning Banner */}
        {!canAllocateMore && (
          <div className="hosp-sub-banner warning mx-4 mb-3" style={{ padding: '12px 16px' }}>
            <div className="d-flex align-items-center gap-2">
              <AlertTriangle size={16} style={{ color: '#d97706', flexShrink: 0 }} />
              <span style={{ fontSize: '12.5px' }}>
                <strong>ডাক্তার সিট বরাদ্দের কোটা পূর্ণ হয়েছে ({allocatedSeats} জন সক্রিয় + {pendingSeats} সংরক্ষিত, মোট {totalSeats})।</strong> উচ্চতর ক্যাপাসিটির জন্য আপনার প্রাতিষ্ঠানিক প্ল্যান আপগ্রেড করুন।
              </span>
            </div>
            <button
              onClick={() => document.getElementById('pricing-plans-section')?.scrollIntoView({ behavior: 'smooth' })}
              style={{ background: 'transparent', border: 'none', fontWeight: 800, textDecoration: 'underline', color: 'inherit', cursor: 'pointer' }}
            >
              প্ল্যান আপগ্রেড করুন
            </button>
          </div>
        )}

        {/* Phase 6 Workspace Tabs Navigation */}
        <div className="hosp-sub-tabs-nav">
          <button
            type="button"
            className={`hosp-sub-tab-btn ${seatTab === 'roster' ? 'active' : ''}`}
            onClick={() => setSeatTab('roster')}
          >
            <UserCheck size={16} />
            <span>সক্রিয় ডাক্তার তালিকা</span>
            <span className="hosp-sub-tab-badge">{allocatedDoctors.length}</span>
          </button>

          <button
            type="button"
            className={`hosp-sub-tab-btn ${seatTab === 'invitations' ? 'active' : ''}`}
            onClick={() => setSeatTab('invitations')}
          >
            <Mail size={16} />
            <span>সিট আমন্ত্রণসমূহ</span>
            {pendingInvitationsCount > 0 ? (
              <span className="hosp-sub-tab-badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#d97706', fontWeight: 800 }}>
                {pendingInvitationsCount} জন অপেক্ষমাণ
              </span>
            ) : (
              <span className="hosp-sub-tab-badge">{invitations.length}</span>
            )}
          </button>

          <button
            type="button"
            className={`hosp-sub-tab-btn ${seatTab === 'history' ? 'active' : ''}`}
            onClick={() => setSeatTab('history')}
          >
            <History size={16} />
            <span>অডিট লগ ও ইতিহাস</span>
            {seatHistory.length > 0 && <span className="hosp-sub-tab-badge">{seatHistory.length}</span>}
          </button>
        </div>

        {/* TAB 1: ACTIVE PRACTICING ROSTER */}
        {seatTab === 'roster' && (
          <div className="hosp-sub-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
            <table className="hosp-sub-table">
              <thead>
                <tr>
                  <th>ডাক্তার</th>
                  <th>বিশেষজ্ঞতা ও ডিগ্রি</th>
                  <th>যোগাযোগ</th>
                  <th>সিট অবস্থা</th>
                  <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
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
                            ? 'এই হাসপাতালে এখনও কোনো ডাক্তার বরাদ্দ করা হয়নি'
                            : 'আপনার অনুসন্ধানের সাথে কোনো ডাক্তার মেলেনি'}
                        </div>
                        <div style={{ fontSize: '12px', marginTop: '4px' }}>
                          {allocatedDoctors.length === 0
                            ? 'আপনার ফ্যাসিলিটিতে ডাক্তার যুক্ত করতে উপরের "ডাক্তারকে সিটে আমন্ত্রণ জানান" বাটনে ক্লিক করুন।'
                            : 'অনুসন্ধানের ফিল্টার পরিবর্তন করে দেখুন।'}
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
                                ডাক্তার আইডি: #{doc.id} {doc.bmdc_number ? `• বিএমডিসি: ${doc.bmdc_number}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>
                            {doc.specialty?.name || 'জেনারেল ফিজিশিয়ান'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {doc.degree || 'MBBS'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '12px' }}>
                            {doc.phone || 'ফোন নম্বর নেই'}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                            {doc.email || 'ইমেইল নিবন্ধিত নেই'}
                          </div>
                        </td>
                        <td>
                          <span className="hosp-sub-badge-status active">
                            <span className="hosp-sub-dot" style={{ background: '#10b981' }} />
                            বরাদ্দকৃত সিট
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setDoctorToRevoke(doc)}
                            className="hosp-sub-btn-danger"
                            title="ডাক্তারের সিট লাইসেন্স বাতিল করুন"
                          >
                            <UserMinus size={13} />
                            <span>সিট বাতিল</span>
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: SEAT INVITATIONS CENTER */}
        {seatTab === 'invitations' && (
          <div>
            {/* Filter pills bar */}
            <div className="d-flex align-items-center justify-content-between p-3 flex-wrap gap-2" style={{ borderBottom: '1px solid var(--admin-border, #e2e8f0)', background: 'var(--admin-bg, #f8fafc)' }}>
              <div className="d-flex align-items-center gap-2">
                <Filter size={14} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>ফিল্টার অবস্থা:</span>
                {[
                  { key: 'all', label: 'সকল' },
                  { key: 'pending', label: 'অপেক্ষমাণ' },
                  { key: 'accepted', label: 'গৃহীত' },
                  { key: 'rejected', label: 'প্রত্যাখ্যাত' },
                  { key: 'cancelled', label: 'বাতিলকৃত' }
                ].map(st => (
                  <button
                    key={st.key}
                    type="button"
                    className={`hosp-sub-filter-pill ${invitationsFilter === st.key ? 'active' : ''}`}
                    onClick={() => setInvitationsFilter(st.key)}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                {invitations.length}টির মধ্যে {filteredInvitations.length}টি আমন্ত্রণ দেখানো হচ্ছে
              </div>
            </div>

            <div className="hosp-sub-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="hosp-sub-table">
                <thead>
                  <tr>
                    <th>ডাক্তার</th>
                    <th>আমন্ত্রণকারী</th>
                    <th>অ্যাসাইনমেন্ট নোট</th>
                    <th>প্রেরণের সময় / মেয়াদ</th>
                    <th>অবস্থা</th>
                    <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvitations.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                        <div className="d-flex flex-column align-items-center justify-content-center">
                          <Mail size={38} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-text, #334155)' }}>
                            ফিল্টারের সাথে মেলে এমন কোনো আমন্ত্রণ পাওয়া যায়নি
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            একটি আনুষ্ঠানিক আমন্ত্রণ পাঠাতে উপরের "ডাক্তারকে সিটে আমন্ত্রণ জানান" বাটনে ক্লিক করুন।
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredInvitations.map(inv => {
                      const status = inv.status || 'pending'
                      return (
                        <tr key={inv.id}>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                              {inv.doctor?.name || `ডাক্তার #${inv.doctor_id}`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {inv.doctor?.specialty?.name || 'জেনারেল ফিজিশিয়ান'} • আইডি: #{inv.doctor_id}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>
                              {inv.invited_by_user?.name || 'হাসপাতাল অ্যাডমিন'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {inv.invited_by_user?.email || 'সিস্টেম'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', maxWidth: '240px', wordBreak: 'break-word' }}>
                              {inv.notes || <span className="text-muted italic">নির্দিষ্ট কোনো নোট নেই</span>}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px' }}>
                              {inv.created_at ? new Date(inv.created_at).toLocaleDateString('bn-BD') : 'N/A'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {inv.expires_at ? `মেয়াদ শেষ: ${new Date(inv.expires_at).toLocaleDateString('bn-BD')}` : '৭ দিন মেয়াদ'}
                            </div>
                          </td>
                          <td>
                            {status === 'pending' && (
                              <span className="hosp-sub-badge-status pending">
                                <Clock size={11} />
                                অপেক্ষমাণ (সিট সংরক্ষিত)
                              </span>
                            )}
                            {status === 'accepted' && (
                              <span className="hosp-sub-badge-status active">
                                <Check size={11} />
                                গৃহীত
                              </span>
                            )}
                            {status === 'rejected' && (
                              <span className="hosp-sub-badge-status rejected">
                                <XCircle size={11} />
                                প্রত্যাখ্যাত
                              </span>
                            )}
                            {status === 'cancelled' && (
                              <span className="hosp-sub-badge-status cancelled">
                                <X size={11} />
                                বাতিলকৃত
                              </span>
                            )}
                            {status === 'expired' && (
                              <span className="hosp-sub-badge-status expired">
                                মেয়াদোত্তীর্ণ
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {status === 'pending' ? (
                              <button
                                type="button"
                                onClick={() => handleCancelInvitation(inv.id)}
                                disabled={cancellingInvitationId === inv.id}
                                className="hosp-sub-btn-secondary"
                                style={{ padding: '5px 12px', fontSize: '11.5px', color: '#dc2626' }}
                                title="আমন্ত্রণ বাতিল করে সংরক্ষিত কোটা মুক্ত করুন"
                              >
                                {cancellingInvitationId === inv.id ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <X size={12} />
                                )}
                                <span>বাতিল করুন</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '11px', color: '#94a3b8' }}>—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FORENSIC AUDIT LEDGER */}
        {seatTab === 'history' && (
          <div>
            <div className="d-flex align-items-center justify-content-between p-3" style={{ borderBottom: '1px solid var(--admin-border, #e2e8f0)', background: 'var(--admin-bg, #f8fafc)' }}>
              <div className="d-flex align-items-center gap-2">
                <History size={15} style={{ color: '#2563eb' }} />
                <span style={{ fontSize: '13px', fontWeight: 700 }}>অপরিবর্তনীয় সিট অডিট লগ</span>
                <span className="text-muted" style={{ fontSize: '12px' }}>• সকল সিট বরাদ্দ, প্রত্যাহার এবং লাইফসাইকেল ইভেন্ট</span>
              </div>
              <button
                type="button"
                onClick={loadSeatHistory}
                disabled={loadingHistory}
                className="hosp-sub-btn-secondary"
                style={{ padding: '4px 10px', fontSize: '11.5px' }}
              >
                <RefreshCw size={12} className={loadingHistory ? "animate-spin" : ""} />
                <span>লগ রিফ্রেশ</span>
              </button>
            </div>

            <div className="hosp-sub-table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
              <table className="hosp-sub-table">
                <thead>
                  <tr>
                    <th>ইভেন্টের ধরন</th>
                    <th>ডাক্তার</th>
                    <th>সম্পাদনকারী / অপারেটর</th>
                    <th>কারণ / অডিট নোট</th>
                    <th style={{ textAlign: 'right' }}>লগ সময়</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingHistory ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ color: '#2563eb', margin: '0 auto 8px auto' }} />
                        <div style={{ fontSize: '12.5px', color: '#64748b' }}>ফরেনসিক অডিট ট্রেইল লোড হচ্ছে...</div>
                      </td>
                    </tr>
                  ) : seatHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8' }}>
                        <div className="d-flex flex-column align-items-center justify-content-center">
                          <History size={38} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--admin-text, #334155)' }}>
                            এখনও কোনো সিট হিস্ট্রি রেকর্ড নেই
                          </div>
                          <div style={{ fontSize: '12px', marginTop: '4px' }}>
                            সিট বরাদ্দ ও প্রত্যাহারের প্রতিটি ঘটনা এখানে স্থায়ীভাবে রেকর্ড থাকবে।
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    seatHistory.map(item => {
                      const action = String(item.action || '').toUpperCase()
                      let badgeColor = '#2563eb'
                      let badgeBg = 'rgba(37, 99, 235, 0.1)'
                      if (action.includes('REVOKE')) {
                        badgeColor = '#dc2626'
                        badgeBg = 'rgba(239, 68, 68, 0.1)'
                      } else if (action.includes('ALLOCAT') || action.includes('ASSIGN') || action.includes('ACCEPT')) {
                        badgeColor = '#059669'
                        badgeBg = 'rgba(16, 185, 129, 0.1)'
                      } else if (action.includes('CANCEL')) {
                        badgeColor = '#64748b'
                        badgeBg = 'rgba(100, 116, 139, 0.1)'
                      }

                      return (
                        <tr key={item.id}>
                          <td>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: badgeBg,
                                color: badgeColor
                              }}
                            >
                              {action || 'EVENT'}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: 'var(--admin-text, #0f172a)' }}>
                              {item.doctor?.name || `ডাক্তার #${item.doctor_id}`}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              ডাক্তার আইডি: #{item.doctor_id}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', fontWeight: 600 }}>
                              {item.actor_type ? `${item.actor_type.split('\\').pop()} #${item.actor_id || ''}` : 'সিস্টেম'}
                            </div>
                          </td>
                          <td>
                            <div style={{ fontSize: '12px', maxWidth: '300px', wordBreak: 'break-word' }}>
                              {item.reason || item.notes || <span className="text-muted">—</span>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                            {item.created_at ? new Date(item.created_at).toLocaleString('bn-BD') : 'N/A'}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ─── 5. INSTITUTIONAL USAGE GAUGES & FORECASTING ─── */}
      {usages.length > 0 && (
        <div className="hosp-sub-card">
          <div className="pb-3 mb-4" style={{ borderBottom: '1px solid var(--admin-border, #e2e8f0)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
              প্রাতিষ্ঠানিক কোটা ব্যবহার ও পূর্বাভাস
            </h3>
            <p className="text-muted" style={{ fontSize: '12.5px', margin: '2px 0 0 0' }}>
              রিয়েল-টাইম ক্যাপাসিটি মনিটরিং, সতর্কবার্তা এবং সাইকেল শেষ পর্যন্ত সম্ভাব্য ব্যবহারের পূর্বাভাস।
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
                      <span style={{ color: '#94a3b8' }}>পূর্বাভাষিত রান-রেট:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          color: usage.forecast?.projected_status === 'will_exceed' ? '#dc2626' :
                                 usage.forecast?.projected_status === 'warning'     ? '#d97706' : '#059669'
                        }}
                      >
                        ~{usage.forecast?.forecasted_usage || usage.used} সম্ভাব্য
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
                হাসপাতাল প্রাতিষ্ঠানিক প্ল্যানসমূহ
              </h3>
            </div>
            <p className="text-muted" style={{ fontSize: '13px', margin: '3px 0 0 0' }}>
              ক্লিনিক, মাল্টি-স্পেশালিটি সেন্টার ও হাসপাতাল নেটওয়ার্কের জন্য উপযোগী প্রাতিষ্ঠানিক ক্যাপাসিটি প্ল্যান বেছে নিন।
            </p>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="hosp-sub-cycle-toggle">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`hosp-sub-toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
            >
              মাসিক বিলিং
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`hosp-sub-toggle-btn ${billingCycle === 'annual' ? 'active' : ''}`}
            >
              <span>বাৎসরিক বিলিং</span>
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
                ~২০% সাশ্রয়
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
                    জনপ্রিয় পছন্দ
                  </div>
                )}

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="hosp-sub-badge-tier">
                      {plan.tier_bn || plan.tier} টায়ার
                    </span>
                    {isCurrent && (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={14} /> বর্তমান সক্রিয় প্ল্যান
                      </span>
                    )}
                  </div>

                  <h4 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 4px 0' }}>
                    {plan.name_bn || plan.name}
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
                        / {billingCycle === 'annual' ? 'বাৎসরিক' : 'মাসিক'}
                      </span>
                    </div>
                    {billingCycle === 'annual' && plan.annual_savings_amount > 0 && (
                      <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={13} />
                        <span>বছরে ৳{Number(plan.annual_savings_amount).toLocaleString()} সাশ্রয়</span>
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
                            {f.feature_name} {f.is_enabled && !f.is_unlimited && `(${f.quota_limit} কোটা)`}
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
                      <span>বর্তমান সক্রিয় প্ল্যান</span>
                    </button>
                  ) : overview?.is_checkout_locked ? (
                    <button
                      disabled
                      title="পেমেন্ট যাচাইয়ের অপেক্ষায় থাকায় প্ল্যান পরিবর্তন লক রয়েছে"
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
                      <span>পেমেন্ট ভেরিফিকেশন চলছে</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleProceedToCheckout(plan)}
                      className="hosp-sub-btn-primary w-100"
                    >
                      <Zap size={14} />
                      <span>চেকআউট ও পেমেন্টে এগিয়ে যান</span>
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
                প্রাতিষ্ঠানিক কনসিয়ার্জ ও অফলাইন সেটেলমেন্ট
              </h4>
              <p style={{ fontSize: '12.5px', color: '#bfdbfe', lineHeight: 1.6, margin: 0 }}>
                কাস্টম প্রাতিষ্ঠানিক চুক্তি, একাধিক ব্রাঞ্চের বিলিং কিংবা কর্পোরেট ব্যাংক পেমেন্টের সমন্বয় প্রয়োজন? আমাদের অ্যাকাউন্ট ম্যানেজাররা প্রস্তুত আছেন।
              </p>
            </div>

            <div style={{ paddingTop: '20px', marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div className="d-flex flex-column gap-3" style={{ fontSize: '12.5px', color: '#dbeafe' }}>
                <div className="d-flex align-items-center gap-2">
                  <PhoneCall size={15} style={{ color: '#93c5fd' }} />
                  <span style={{ fontWeight: 600 }}>প্রায়োরিটি হটলাইন: +880 1711 000 000</span>
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
                <span>প্রাতিষ্ঠানিক বিলিং ইনভয়েস</span>
              </h3>
              <span className="text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>
                মোট {invoices.length}টি রেকর্ড
              </span>
            </div>

            {invoices.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                এই হাসপাতালের জন্য এখনও কোনো পূর্ববর্তী ইনভয়েস রেকর্ড নেই।
              </div>
            ) : (
              <div className="hosp-sub-table-wrapper">
                <table className="hosp-sub-table">
                  <thead>
                    <tr>
                      <th>ইনভয়েস নম্বর</th>
                      <th>ইস্যুর তারিখ</th>
                      <th>মোট পরিমাণ</th>
                      <th>পরিশোধের অবস্থা</th>
                      <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(inv => (
                      <tr key={inv.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                          {inv.invoice_number}
                        </td>
                        <td className="text-muted" style={{ fontSize: '12px' }}>
                          {new Date(inv.issue_date).toLocaleDateString('bn-BD')}
                        </td>
                        <td style={{ fontWeight: 800 }}>
                          ৳ {Number(inv.total_amount).toLocaleString()}
                        </td>
                        <td>
                          <span className={`hosp-sub-badge-status ${inv.status === 'paid' ? 'active' : 'grace'}`}>
                            {inv.status === 'paid' ? 'পরিশোধিত' : inv.status === 'pending' ? 'অপেক্ষমাণ' : inv.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div className="d-flex align-items-center justify-content-end gap-1">
                            <button
                              onClick={() => handleEmailInvoice(inv.id, inv.invoice_number)}
                              disabled={emailingInvoiceId === inv.id}
                              className="hosp-sub-btn-secondary"
                              style={{ padding: '5px 8px' }}
                              title="ইমেইলে ইনভয়েস রসিদ পাঠান"
                            >
                              <Mail size={14} className={emailingInvoiceId === inv.id ? 'animate-spin' : ''} />
                            </button>
                            <button
                              onClick={handlePrintInvoice}
                              className="hosp-sub-btn-secondary"
                              style={{ padding: '5px 8px' }}
                              title="ইনভয়েস প্রিন্ট করুন"
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

      {/* ─── 8. DOCTOR SEAT INVITATION / ALLOCATION MODAL (PHASE 6) ─── */}
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
                  <Send size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>
                    হাসপাতাল সিটে ডাক্তার আমন্ত্রণ জানান
                  </h3>
                  <p className="text-muted" style={{ fontSize: '12px', margin: '2px 0 0 0' }}>
                    আপনার প্রাতিষ্ঠানিক প্ল্যানের আওতায় ডাক্তারকে স্পন্সর করতে অফিসিয়াল সিট ইনভিটেশন পাঠান।
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

            <form onSubmit={handleSendDoctorInvitation}>
              {/* Doctor Search input */}
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  নিবন্ধিত ডাক্তার খুঁজুন (নাম / বিশেষজ্ঞতা)
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="text"
                    placeholder="ডাক্তারের নাম বা বিশেষজ্ঞতা লিখুন..."
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
                            {doc.specialty?.name || 'জেনারেল'} • আইডি: #{doc.id}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="hosp-sub-btn-secondary"
                          style={{ padding: '3px 9px', fontSize: '11px', fontWeight: 700 }}
                        >
                          নির্বাচন করুন
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor ID input */}
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  অথবা সরাসরি ডাক্তার আইডি লিখুন
                </label>
                <input
                  type="number"
                  required
                  placeholder="যেমন: ১০৪"
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

              {/* Invitation Notes */}
              <div className="mb-3">
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', marginBottom: '6px' }}>
                  চেম্বার / অ্যাসাইনমেন্ট নোট (ঐচ্ছিক)
                </label>
                <textarea
                  rows={2}
                  placeholder="যেমন: কার্ডিওলজি ওপিডি চেম্বার ৩০২-তে নিযুক্ত..."
                  value={invitationNotes}
                  onChange={(e) => setInvitationNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid var(--admin-border, #e2e8f0)',
                    background: 'var(--admin-bg, #f8fafc)',
                    outline: 'none',
                    resize: 'vertical'
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
                আমন্ত্রণ পাঠালে আপনার মোট কোটা থেকে ৭ দিনের জন্য ১টি সিট সংরক্ষিত রাখা হবে। ডাক্তার আমন্ত্রণ গ্রহণ করলে অবিলম্বে আপনার প্রাতিষ্ঠানিক প্ল্যানের ক্লিনিক্যাল সুবিধা ও প্রেসক্রিপশন কোটা ব্যবহার করতে পারবেন।
              </div>

              <div className="d-flex justify-content-end gap-2 pt-3" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="hosp-sub-btn-secondary"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={allocatingSeat || !newDoctorId}
                  className="hosp-sub-btn-primary"
                >
                  <Send size={14} />
                  <span>{allocatingSeat ? 'আমন্ত্রণ পাঠানো হচ্ছে...' : 'সিট আমন্ত্রণ পাঠান'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 9. REVOKE DOCTOR SEAT CONFIRMATION MODAL (PHASE 6 AUDITED) ─── */}
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
                ডাক্তার সিট লাইসেন্স বাতিল করুন
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              আপনি কি নিশ্চিত যে আপনি <strong>ডা. {doctorToRevoke.name}</strong> (ডাক্তার আইডি #{doctorToRevoke.id})-এর ফ্যাসিলিটি লাইসেন্স সিট বাতিল করতে চান? এতে এই হাসপাতালের কোটায় তাঁর অ্যাক্সেস বাতিল হবে এবং ১টি সিট তাৎক্ষণিক আপনার রোস্টারে ফেরত আসবে।
            </p>

            {/* Mandatory Reason Input */}
            <div className="mb-3 mt-3">
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#dc2626', marginBottom: '6px' }}>
                সিট বাতিলের বাধ্যতামূলক কারণ (কমপ্লায়েন্স অডিটের জন্য আবশ্যক)
              </label>
              <textarea
                rows={2}
                required
                placeholder="যেমন: চুক্তির মেয়াদ শেষ, অন্য ক্লিনিকে বদলি, ইত্যাদি..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  fontSize: '13px',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border, #e2e8f0)',
                  background: 'var(--admin-bg, #f8fafc)',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                কমপক্ষে ৩ অক্ষর আবশ্যক। এটি অডিট লেজারে রেকর্ড করা হবে।
              </div>
            </div>

            <div className="d-flex justify-content-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
              <button
                type="button"
                onClick={() => {
                  setDoctorToRevoke(null)
                  setRevokeReason('')
                }}
                className="hosp-sub-btn-secondary"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleConfirmRevokeDoctor}
                disabled={revokingSeat || !revokeReason.trim() || revokeReason.trim().length < 3}
                className="hosp-sub-btn-danger"
              >
                <UserMinus size={14} />
                <span>{revokingSeat ? 'বাতিল করা হচ্ছে...' : 'লাইসেন্স বাতিল করুন'}</span>
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
                হাসপাতাল সাবস্ক্রিপশন বাতিল করুন
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6 }}>
              আপনি কি নিশ্চিত যে হাসপাতাল সাবস্ক্রিপশন বাতিল করতে চান? আপনার বর্তমান বিলিং সাইকেল শেষ হওয়া পর্যন্ত ({' '}
              <strong>{sub?.current_period_ends_at ? new Date(sub.current_period_ends_at).toLocaleDateString('bn-BD') : 'সাইকেলের শেষ'}</strong>
              ) প্রাতিষ্ঠানিক সুবিধা, সংযুক্ত ডাক্তার সিট ও ওপিডি কিউ চালু থাকবে।
            </p>

            <div className="d-flex justify-content-end gap-2 pt-3 mt-4" style={{ borderTop: '1px solid var(--admin-border, #e2e8f0)' }}>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="hosp-sub-btn-secondary"
              >
                সাবস্ক্রিপশন রাখুন
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelSub}
                disabled={cancellingSub}
                className="hosp-sub-btn-danger"
              >
                {cancellingSub ? 'প্রক্রিয়াধীন...' : 'বাতিল নিশ্চিত করুন'}
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
                  সাবস্ক্রিপশন লাইফসাইকেল টাইমলাইন
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
                    এই সাবস্ক্রিপশনের জন্য এখনও কোনো লাইফসাইকেল ইভেন্ট রেকর্ড করা হয়নি।
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
                        <span>{new Date(event.occurred_at).toLocaleString('bn-BD')}</span>
                        <span>•</span>
                        <span>দ্বারা: {event.performed_by}</span>
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
