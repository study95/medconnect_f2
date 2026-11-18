import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ClipboardList, 
  Search, 
  Clock, 
  CheckCircle, 
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
  Edit3
} from 'lucide-react'
import agentApi from '../../api/agentApi'

export default function SubmissionsTrackerPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            background: 'rgba(0, 184, 117, 0.1)',
            color: '#00B875',
            border: '1px solid rgba(0, 184, 117, 0.25)'
          }}>
            <CheckCircle size={13} strokeWidth={2.5} /> Approved &amp; Accrued
          </span>
        )
      case 'rejected':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#FEF2F2',
            color: '#EF4444',
            border: '1px solid #FECDD3'
          }}>
            <XCircle size={13} strokeWidth={2.5} /> Rejected
          </span>
        )
      case 'revision_requested':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#FFFBEB',
            color: '#D97706',
            border: '1px solid #FDE68A'
          }}>
            <AlertTriangle size={13} strokeWidth={2.5} /> Revision Needed
          </span>
        )
      case 'under_review':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#EFF6FF',
            color: '#2563EB',
            border: '1px solid #BFDBFE'
          }}>
            <Clock size={13} strokeWidth={2.5} /> Under Verification
          </span>
        )
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            borderRadius: 8,
            fontSize: 11.5,
            fontWeight: 700,
            background: '#F1F5F9',
            color: '#475569',
            border: '1px solid #E2E8F0'
          }}>
            <Clock size={13} strokeWidth={2.5} /> Submitted
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
      r.payload?.bmdc?.toLowerCase().includes(term)
    )
  })

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>
        {/* Breadcrumb HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>Tracker</span>
          <ChevronRight size={13} />
          <span style={{ color: '#00B875', fontWeight: 700 }}>Submissions Queue</span>
        </div>

        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)'
            }}>
              <ClipboardList size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
                Onboarding Submissions Tracker
              </h1>
              <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0' }}>
                Track real-time BMDC audit progress, approvals, and commission statuses of your candidates.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={fetchRequests}
              title="Refresh Queue"
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
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={16} />
            </button>
            <Link
              to="/agent/onboard/doctor"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 10,
                background: 'linear-gradient(135deg, #00B875 0%, #009E64 100%)',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                textDecoration: 'none',
                boxShadow: '0 4px 12px rgba(0, 184, 117, 0.3)',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>+ Onboard Doctor</span>
            </Link>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 16,
          padding: '14px 18px',
          marginBottom: 20,
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
            <Search size={16} style={{ position: 'absolute', left: 14, top: 13, color: '#94A3B8' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Request Code, Doctor Name, or BMDC..."
              style={{
                width: '100%',
                height: 42,
                padding: '0 14px 0 40px',
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                fontSize: 13.5,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} style={{ color: '#64748B' }} />
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
                background: '#FFFFFF'
              }}
            >
              <option value="">All Verification Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Verification</option>
              <option value="approved">Approved</option>
              <option value="revision_requested">Revision Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#00B875' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Loading submissions...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <ClipboardList size={44} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#334155', margin: 0 }}>No Submissions Found</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 18px' }}>
                Start by registering your first physician candidate to earn partner commissions.
              </p>
              <Link
                to="/agent/onboard/doctor"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '9px 16px',
                  borderRadius: 10,
                  background: '#00B875',
                  color: '#FFFFFF',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none'
                }}
              >
                <Plus size={15} /> + Onboard Doctor Now
              </Link>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '14px 20px' }}>Request Code</th>
                    <th style={{ padding: '14px 16px' }}>Entity</th>
                    <th style={{ padding: '14px 16px' }}>Provider Name</th>
                    <th style={{ padding: '14px 16px' }}>Credentials</th>
                    <th style={{ padding: '14px 16px' }}>Date</th>
                    <th style={{ padding: '14px 20px' }}>Status</th>
                    <th style={{ padding: '14px 20px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody style={{ divideY: '1px solid #F1F5F9' }}>
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
                          color: '#475569',
                          background: '#F1F5F9',
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase'
                        }}>
                          {item.entity_type === 'doctor' ? <Stethoscope size={12} /> : <Building2 size={12} />}
                          {item.entity_type}
                        </span>
                      </td>
                      <td style={{ padding: '16px 16px', fontWeight: 700, color: '#0F172A' }}>
                        {item.payload?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 16px', color: '#64748B', fontSize: 12.5 }}>
                        {item.entity_type === 'doctor' ? `BMDC: ${item.payload?.bmdc || 'N/A'}` : `Lic: ${item.payload?.license_number || 'N/A'}`}
                      </td>
                      <td style={{ padding: '16px 16px', color: '#64748B', fontSize: 12 }}>
                        {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {getStatusBadge(item.status)}
                        {item.rejection_reason && (
                          <div style={{ fontSize: 11.5, color: '#EF4444', marginTop: 4, fontWeight: 600 }}>
                            Reason: {item.rejection_reason}
                          </div>
                        )}
                        {item.admin_notes && item.status === 'revision_requested' && (
                          <div style={{ fontSize: 11.5, color: '#D97706', marginTop: 4, fontWeight: 600 }}>
                            Note: {item.admin_notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        {item.status === 'revision_requested' ? (
                          <Link
                            to={`/agent/onboard/doctor?edit_code=${item.request_code}`}
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
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                              transition: 'all 0.15s'
                            }}
                          >
                            <Edit3 size={13} />
                            <span>সংশোধন করুন (Fix)</span>
                          </Link>
                        ) : (
                          <span style={{ fontSize: 12, color: item.status === 'approved' ? '#00B875' : '#94A3B8', fontWeight: item.status === 'approved' ? 700 : 500 }}>
                            {item.status === 'approved' ? '৳৫০০ অর্জিত' : item.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                          </span>
                        )}
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
  )
}
