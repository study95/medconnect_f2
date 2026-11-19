import React, { useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  X,
  Stethoscope,
  Building2,
  Phone,
  Mail,
  User,
  DollarSign,
  Briefcase,
  Check,
  Eye,
  FileCheck,
  Calendar
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import adminAgentApi from '../../../api/adminAgentApi'
import { getMediaUrl } from '../../../utils/mediaUtils'
import CustomCheckbox from '../../../components/common/CustomCheckbox'

export default function OnboardingSplitViewer({ request, onClose, onDecisionComplete }) {
  const [isBmdcVerified, setIsBmdcVerified] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [revisionNotes, setRevisionNotes] = useState('')
  const [actionType, setActionType] = useState('approve')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [previewDoc, setPreviewDoc] = useState(null)
  const [decisionSuccess, setDecisionSuccess] = useState(null)
  const [showRevokePrompt, setShowRevokePrompt] = useState(false)
  const [revokeReason, setRevokeReason] = useState('')
  const [revoking, setRevoking] = useState(false)

  if (!request) return null

  const payload = request.payload || {}
  const documents = Array.isArray(request.documents) ? request.documents : []

  const isApproved = request.status === 'approved'
  const isRejected = request.status === 'rejected'
  const isRevoked = request.status === 'revoked'
  const isRevisionRequested = request.status === 'revision_requested'
  const isAudited = isApproved || isRejected || isRevoked

  const handleDecision = async () => {
    setError(null)

    if (actionType === 'approve' && request.entity_type === 'doctor' && !isBmdcVerified) {
      const msg = 'Please confirm the BMDC Verification checklist before approving.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (actionType === 'reject' && !rejectReason.trim()) {
      const msg = 'Please state the official reason for rejection.'
      setError(msg)
      toast.error(msg)
      return
    }

    if (actionType === 'request_revision' && !revisionNotes.trim()) {
      const msg = 'Please provide clear revision instructions for the agent.'
      setError(msg)
      toast.error(msg)
      return
    }

    setLoading(true)
    try {
      const res = await adminAgentApi.processDecision(request.id, {
        action: actionType,
        is_bmdc_verified: isBmdcVerified,
        admin_notes: adminNotes,
        rejection_reason: rejectReason,
        revision_notes: revisionNotes || adminNotes,
      })

      const isHospital = request.entity_type === 'hospital'
      const successInfo = {
        action: actionType,
        message: actionType === 'approve'
          ? (isHospital
              ? 'আবেদনটি সফলভাবে অনুমোদিত হয়েছে! নতুন হাসপাতাল প্রোফাইল তৈরি হয়েছে এবং এজেন্টের ওয়ালেটে ৳১,৫০০ কমিশন জমা হয়েছে।'
              : 'আবেদনটি সফলভাবে অনুমোদিত হয়েছে! নতুন ডাক্তার একাউন্ট তৈরি হয়েছে এবং এজেন্টের ওয়ালেটে ৳৫০০ কমিশন জমা হয়েছে।')
          : actionType === 'reject'
          ? 'আবেদনটি বাতিল (Reject) করা হয়েছে।'
          : 'নথিপত্র সংশোধনের জন্য এজেন্টের কাছে রিভিশন নোট পাঠানো হয়েছে।'
      }
      setDecisionSuccess(successInfo)

      toast.success(
        actionType === 'approve'
          ? (isHospital
              ? 'Hospital successfully approved! Facility profile and ৳1,500 commission provisioned.'
              : 'Provider successfully approved! Doctor profile and ৳500 commission provisioned.')
          : actionType === 'reject'
          ? 'Onboarding application rejected.'
          : 'Revision requested from field agent.'
      )

      setTimeout(() => {
        if (onDecisionComplete) {
          onDecisionComplete(res)
        }
      }, 1300)
    } catch (err) {
      console.error('Decision processing failed:', err)
      const msg = err?.response?.data?.message || err?.message || 'Verification decision failed.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async () => {
    if (!revokeReason.trim()) {
      toast.error('অনুগ্রহ করে বাতিলের সুনির্দিষ্ট কারণ লিখুন।')
      return
    }

    setRevoking(true)
    try {
      const res = await adminAgentApi.revokeOnboarding(request.id, revokeReason.trim())
      toast.success('অনবোর্ডিং সফলভাবে প্রত্যাহার (Revoked) করা হয়েছে এবং কমিশন রিভার্স করা হয়েছে।')
      setShowRevokePrompt(false)
      if (onDecisionComplete) {
        onDecisionComplete(res)
      }
    } catch (err) {
      console.error('Revoke failed:', err)
      toast.error(err?.response?.data?.message || 'Revocation failed.')
    } finally {
      setRevoking(false)
    }
  }

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1060,
        background: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading && onClose) onClose()
      }}
    >
      <div 
        style={{
          background: 'var(--admin-card-bg, #FFFFFF)',
          border: '1px solid var(--admin-border, #E2E8F0)',
          borderRadius: 20,
          maxWidth: 1100,
          width: '100%',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          position: 'relative'
        }}
      >
        {/* Success Confirmation Overlay */}
        {decisionSuccess && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            zIndex: 50,
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: decisionSuccess.action === 'approve' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              color: decisionSuccess.action === 'approve' ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16
            }}>
              {decisionSuccess.action === 'approve' ? <CheckCircle2 size={36} /> : <XCircle size={36} />}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
              {decisionSuccess.action === 'approve' ? 'অনবোর্ডিং সফলভাবে অনুমোদিত হয়েছে!' : 'অনবোর্ডিং সিদ্ধান্ত সম্পন্ন হয়েছে'}
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', maxWidth: 440, margin: '0 0 20px', lineHeight: 1.5 }}>
              {decisionSuccess.message}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#00B875', fontSize: 12, fontWeight: 700 }}>
              <Loader2 size={14} className="animate-spin" />
              <span>ডেস্ক তালিকা স্বয়ংক্রিয়ভাবে আপডেট হচ্ছে...</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--admin-border, #E2E8F0)',
          background: 'var(--admin-bg, #F8FAFC)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: request.entity_type === 'hospital' ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: request.entity_type === 'hospital' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 12px rgba(0, 184, 117, 0.3)'
            }}>
              {request.entity_type === 'hospital' ? <Building2 size={22} /> : <Stethoscope size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                  {payload.name || 'Candidate Verification'}
                </h3>
                <span style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#00B875',
                  background: 'rgba(0, 184, 117, 0.1)',
                  padding: '2px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(0, 184, 117, 0.25)'
                }}>
                  {request.request_code}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: 'rgba(2, 132, 199, 0.1)',
                  color: '#0284C7',
                  padding: '2px 8px',
                  borderRadius: 6
                }}>
                  {request.entity_type || 'doctor'}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--admin-text-muted, #64748B)' }}>
                Submitted by: <strong>{request.agent?.user?.name || `Agent #${request.agent_id}`}</strong> ({request.agent?.agent_code || 'AGT-N/A'}) • {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Recent'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--admin-text-muted, #94A3B8)',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--admin-hover, rgba(0,0,0,0.05))'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Split Content Area */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 20,
          padding: '24px',
          overflowY: 'auto',
          flex: 1
        }}>
          {/* Left Column: Clinical Credentials & Decision Engine */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <div style={{
                padding: '12px 14px',
                borderRadius: 10,
                background: '#FEF2F2',
                border: '1px solid #FECDD3',
                color: '#B91C1C',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Candidate Metadata Grid */}
            <div style={{
              background: 'var(--admin-bg, #F8FAFC)',
              border: '1px solid var(--admin-border, #E2E8F0)',
              borderRadius: 14,
              padding: 16
            }}>
              <div style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--admin-text-muted, #64748B)', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.04em' }}>
                {request.entity_type === 'hospital' ? 'Hospital Candidate Details' : 'Doctor Candidate Details'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {request.entity_type === 'hospital' ? (
                  <>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>DGHS / License No</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13.5, fontWeight: 800, color: '#10B981' }}>
                        {payload.license_number || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Facility Type</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0F172A)', textTransform: 'uppercase' }}>
                        {payload.hospital_type || 'Private'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Official Phone</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text, #0F172A)' }}>
                        {payload.phone || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Hotline Number</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text, #0F172A)' }}>
                        {payload.hotline || 'N/A'}
                      </span>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Official Email</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text, #0F172A)', wordBreak: 'break-all' }}>
                        {payload.email || 'N/A'}
                      </span>
                    </div>

                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Physical Address & Location</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text, #0F172A)' }}>
                        {payload.address || 'Address not specified'}
                      </span>
                    </div>

                    {(payload.latitude || payload.longitude) && (
                      <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.08)', padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#065F46' }}>
                          📍 GPS: {payload.latitude}, {payload.longitude}
                        </span>
                        <a
                          href={payload.google_map_url || `https://www.google.com/maps?q=${payload.latitude},${payload.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11.5, color: '#0284C7', fontWeight: 700, textDecoration: 'underline' }}
                        >
                          View Map ↗
                        </a>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>BMDC Reg. No</span>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 800, color: '#00B875' }}>
                        {payload.bmdc || payload.license_number || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Primary Degree</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text, #0F172A)' }}>
                        {payload.degree || 'MBBS'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Contact Phone</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text, #0F172A)' }}>
                        {payload.phone || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Email Address</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--admin-text, #0F172A)', wordBreak: 'break-all' }}>
                        {payload.email || 'N/A'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Workplace / Hospital</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--admin-text, #0F172A)' }}>
                        {payload.workplace || 'Independent Practitioner'}
                      </span>
                    </div>

                    <div>
                      <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)', display: 'block' }}>Visiting Fee</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                        ৳{payload.fee || payload.visiting_fee || 500}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* If application is already audited (Approved, Rejected, Revoked) or awaiting revision, show Audit Card */}
            {isApproved ? (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(5, 150, 105, 0.12) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={20} color="#059669" />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      আবেদনটি অনুমোদিত ও সক্রিয় (Approved &amp; Provisioned)
                    </span>
                  </div>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    background: '#10B981',
                    color: '#ffffff',
                    padding: '3px 10px',
                    borderRadius: 12
                  }}>
                    LIVE IN SYSTEM
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: 12.5, color: '#047857', lineHeight: 1.5 }}>
                  {request.entity_type === 'hospital'
                    ? 'এই হাসপাতাল আবেদনটি সফলভাবে নিরীক্ষা ও অনুমোদন সম্পন্ন হয়েছে। হাসপাতাল প্রোফাইল স্বয়ংক্রিয়ভাবে সক্রিয় হয়েছে এবং সাবমিটিং ফিল্ড এজেন্টের ওয়ালেটে ৳১,৫০০ কমিশন জমা হয়েছে।'
                    : 'এই প্রোভাইডার আবেদনটি সফলভাবে নিরীক্ষা ও অনুমোদন সম্পন্ন হয়েছে। ডাক্তার প্রোফাইল স্বয়ংক্রিয়ভাবে একটিভ হয়েছে এবং সাবমিটিং ফিল্ড এজেন্টের ওয়ালেটে ৳৫০০ কমিশন জমা হয়েছে।'}
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 10,
                  background: '#ffffff',
                  padding: '12px 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  fontSize: 12
                }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600 }}>অনুমোদনকারী অ্যাডমিন:</span>
                    <strong style={{ color: '#0F172A' }}>{request.reviewer?.name || 'Authorized Admin'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600 }}>অনুমোদনের সময়:</span>
                    <strong style={{ color: '#0F172A' }}>
                      {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : 'Recent'}
                    </strong>
                  </div>
                  {request.provisioned_entity_id && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600 }}>
                        লাইভ {request.entity_type === 'hospital' ? 'হাসপাতাল' : 'ডাক্তার'} সিস্টেম আইডি:
                      </span>
                      <strong style={{ color: '#059669', fontFamily: 'monospace', fontSize: 13 }}>
                        #{request.provisioned_entity_id} ({request.entity_type?.toUpperCase()})
                      </strong>
                    </div>
                  )}
                </div>

                {request.admin_notes && (
                  <div style={{ fontSize: 12, color: '#334155', background: '#F8FAFC', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <strong style={{ color: '#475569' }}>অ্যাডমিন নোট:</strong> {request.admin_notes}
                  </div>
                )}

                {/* Revoke confirmation prompt */}
                {showRevokePrompt && (
                  <div style={{
                    marginTop: 8,
                    padding: 14,
                    borderRadius: 12,
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#B91C1C', fontWeight: 800, fontSize: 13 }}>
                      <AlertTriangle size={16} />
                      <span>অনবোর্ডিং প্রত্যাহার ও বাতিলকরণ (Clawback &amp; Revocation)</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: '#7F1D1D', lineHeight: 1.4 }}>
                      অনুমোদন প্রত্যাহার করলে প্রোভাইডার অ্যাকাউন্টটি অবিলম্বে নিষ্ক্রিয় করা হবে এবং সাবমিটিং এজেন্টের ওয়ালেট থেকে ৳৫০০ কমিশন স্বয়ংক্রিয়ভাবে রিভার্স করা হবে।
                    </p>
                    <textarea
                      rows={2}
                      value={revokeReason}
                      onChange={(e) => setRevokeReason(e.target.value)}
                      placeholder="বাতিলের অফিশিয়াল কারণ লিখুন (যেমন: ভুয়া বিএমডিসি সনদ শনাক্ত)..."
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #F87171',
                        fontSize: 12,
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setShowRevokePrompt(false)}
                        disabled={revoking}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 8,
                          border: '1px solid #CBD5E1',
                          background: '#ffffff',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        ফিরে যান
                      </button>
                      <button
                        type="button"
                        onClick={handleRevoke}
                        disabled={revoking}
                        style={{
                          padding: '6px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#DC2626',
                          color: '#ffffff',
                          fontSize: 12,
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: revoking ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {revoking && <Loader2 size={13} className="animate-spin" />}
                        <span>বাতিল ও কমিশন রিভার্স নিশ্চিত করুন</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : isRejected ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <XCircle size={20} color="#DC2626" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    আবেদনটি প্রত্যাখ্যাত (Rejected)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#B91C1C', lineHeight: 1.5 }}>
                  এই অনবোর্ডিং আবেদনটি অ্যাডমিন অডিট সম্পন্ন করে বাতিল করা হয়েছে। এটি একটি চূড়ান্ত স্ট্যাটাস।
                </p>
                {request.rejection_reason && (
                  <div style={{
                    background: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    fontSize: 12
                  }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600 }}>বাতিলের অফিশিয়াল কারণ:</span>
                    <strong style={{ color: '#DC2626', fontSize: 12.5 }}>{request.rejection_reason}</strong>
                  </div>
                )}
                <div style={{ fontSize: 11.5, color: '#64748B' }}>
                  অডিট করেছেন: <strong>{request.reviewer?.name || 'Admin'}</strong> • {request.reviewed_at ? new Date(request.reviewed_at).toLocaleString() : ''}
                </div>
              </div>
            ) : isRevoked ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={20} color="#D97706" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    আবেদনটি প্রত্যাহারকৃত (Revoked &amp; Clawbacked)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#B45309', lineHeight: 1.5 }}>
                  এই আবেদনটির অনুমোদন পরবর্তীতে প্রত্যাহার করা হয়েছে। সংশ্লিষ্ট ডাক্তার প্রোফাইল নিষ্ক্রিয় করা হয়েছে এবং এজেন্টের কমিশন রিভার্স করা হয়েছে।
                </p>
              </div>
            ) : isRevisionRequested ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: 14,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={20} color="#D97706" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    সংশোধন চাওয়া হয়েছে (Awaiting Agent Revision)
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: 12.5, color: '#B45309', lineHeight: 1.5 }}>
                  এজেন্টকে তথ্য বা নথিপত্র পুনরায় জমা দেওয়ার নির্দেশনা পাঠানো হয়েছে। এজেন্ট আপডেট সাবমিট না করা পর্যন্ত আবেদনটি এই স্ট্যাটাসে থাকবে।
                </p>
                {request.admin_notes && (
                  <div style={{
                    background: '#ffffff',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: 12
                  }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: 11, fontWeight: 600 }}>এজেন্টের প্রতি নির্দেশনা:</span>
                    <strong style={{ color: '#B45309' }}>{request.admin_notes}</strong>
                  </div>
                )}
              </div>
            ) : (
              /* ACTIVE REVIEW ENGINE FOR SUBMITTED / UNDER_REVIEW */
              <>
                {/* BMDC Verification Guard Checkbox */}
                {request.entity_type === 'doctor' && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
                    border: '1.5px solid rgba(0, 184, 117, 0.35)',
                    borderRadius: 14,
                    padding: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldCheck size={20} color="#00B875" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                          BMDC Registry Verification Guard
                        </span>
                      </div>
                      <a
                        href="https://bmdc.org.bd"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: '#0284C7',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <span>Check BMDC ↗</span>
                      </a>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginTop: 8, userSelect: 'none' }}>
                      <CustomCheckbox
                        checked={isBmdcVerified}
                        onChange={(e) => setIsBmdcVerified(e.target.checked)}
                        color="#10B981"
                        style={{ marginTop: 2 }}
                      />
                      <span style={{ fontSize: 12.5, color: 'var(--admin-text, #0F172A)', lineHeight: 1.4 }}>
                        I confirm that I have cross-checked <strong>{payload.bmdc}</strong> in the official BMDC database and verified this physician holds an active registration.
                      </span>
                    </label>
                  </div>
                )}

                {/* Hospital DGHS / Trade License Verification Guard */}
                {request.entity_type === 'hospital' && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)',
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 14,
                    padding: 16
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <ShieldCheck size={20} color="#10B981" />
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text, #0F172A)' }}>
                          DGHS / Trade License Verification Guard
                        </span>
                      </div>
                      {payload.license_number && (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                          লাইসেন্স: {payload.license_number}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--admin-text-muted, #64748B)', lineHeight: 1.45 }}>
                      স্বাস্থ্য অধিদপ্তর (DGHS) বা পৌর কর্তৃপক্ষের লাইসেন্স নম্বর ও আপলোডকৃত নথিপত্র সতর্কতার সাথে মিলিয়ে যাচাই করুন।
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#047857', fontWeight: 600 }}>
                      <CheckCircle2 size={15} color="#10B981" />
                      <span>অনুমোদনের সাথে সাথে হাসপাতালটি লাইভ হবে এবং এজেন্টের অ্যাকাউন্টে ৳১,৫০০ কমিশন ক্রেডিট হবে।</span>
                    </div>
                  </div>
                )}

                {/* Decision Action Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: 'var(--admin-text-muted, #475569)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Select Decision Action
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => setActionType('approve')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        border: actionType === 'approve' ? '2px solid #00B875' : '1px solid var(--admin-border, #CBD5E1)',
                        background: actionType === 'approve' ? 'rgba(0, 184, 117, 0.12)' : 'var(--admin-card-bg, #FFFFFF)',
                        color: actionType === 'approve' ? '#00B875' : 'var(--admin-text, #475569)',
                      }}
                    >
                      <CheckCircle2 size={18} />
                      <span>Approve &amp; Provision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('request_revision')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        border: actionType === 'request_revision' ? '2px solid #F59E0B' : '1px solid var(--admin-border, #CBD5E1)',
                        background: actionType === 'request_revision' ? 'rgba(245, 158, 11, 0.12)' : 'var(--admin-card-bg, #FFFFFF)',
                        color: actionType === 'request_revision' ? '#D97706' : 'var(--admin-text, #475569)',
                      }}
                    >
                      <AlertTriangle size={18} />
                      <span>Request Revision</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActionType('reject')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                        transition: 'all 0.15s ease',
                        border: actionType === 'reject' ? '2px solid #EF4444' : '1px solid var(--admin-border, #CBD5E1)',
                        background: actionType === 'reject' ? 'rgba(239, 68, 68, 0.12)' : 'var(--admin-card-bg, #FFFFFF)',
                        color: actionType === 'reject' ? '#EF4444' : 'var(--admin-text, #475569)',
                      }}
                    >
                      <XCircle size={18} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>

                {/* Conditional input fields */}
                {actionType === 'reject' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#EF4444', marginBottom: 6 }}>
                      Rejection Reason (Required) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="Explain why this candidate is ineligible (e.g. Invalid BMDC, forged certificate)..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1.5px solid #FCA5A5',
                        background: 'var(--admin-card-bg, #FFFFFF)',
                        color: 'var(--admin-text, #0F172A)',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                {actionType === 'request_revision' && (
                  <div>
                    <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#D97706', marginBottom: 6 }}>
                      Revision Instructions for Agent (Required) *
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={revisionNotes}
                      onChange={(e) => setRevisionNotes(e.target.value)}
                      placeholder="Specify what document or detail the agent needs to re-upload..."
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: '1.5px solid #FCD34D',
                        background: 'var(--admin-card-bg, #FFFFFF)',
                        color: 'var(--admin-text, #0F172A)',
                        fontSize: 12.5,
                        outline: 'none',
                      }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--admin-text-muted, #64748B)', marginBottom: 6 }}>
                    Internal Reviewer Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Logged in audit trail for internal reference..."
                    style={{
                      width: '100%',
                      height: 38,
                      padding: '0 12px',
                      borderRadius: 8,
                      border: '1px solid var(--admin-border, #CBD5E1)',
                      background: 'var(--admin-card-bg, #FFFFFF)',
                      color: 'var(--admin-text, #0F172A)',
                      fontSize: 12.5,
                      outline: 'none',
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Right Column: Uploaded Documents Inspector */}
          <div style={{
            background: 'var(--admin-bg, #F8FAFC)',
            border: '1px solid var(--admin-border, #E2E8F0)',
            borderRadius: 16,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={18} color="#00B875" />
                  <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--admin-text, #0F172A)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Uploaded Credentials ({documents.length})
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--admin-text-muted, #64748B)' }}>
                  Click to inspect
                </span>
              </div>

              {documents.length === 0 ? (
                <div style={{
                  padding: '30px 16px',
                  textAlign: 'center',
                  background: 'var(--admin-card-bg, #FFFFFF)',
                  borderRadius: 12,
                  border: '1px dashed var(--admin-border, #CBD5E1)',
                  color: 'var(--admin-text-muted, #64748B)'
                }}>
                  <FileText size={32} style={{ opacity: 0.4, margin: '0 auto 8px' }} />
                  <p style={{ margin: 0, fontSize: 12.5, fontWeight: 600 }}>No documents uploaded</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {documents.map((docKey, idx) => {
                    const docUrl = getMediaUrl(docKey) || `/storage/${docKey}`
                    const isSelected = previewDoc === docKey

                    return (
                      <div
                        key={idx}
                        style={{
                          background: isSelected ? 'rgba(0, 184, 117, 0.08)' : 'var(--admin-card-bg, #FFFFFF)',
                          border: isSelected ? '1.5px solid #00B875' : '1px solid var(--admin-border, #E2E8F0)',
                          borderRadius: 12,
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div style={{
                            width: 34,
                            height: 34,
                            borderRadius: 8,
                            background: 'rgba(0, 184, 117, 0.1)',
                            color: '#00B875',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <FileCheck size={16} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--admin-text, #0F172A)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {request.entity_type === 'hospital'
                                ? (idx === 0 ? 'DGHS লাইসেন্স / রেজিস্ট্রেশন সনদপত্র' : (idx === 1 ? 'ট্রেড লাইসেন্স কপি' : `ডকুমেন্ট #${idx + 1}`))
                                : (idx === 0 ? 'বিএমডিসি (BMDC) সনদপত্র' : (idx === 1 ? 'জাতীয় পরিচয়পত্র (NID)' : `ডকুমেন্ট #${idx + 1}`))}
                            </div>
                            <div style={{ fontSize: 10.5, fontFamily: 'monospace', color: 'var(--admin-text-muted, #64748B)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {docKey}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '5px 10px',
                              borderRadius: 6,
                              fontSize: 11.5,
                              fontWeight: 700,
                              background: '#00B875',
                              color: '#FFFFFF',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>View</span>
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Tip Banner */}
            <div style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: isApproved 
                ? 'rgba(16, 185, 129, 0.08)' 
                : 'rgba(59, 130, 246, 0.08)',
              border: isApproved 
                ? '1px solid rgba(16, 185, 129, 0.25)' 
                : '1px solid rgba(59, 130, 246, 0.2)',
              fontSize: 11.5,
              color: isApproved ? '#065F46' : '#1E40AF',
              lineHeight: 1.4
            }}>
              {isApproved ? (
                <span>
                  💡 <strong>সিস্টেম স্ট্যাটাস:</strong> এই প্রোভাইডার প্রোফাইলটি সফলভাবে লাইভ করা হয়েছে এবং এজেন্টের ওয়ালেটে ৳৫০০ কমিশন নিশ্চিত করা হয়েছে।
                </span>
              ) : isRejected ? (
                <span>
                  💡 <strong>অডিট স্ট্যাটাস:</strong> এই আবেদনটি স্থায়ীভাবে বাতিল করা হয়েছে।
                </span>
              ) : (
                <span>
                  💡 <strong>Compliance Note:</strong> Approving will immediately generate the core doctor record, grant access to DoctorBooklet, and trigger double-entry credit of ৳500 to the submitting agent.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--admin-border, #E2E8F0)',
          background: 'var(--admin-bg, #F8FAFC)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isAudited ? 'space-between' : 'flex-end',
          gap: 12
        }}>
          {isAudited ? (
            <>
              <div>
                {isApproved && !showRevokePrompt && (
                  <button
                    type="button"
                    onClick={() => setShowRevokePrompt(true)}
                    style={{
                      padding: '0 14px',
                      height: 38,
                      borderRadius: 10,
                      border: '1px solid #FCA5A5',
                      background: 'rgba(239, 68, 68, 0.06)',
                      color: '#DC2626',
                      fontSize: 12.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>অনুমোদন প্রত্যাহার / Clawback</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="admin-btn admin-btn-secondary"
                style={{
                  padding: '0 24px',
                  height: 38,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                বন্ধ করুন (Close)
              </button>
            </>
          ) : isRevisionRequested ? (
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-secondary"
              style={{
                padding: '0 24px',
                height: 38,
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              বন্ধ করুন (Close)
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading || Boolean(decisionSuccess)}
                style={{
                  padding: '0 18px',
                  height: 40,
                  borderRadius: 10,
                  border: '1px solid var(--admin-border, #CBD5E1)',
                  background: 'transparent',
                  color: 'var(--admin-text, #475569)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDecision}
                disabled={loading || Boolean(decisionSuccess)}
                className="admin-btn admin-btn-primary"
                style={{
                  height: 40,
                  padding: '0 24px',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: loading || Boolean(decisionSuccess) ? 'not-allowed' : 'pointer',
                  background: actionType === 'approve' 
                    ? 'linear-gradient(135deg, #00B875, #009E64)' 
                    : actionType === 'reject' 
                    ? 'linear-gradient(135deg, #EF4444, #DC2626)' 
                    : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  boxShadow: actionType === 'approve' 
                    ? '0 4px 14px rgba(0, 184, 117, 0.35)' 
                    : actionType === 'reject' 
                    ? '0 4px 14px rgba(239, 68, 68, 0.35)' 
                    : '0 4px 14px rgba(245, 158, 11, 0.35)',
                }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                <span>
                  {loading
                    ? 'Processing...'
                    : actionType === 'approve'
                    ? 'Approve & Provision Doctor'
                    : actionType === 'reject'
                    ? 'Confirm Rejection'
                    : 'Request Revision'}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
