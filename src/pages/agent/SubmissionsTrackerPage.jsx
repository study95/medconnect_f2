import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, 
  Search, 
  Clock, 
  CheckCircle, 
  CheckCircle2,
  XCircle, 
  AlertTriangle, 
  Plus, 
  Loader2,
  Calendar,
  Eye,
  ChevronRight,
  Filter,
  RefreshCw,
  Sparkles,
  Stethoscope,
  Building2,
  Edit3,
  X
} from 'lucide-react'
import agentApi from '../../api/agentApi'

export default function SubmissionsTrackerPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [selectedReason, setSelectedReason] = useState(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const params = {}
      if (statusFilter) params.status = statusFilter
      const res = await agentApi.getOnboardingRequests(params)
      setRequests(res.data || [])
    } catch (err) {
      console.error('Failed to load onboarding requests:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [statusFilter])

  const totalCount = requests.length
  const underReviewCount = requests.filter(r => r.status === 'under_review' || r.status === 'submitted').length
  const approvedCount = requests.filter(r => r.status === 'approved').length
  const revisionCount = requests.filter(r => r.status === 'revision_requested').length

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: 'rgba(0, 184, 117, 0.1)',
            color: '#00B875',
            border: '1px solid rgba(0, 184, 117, 0.25)',
            whiteSpace: 'nowrap'
          }}>
            <CheckCircle2 size={12} strokeWidth={2.5} /> অনুমোদিত ও অর্জিত
          </span>
        )
      case 'rejected':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#FEF2F2',
            color: '#EF4444',
            border: '1px solid #FECDD3',
            whiteSpace: 'nowrap'
          }}>
            <XCircle size={12} strokeWidth={2.5} /> বাতিল
          </span>
        )
      case 'revision_requested':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#FFFBEB',
            color: '#D97706',
            border: '1px solid #FDE68A',
            whiteSpace: 'nowrap'
          }}>
            <AlertTriangle size={12} strokeWidth={2.5} /> সংশোধন প্রয়োজন
          </span>
        )
      case 'under_review':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #BFDBFE',
            whiteSpace: 'nowrap'
          }}>
            <Clock size={12} strokeWidth={2.5} /> যাচাই চলছে
          </span>
        )
      case 'revoked':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: 'rgba(168, 85, 247, 0.1)',
            color: '#7E22CE',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            whiteSpace: 'nowrap'
          }}>
            <AlertTriangle size={12} strokeWidth={2.5} /> প্রত্যাহারকৃত (Revoked)
          </span>
        )
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 6,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#F1F5F9',
            color: '#475569',
            border: '1px solid #E2E8F0',
            whiteSpace: 'nowrap'
          }}>
            <Clock size={12} strokeWidth={2.5} /> জমা হয়েছে
          </span>
        )
    }
  }

  const filtered = requests.filter((r) => {
    if (!search) return true
    const term = search.toLowerCase()
    return (
      r.request_code?.toLowerCase().includes(term) ||
      r.payload?.name?.toLowerCase().includes(term) ||
      r.payload?.name_bn?.toLowerCase().includes(term) ||
      r.payload?.bmdc?.toLowerCase().includes(term) ||
      r.payload?.license_number?.toLowerCase().includes(term) ||
      r.entity_type?.toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <style>{`
        .tracker-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 20px 48px;
        }
        .tracker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .tracker-title-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .tracker-title-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00B875 0%, #0284c7 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
          flex-shrink: 0;
        }
        .tracker-title-h1 {
          font-size: 22px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .tracker-subtitle {
          font-size: 13px;
          color: #64748B;
          margin: 3px 0 0;
        }
        @keyframes trackerSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .tracker-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tracker-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .tracker-stat-card {
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          border-radius: 14px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .tracker-filter-bar {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 14px 18px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: center;
        }
        .tracker-desktop-table {
          display: block;
        }
        .tracker-mobile-cards {
          display: none;
        }
        .tracker-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 14px 16px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }

        @media (max-width: 768px) {
          .tracker-container {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .tracker-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 14px !important;
          }
          .tracker-title-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 11px !important;
          }
          .tracker-title-h1 {
            font-size: 17px !important;
            line-height: 1.3 !important;
          }
          .tracker-subtitle {
            font-size: 12px !important;
          }
          .tracker-header-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr 44px !important;
            gap: 8px !important;
          }
          .tracker-header-actions a,
          .tracker-header-actions button {
            justify-content: center !important;
            padding: 10px 8px !important;
            font-size: 12.5px !important;
            white-space: nowrap !important;
          }
          .tracker-stats-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-bottom: 14px !important;
          }
          .tracker-stat-card {
            padding: 11px 12px !important;
            gap: 10px !important;
          }
          .tracker-filter-bar {
            padding: 12px 14px !important;
            gap: 10px !important;
            margin-bottom: 14px !important;
            border-radius: 14px !important;
          }
          .tracker-filter-search {
            min-width: 100% !important;
            flex: 1 1 100% !important;
          }
          .tracker-filter-select-wrap {
            width: 100% !important;
          }
          .tracker-filter-select-wrap select {
            width: 100% !important;
          }
          .tracker-desktop-table {
            display: none !important;
          }
          .tracker-mobile-cards {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
          }
        }
      `}</style>

      <div className="tracker-container">
        {/* Breadcrumb HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 14 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>অনবোর্ডিং ট্র্যাকার</span>
          <ChevronRight size={13} />
          <span style={{ color: '#00B875', fontWeight: 700 }}>সাবমিশন তালিকা</span>
        </div>

        {/* Page Header */}
        <div className="tracker-header">
          <div className="tracker-title-wrap">
            <div className="tracker-title-icon">
              <ClipboardList size={22} />
            </div>
            <div>
              <h1 className="tracker-title-h1">
                অনবোর্ডিং সাবমিশন ট্র্যাকার
              </h1>
              <p className="tracker-subtitle">
                আপনার সাবমিট করা ডাক্তার ও হাসপাতালের ভেরিফিকেশন ও কমিশন স্ট্যাটাস।
              </p>
            </div>
          </div>

          <div className="tracker-header-actions">
            <Link
              to="/agent/onboard/doctor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00B875 0%, #009E64 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0, 184, 117, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>ডাক্তার</span>
            </Link>
            <Link
              to="/agent/onboard/hospital"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
                transition: 'all 0.2s'
              }}
            >
              <Building2 size={15} strokeWidth={2.5} />
              <span>হাসপাতাল</span>
            </Link>
            <button
              onClick={fetchRequests}
              disabled={loading}
              title="রিফ্রেশ করুন"
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={16} style={{ animation: loading ? 'trackerSpin 1s linear infinite' : 'none' }} />
            </button>
          </div>
        </div>

        {/* ── Quick Stats Metric Cards ── */}
        <div className="tracker-stats-grid">
          {/* Card 1: Total */}
          <div
            onClick={() => setStatusFilter('')}
            className="tracker-stat-card"
            style={{
              borderColor: statusFilter === '' ? '#00B875' : '#E2E8F0',
              background: statusFilter === '' ? '#F0FDF4' : '#FFFFFF'
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#F1F5F9',
              color: '#334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ClipboardList size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>মোট আবেদন</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{totalCount}</div>
            </div>
          </div>

          {/* Card 2: Under Review */}
          <div
            onClick={() => setStatusFilter('under_review')}
            className="tracker-stat-card"
            style={{
              borderColor: statusFilter === 'under_review' ? '#2563EB' : '#E2E8F0',
              background: statusFilter === 'under_review' ? '#EFF6FF' : '#FFFFFF'
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Clock size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>যাচাই চলছে</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#2563EB' }}>{underReviewCount}</div>
            </div>
          </div>

          {/* Card 3: Approved */}
          <div
            onClick={() => setStatusFilter('approved')}
            className="tracker-stat-card"
            style={{
              borderColor: statusFilter === 'approved' ? '#00B875' : '#E2E8F0',
              background: statusFilter === 'approved' ? '#F0FDF4' : '#FFFFFF'
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'rgba(0, 184, 117, 0.1)',
              color: '#00B875',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>অনুমোদিত</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#00B875' }}>{approvedCount}</div>
            </div>
          </div>

          {/* Card 4: Revision Needed */}
          <div
            onClick={() => setStatusFilter('revision_requested')}
            className="tracker-stat-card"
            style={{
              borderColor: statusFilter === 'revision_requested' ? '#F59E0B' : '#E2E8F0',
              background: statusFilter === 'revision_requested' ? '#FFFBEB' : '#FFFFFF'
            }}
          >
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>সংশোধন</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#D97706' }}>{revisionCount}</div>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="tracker-filter-bar">
          <div className="tracker-filter-search" style={{ position: 'relative', flex: 1, minWidth: 240 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="কোড, প্রার্থীর নাম বা BMDC দিয়ে খুঁজুন..."
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px 0 40px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13.5,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div className="tracker-filter-select-wrap" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} style={{ color: '#64748B', flexShrink: 0 }} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: 42,
                padding: '0 14px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                color: '#334155',
                outline: 'none',
                background: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            >
              <option value="">সকল স্ট্যাটাস (All)</option>
              <option value="submitted">নতুন জমা (Submitted)</option>
              <option value="under_review">যাচাই চলছে (Under Review)</option>
              <option value="approved">অনুমোদিত (Approved)</option>
              <option value="revision_requested">সংশোধন প্রয়োজন (Revision Needed)</option>
              <option value="rejected">বাতিল (Rejected)</option>
              <option value="revoked">প্রত্যাহারকৃত (Revoked)</option>
            </select>
          </div>
        </div>

        {/* ── Submissions Data Section ── */}
        <div>
          {loading ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '60px 20px',
              textAlign: 'center',
              color: '#64748B'
            }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#00B875' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>তথ্য লোড করা হচ্ছে...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              background: '#FFFFFF',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '48px 20px',
              textAlign: 'center'
            }}>
              <ClipboardList size={44} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#334155', margin: 0 }}>কোনো সাবমিশন পাওয়া যায়নি</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 18px', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                আপনার পার্টনার ওয়ালেটে কমিশন অর্জন করতে নতুন ডাক্তার বা হাসপাতাল অনবোর্ডিং শুরু করুন।
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link
                  to="/agent/onboard/doctor"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#00B875',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <Plus size={15} /> + ডাক্তার অনবোর্ড
                </Link>
                <Link
                  to="/agent/onboard/hospital"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '10px 18px',
                    borderRadius: 10,
                    background: '#0284C7',
                    color: '#FFFFFF',
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none'
                  }}
                >
                  <Building2 size={15} /> + হাসপাতাল অনবোর্ড
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Desktop Table (Hidden on Mobile < 768px) */}
              <div className="tracker-desktop-table" style={{
                background: '#FFFFFF',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '14px 20px' }}>রিকোয়েস্ট কোড</th>
                        <th style={{ padding: '14px 16px' }}>ক্যাটাগরি</th>
                        <th style={{ padding: '14px 16px' }}>নাম</th>
                        <th style={{ padding: '14px 16px' }}>সনদ / লাইসেন্স</th>
                        <th style={{ padding: '14px 16px' }}>তারিখ</th>
                        <th style={{ padding: '14px 20px' }}>ভেরিফিকেশন স্ট্যাটাস</th>
                        <th style={{ padding: '14px 20px', textAlign: 'right' }}>অ্যাকশন / কমিশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((item) => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontWeight: 800, color: '#00B875' }}>
                            {item.request_code}
                          </td>
                          <td style={{ padding: '16px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: item.entity_type === 'doctor' ? '#00B875' : '#0284C7',
                              background: item.entity_type === 'doctor' ? 'rgba(0, 184, 117, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                              padding: '3px 8px',
                              borderRadius: 6
                            }}>
                              {item.entity_type === 'doctor' ? <Stethoscope size={12} /> : <Building2 size={12} />}
                              {item.entity_type === 'doctor' ? 'ডাক্তার' : 'হাসপাতাল'}
                            </span>
                          </td>
                          <td style={{ padding: '16px 16px', fontWeight: 700, color: '#0F172A' }}>
                            {item.payload?.name || 'N/A'} {item.payload?.name_bn && <span style={{ fontSize: 12, fontWeight: 500, color: '#64748B' }}>({item.payload?.name_bn})</span>}
                          </td>
                          <td style={{ padding: '16px 16px', color: '#64748B', fontSize: 12.5 }}>
                            {item.entity_type === 'doctor' ? `BMDC: ${item.payload?.bmdc || 'N/A'}` : `লাইসেন্স: ${item.payload?.license_number || 'N/A'}`}
                          </td>
                          <td style={{ padding: '16px 16px', color: '#64748B', fontSize: 12 }}>
                            {formatDate(item.created_at)}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {getStatusBadge(item.status)}
                              {item.rejection_reason && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReason({
                                    type: 'rejected',
                                    title: 'বাতিলের কারণ (Rejection Reason)',
                                    requestCode: item.request_code,
                                    providerName: item.payload?.name || 'N/A',
                                    entityType: item.entity_type,
                                    text: item.rejection_reason
                                  })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    border: '1px solid #FECDD3',
                                    background: '#FFF1F2',
                                    color: '#E11D48',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="বিস্তারিত কারণ দেখুন"
                                >
                                  <Eye size={11} />
                                  <span>কারণ দেখুন</span>
                                </button>
                              )}
                              {item.admin_notes && item.status === 'revision_requested' && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedReason({
                                    type: 'revision_requested',
                                    title: 'সংশোধন নির্দেশনা (Admin Instructions)',
                                    requestCode: item.request_code,
                                    providerName: item.payload?.name || 'N/A',
                                    entityType: item.entity_type,
                                    text: item.admin_notes
                                  })}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '3px 8px',
                                    borderRadius: 6,
                                    border: '1px solid #FDE68A',
                                    background: '#FFFBEB',
                                    color: '#D97706',
                                    fontSize: 11,
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                  title="অ্যাডমিন নোট দেখুন"
                                >
                                  <Eye size={11} />
                                  <span>নির্দেশনা</span>
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            {item.status === 'revision_requested' ? (
                              <Link
                                to={item.entity_type === 'hospital' 
                                  ? `/agent/onboard/hospital?edit_code=${item.request_code}` 
                                  : `/agent/onboard/doctor?edit_code=${item.request_code}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '7px 14px',
                                  borderRadius: 8,
                                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                                  color: '#FFFFFF',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  textDecoration: 'none',
                                  boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
                                }}
                              >
                                <Edit3 size={13} />
                                <span>সংশোধন করুন</span>
                              </Link>
                            ) : (
                              <span style={{ fontSize: 12, color: item.status === 'approved' ? '#00B875' : '#94A3B8', fontWeight: item.status === 'approved' ? 800 : 500 }}>
                                {item.status === 'approved' 
                                  ? (item.entity_type === 'hospital' ? '৳১,৫০০ অর্জিত' : '৳৫০০ অর্জিত') 
                                  : item.status === 'rejected' 
                                  ? 'বাতিল' 
                                  : 'অপেক্ষমাণ'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. Mobile Cards (Shown on Mobile < 768px) */}
              <div className="tracker-mobile-cards">
                {filtered.map((item) => {
                  const isDoctor = item.entity_type === 'doctor'
                  const name = item.payload?.name || 'N/A'
                  const nameBn = item.payload?.name_bn || ''
                  const credential = isDoctor 
                    ? `BMDC: ${item.payload?.bmdc || 'N/A'}` 
                    : `লাইসেন্স: ${item.payload?.license_number || 'N/A'}`
                  const commission = item.entity_type === 'hospital' ? '৳১,৫০০' : '৳৫০০'

                  return (
                    <div key={item.id} className="tracker-mobile-card">
                      {/* Top Bar: Entity + Code + Date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: isDoctor ? 'rgba(0, 184, 117, 0.1)' : 'rgba(2, 132, 199, 0.1)',
                            color: isDoctor ? '#00B875' : '#0284C7',
                            border: isDoctor ? '1px solid rgba(0, 184, 117, 0.25)' : '1px solid rgba(2, 132, 199, 0.25)'
                          }}>
                            {isDoctor ? <Stethoscope size={11} /> : <Building2 size={11} />}
                            {isDoctor ? 'ডাক্তার' : 'হাসপাতাল'}
                          </span>
                          <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: '#334155' }}>
                            {item.request_code}
                          </span>
                        </div>
                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={11} />
                          {formatDate(item.created_at)}
                        </span>
                      </div>

                      {/* Middle: Name & Credentials */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                          {name} {nameBn && <span style={{ fontSize: 12.5, fontWeight: 500, color: '#64748B' }}>({nameBn})</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#475569',
                            background: '#F1F5F9',
                            padding: '2px 7px',
                            borderRadius: 5,
                            border: '1px solid #E2E8F0'
                          }}>
                            {credential}
                          </span>
                        </div>
                      </div>

                      {/* Bottom: Status & Audit trigger */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 10,
                        borderTop: '1px solid #F1F5F9',
                        gap: 8,
                        flexWrap: 'wrap'
                      }}>
                        <div>
                          {getStatusBadge(item.status)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {item.rejection_reason && (
                            <button
                              type="button"
                              onClick={() => setSelectedReason({
                                type: 'rejected',
                                title: 'বাতিলের কারণ (Rejection Reason)',
                                requestCode: item.request_code,
                                providerName: name,
                                entityType: item.entity_type,
                                text: item.rejection_reason
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 9px',
                                borderRadius: 6,
                                border: '1px solid #FECDD3',
                                background: '#FFF1F2',
                                color: '#E11D48',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={11} />
                              <span>কারণ দেখুন</span>
                            </button>
                          )}

                          {item.admin_notes && item.status === 'revision_requested' && (
                            <button
                              type="button"
                              onClick={() => setSelectedReason({
                                type: 'revision_requested',
                                title: 'সংশোধন নির্দেশনা (Admin Instructions)',
                                requestCode: item.request_code,
                                providerName: name,
                                entityType: item.entity_type,
                                text: item.admin_notes
                              })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 9px',
                                borderRadius: 6,
                                border: '1px solid #FDE68A',
                                background: '#FFFBEB',
                                color: '#D97706',
                                fontSize: 11,
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <Eye size={11} />
                              <span>নির্দেশনা</span>
                            </button>
                          )}

                          {item.status === 'approved' && (
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#00B875', background: '#ECFDF5', padding: '2px 8px', borderRadius: 6, border: '1px solid #A7F3D0' }}>
                              {commission} অর্জিত
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Full-width action button for revision */}
                      {item.status === 'revision_requested' && (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #FDE68A' }}>
                          <Link
                            to={item.entity_type === 'hospital' 
                              ? `/agent/onboard/hospital?edit_code=${item.request_code}` 
                              : `/agent/onboard/doctor?edit_code=${item.request_code}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '10px 14px',
                              borderRadius: 10,
                              background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                              color: '#FFFFFF',
                              fontSize: 13,
                              fontWeight: 800,
                              textDecoration: 'none',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)',
                              width: '100%',
                              boxSizing: 'border-box'
                            }}
                          >
                            <Edit3 size={14} />
                            <span>আবেদন সংশোধন করুন (Edit / Fix)</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reason / Audit Note Modal */}
      {selectedReason && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20
          }}
          onClick={() => setSelectedReason(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
              animation: 'fadeIn 0.15s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: selectedReason.type === 'rejected' ? '#FFF1F2' : '#FFFBEB'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: selectedReason.type === 'rejected' ? '#FFE4E6' : '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: selectedReason.type === 'rejected' ? '#E11D48' : '#D97706'
                }}>
                  {selectedReason.type === 'rejected' ? <XCircle size={20} /> : <AlertTriangle size={20} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                    {selectedReason.title}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748B' }}>
                    {selectedReason.requestCode} • {selectedReason.providerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReason(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: 6,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#0F172A'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '22px' }}>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {selectedReason.type === 'rejected' ? 'Official Audit Note' : 'Admin Note & Action Required'}
              </div>
              <div style={{
                background: selectedReason.type === 'rejected' ? '#FEF2F2' : '#FFFBEB',
                border: selectedReason.type === 'rejected' ? '1px solid #FECDD3' : '1px solid #FDE68A',
                borderRadius: 12,
                padding: '16px',
                color: selectedReason.type === 'rejected' ? '#991B1B' : '#92400E',
                fontSize: 13.5,
                lineHeight: 1.6,
                fontWeight: 500,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {selectedReason.text}
              </div>

              {selectedReason.type === 'rejected' ? (
                <p style={{ margin: '14px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  💡 ভুয়া বা অসম্পূর্ণ ডকুমেন্টের কারণে অ্যাডমিন ভেরিফিকেশন টিম আবেদনটি বাতিল করেছে। সঠিক ও হালনাগাদ তথ্যাবলি নিয়ে পুনরায় নতুন আবেদন করতে পারেন।
                </p>
              ) : (
                <p style={{ margin: '14px 0 0', fontSize: 12, color: '#64748B', lineHeight: 1.5 }}>
                  💡 অ্যাডমিনের নির্দেশনা অনুযায়ী প্রয়োজনীয় তথ্য বা ডকুমেন্ট সংশোধন করে অবিলম্বে পুনরায় সাবমিট করুন।
                </p>
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '14px 22px',
              background: '#F8FAFC',
              borderTop: '1px solid #F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10
            }}>
              {selectedReason.type === 'revision_requested' && (
                <Link
                  to={selectedReason.entityType === 'hospital'
                    ? `/agent/onboard/hospital?edit_code=${selectedReason.requestCode}`
                    : `/agent/onboard/doctor?edit_code=${selectedReason.requestCode}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: '#FFFFFF',
                    fontSize: 12.5,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Edit3 size={14} />
                  <span>সংশোধন করতে যান</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => setSelectedReason(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: '1px solid #CBD5E1',
                  background: '#FFFFFF',
                  color: '#334155',
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
