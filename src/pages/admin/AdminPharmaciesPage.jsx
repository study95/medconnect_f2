import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Building2, Search, Filter, Phone, MapPin, 
  Clock, ShieldAlert, CheckCircle2, AlertTriangle, Trash2, 
  RefreshCw, ChevronLeft, ChevronRight, ExternalLink,
  Store, ShieldCheck, X, FileText, Eye, CheckCircle, AlertCircle
} from 'lucide-react'
import {
  getAdminPharmacies,
  getAdminPharmacyStats,
  verifyAdminPharmacy,
  rejectAdminPharmacy,
  updateAdminPharmacyStatus,
  deleteAdminPharmacy
} from '../../api/pharmacyApi'
import { getDistricts } from '../../api/locationApi'
import { useAuth } from '../../context/AuthContext'
import ListToolbar from '../../components/admin/ListToolbar'
import TableFooter from '../../components/admin/TableFooter'
import EmptyState from '../../components/common/EmptyState'
import { TableSkeleton } from '../../components/common/Skeletons'
import DeleteModal from '../../components/admin/DeleteModal'
import { Modal, Spinner } from 'react-bootstrap'

const enToBn = { '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪', '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯' }
const toBn = (str) => str !== null && str !== undefined && str !== '' ? String(str).replace(/\d/g, d => enToBn[d] || d) : ''

export default function AdminPharmaciesPage() {
  const { user } = useAuth()

  // Data States
  const [pharmacies, setPharmacies] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, active: 0, rejected: 0, verified: 0, open_24h: 0 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [districts, setDistricts] = useState([])

  // Filters & Pagination
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all', 'pending', 'active', 'rejected'
  const [districtFilter, setDistrictFilter] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(15)
  const [pagination, setPagination] = useState({ total: 0, from: 0, to: 0, lastPage: 1 })

  // Action Modals State
  const [verifyTarget, setVerifyTarget] = useState(null)
  const [verifying, setVerifying] = useState(false)

  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [rejectError, setRejectError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Document Inspection Viewer Modal
  const [docViewer, setDocViewer] = useState(null) // { pharmacyId, pharmacyName, docType, title }

  // Load Districts on mount
  useEffect(() => {
    getDistricts().then(res => setDistricts(res.data?.data || [])).catch(() => {})
  }, [])

  // Fetch Stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await getAdminPharmacyStats()
      if (res.data?.success) {
        setStats(res.data.data)
      }
    } catch {} finally {
      setStatsLoading(false)
    }
  }, [])

  // Fetch Pharmacies
  const fetchPharmacies = useCallback(async () => {
    setLoading(true)
    try {
      const params = {
        page,
        per_page: perPage,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        district_id: districtFilter || undefined,
      }
      const res = await getAdminPharmacies(params)
      if (res.data?.success) {
        setPharmacies(res.data.data.data || [])
        setPagination({
          total: res.data.data.total,
          from: res.data.data.from,
          to: res.data.data.to,
          lastPage: res.data.data.last_page,
        })
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [page, perPage, search, statusFilter, districtFilter])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  useEffect(() => {
    fetchPharmacies()
  }, [fetchPharmacies])

  // Handle Verify Pharmacy
  const confirmVerify = async () => {
    if (!verifyTarget) return
    setVerifying(true)
    try {
      const res = await verifyAdminPharmacy(verifyTarget.id)
      if (res.data?.success) {
        setVerifyTarget(null)
        fetchPharmacies()
        fetchStats()
      }
    } catch {} finally {
      setVerifying(false)
    }
  }

  // Handle Reject Pharmacy
  const confirmReject = async () => {
    if (!rejectTarget) return
    if (!rejectionReason.trim()) {
      setRejectError('বাতিল বা সংশোধনের কারণ উল্লেখ করুন।')
      return
    }
    setRejecting(true)
    setRejectError('')
    try {
      const res = await rejectAdminPharmacy(rejectTarget.id, { reason: rejectionReason.trim() })
      if (res.data?.success) {
        setRejectTarget(null)
        setRejectionReason('')
        fetchPharmacies()
        fetchStats()
      }
    } catch (err) {
      setRejectError(err.response?.data?.message || 'বাতিলকরণ ব্যর্থ হয়েছে।')
    } finally {
      setRejecting(false)
    }
  }

  // Handle Delete Pharmacy
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await deleteAdminPharmacy(deleteTarget.id)
      if (res.data?.success) {
        setDeleteTarget(null)
        fetchPharmacies()
        fetchStats()
      }
    } catch {} finally {
      setDeleting(false)
    }
  }

  const resolveDocStreamUrl = (pharmacyId, docType) => {
    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    return `${apiBase}/v1/admin/pharmacies/${pharmacyId}/document/${docType}`
  }

  return (
    <div className="admin-page-container">
      {/* ── TOP STATS BAR ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14, marginBottom: 24 }}>
        <div className="admin-stat-card" style={{ background: '#FFFFFF', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>সর্বমোট ফার্মেসি</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>
            {statsLoading ? <Spinner animation="border" size="sm" /> : toBn(stats.total)}
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#FFFBEB', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #FDE68A', boxShadow: '0 2px 6px rgba(217, 119, 6, 0.05)' }}>
          <div style={{ fontSize: 12, color: '#B45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>অপেক্ষমাণ (Pending)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 4 }}>
            {statsLoading ? <Spinner animation="border" size="sm" /> : toBn(stats.pending)}
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#ECFDF5', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #A7F3D0', boxShadow: '0 2px 6px rgba(5, 150, 105, 0.05)' }}>
          <div style={{ fontSize: 12, color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>যাচাইকৃত (Verified)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>
            {statsLoading ? <Spinner animation="border" size="sm" /> : toBn(stats.verified)}
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#FEF2F2', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #FECACA', boxShadow: '0 2px 6px rgba(220, 38, 38, 0.05)' }}>
          <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>বাতিলকৃত (Rejected)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>
            {statsLoading ? <Spinner animation="border" size="sm" /> : toBn(stats.rejected)}
          </div>
        </div>

        <div className="admin-stat-card" style={{ background: '#EFF6FF', padding: '16px 20px', borderRadius: 16, border: '1.5px solid #BFDBFE', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.05)' }}>
          <div style={{ fontSize: 12, color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>২৪ ঘণ্টা জরুরি</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#2563EB', marginTop: 4 }}>
            {statsLoading ? <Spinner animation="border" size="sm" /> : toBn(stats.open_24h)}
          </div>
        </div>
      </div>

      {/* ── TOOLBAR & FILTERS ── */}
      <div style={{ background: '#FFFFFF', padding: '18px 20px', borderRadius: 16, border: '1.5px solid #E2E8F0', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, background: '#F1F5F9', padding: 4, borderRadius: 12 }}>
            {[
              { id: 'all', label: 'সবগুলো' },
              { id: 'pending', label: 'অপেক্ষমাণ' },
              { id: 'active', label: 'সক্রিয় ও ভেরিফাইড' },
              { id: 'rejected', label: 'বাতিলকৃত' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setStatusFilter(tab.id); setPage(1) }}
                style={{
                  padding: '7px 16px',
                  borderRadius: 9,
                  border: 'none',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: statusFilter === tab.id ? '#FFFFFF' : 'transparent',
                  color: statusFilter === tab.id ? '#0F172A' : '#64748B',
                  boxShadow: statusFilter === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & District Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: 240 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: '#94A3B8' }} />
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="ফার্মেসি বা লাইসেন্স খুঁজুন..."
                className="form-control"
                style={{ paddingLeft: 36, height: 40, borderRadius: 10, fontSize: 13 }}
              />
            </div>

            <select
              value={districtFilter}
              onChange={e => { setDistrictFilter(e.target.value); setPage(1) }}
              className="form-select"
              style={{ width: 170, height: 40, borderRadius: 10, fontSize: 13 }}
            >
              <option value="">সকল জেলা</option>
              {districts.map(d => (
                <option key={d.id} value={d.id}>{d.bangla_name || d.name}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => { fetchPharmacies(); fetchStats() }}
              className="btn btn-outline-secondary"
              title="রিফ্রেশ করুন"
              style={{ height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div style={{ background: '#FFFFFF', borderRadius: 16, border: '1.5px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24 }}>
            <TableSkeleton rows={6} />
          </div>
        ) : pharmacies.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <EmptyState
              icon={Store}
              title="কোনো ফার্মেসির তথ্য পাওয়া যায়নি"
              description="আপনার অনুসন্ধানের সাথে মিলে এমন কোনো ফার্মেসি এই তালিকায় নেই।"
            />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle" style={{ marginBottom: 0 }}>
              <thead style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                <tr>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>ফার্মেসির নাম ও মালিক</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>যোগাযোগ</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>অবস্থান ও ঠিকানা</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>কাগজপত্র ও লাইসেন্স</th>
                  <th style={{ padding: '14px 16px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>স্ট্যাটাস</th>
                  <th style={{ padding: '14px 18px', fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'right' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    {/* Name & Owner */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: '#ECFDF5', color: '#059669',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 800, fontSize: 16, flexShrink: 0
                        }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>{p.name}</span>
                            {p.is_verified && <ShieldCheck size={16} color="#059669" />}
                          </div>
                          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
                            মালিক: <strong>{p.proprietor_name}</strong>
                          </div>
                          <div style={{ fontSize: 11, color: '#0284C7', background: '#F0F9FF', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4 }}>
                            {p.pharmacy_type === 'model_pharmacy' ? 'মডেল ফার্মেসি' : p.pharmacy_type === 'hospital_attached' ? 'হাসপাতাল সংলগ্ন' : 'খুচরা ফার্মেসি'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Phone size={13} color="#64748B" />
                        <span>{p.contact_number}</span>
                      </div>
                      {p.whatsapp_number && (
                        <div style={{ fontSize: 12, color: '#059669', marginTop: 3 }}>
                          WhatsApp: {p.whatsapp_number}
                        </div>
                      )}
                      {p.is_24_hours ? (
                        <span style={{ fontSize: 11, color: '#2563EB', background: '#EFF6FF', padding: '2px 6px', borderRadius: 4, display: 'inline-block', marginTop: 4, fontWeight: 700 }}>
                          🌙 ২৪ ঘণ্টা খোলা
                        </span>
                      ) : (
                        <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 4 }}>
                          সময়: {toBn(p.opening_time?.substring(0, 5))} - {toBn(p.closing_time?.substring(0, 5))}
                        </div>
                      )}
                    </td>

                    {/* Address */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        {[p.upazila?.bangla_name, p.district?.bangla_name].filter(Boolean).join(', ')}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        {p.village_or_area || p.address_line || 'ঠিকানা দেওয়া নেই'}
                      </div>
                    </td>

                    {/* Legal Documents View Buttons */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Drug License */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>ড্রাগ লাইসেন্স:</span>
                          {p.drug_license_path ? (
                            <button
                              type="button"
                              onClick={() => setDocViewer({
                                pharmacyId: p.id,
                                pharmacyName: p.name,
                                docType: 'drug_license',
                                title: `ড্রাগ লাইসেন্স (${p.drug_license_number || 'ডকুমেন্ট'})`
                              })}
                              className="btn btn-sm btn-outline-primary"
                              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={12} /> দেখুন
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#DC2626' }}>নেই</span>
                          )}
                        </div>

                        {/* NID */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>NID:</span>
                          {p.nid_document_path ? (
                            <button
                              type="button"
                              onClick={() => setDocViewer({
                                pharmacyId: p.id,
                                pharmacyName: p.name,
                                docType: 'nid',
                                title: `জাতীয় পরিচয়পত্র (${p.nid_number || 'ডকুমেন্ট'})`
                              })}
                              className="btn btn-sm btn-outline-secondary"
                              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={12} /> দেখুন
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#DC2626' }}>নেই</span>
                          )}
                        </div>

                        {/* Trade License */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>ট্রেড লাইসেন্স:</span>
                          {p.trade_license_path ? (
                            <button
                              type="button"
                              onClick={() => setDocViewer({
                                pharmacyId: p.id,
                                pharmacyName: p.name,
                                docType: 'trade_license',
                                title: `ট্রেড লাইসেন্স (${p.trade_license_number || 'ডকুমেন্ট'})`
                              })}
                              className="btn btn-sm btn-outline-secondary"
                              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={12} /> দেখুন
                            </button>
                          ) : (
                            <span style={{ fontSize: 11, color: '#DC2626' }}>নেই</span>
                          )}
                        </div>

                        {/* Pharmacist Cert */}
                        {p.pharmacist_certificate_path && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 11.5, color: '#334155', fontWeight: 600 }}>ফার্মাসিস্ট:</span>
                            <button
                              type="button"
                              onClick={() => setDocViewer({
                                pharmacyId: p.id,
                                pharmacyName: p.name,
                                docType: 'pharmacist_cert',
                                title: `ফার্মাসিস্ট সার্টিফিকেট (${p.pharmacist_registration_no || 'সনদ'})`
                              })}
                              className="btn btn-sm btn-outline-info"
                              style={{ padding: '2px 8px', fontSize: 11, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={12} /> দেখুন
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '16px' }}>
                      {p.status === 'pending' && (
                        <span style={{
                          background: '#FEF3C7', color: '#B45309',
                          padding: '4px 10px', borderRadius: 99,
                          fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <Clock size={13} /> অপেক্ষমাণ
                        </span>
                      )}
                      {p.status === 'active' && (
                        <span style={{
                          background: '#ECFDF5', color: '#047857',
                          padding: '4px 10px', borderRadius: 99,
                          fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <CheckCircle size={13} /> {p.is_verified ? 'যাচাইকৃত' : 'সক্রিয়'}
                        </span>
                      )}
                      {p.status === 'rejected' && (
                        <span style={{
                          background: '#FEF2F2', color: '#B91C1C',
                          padding: '4px 10px', borderRadius: 99,
                          fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4
                        }}>
                          <AlertCircle size={13} /> বাতিলকৃত
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        {p.status !== 'active' && (
                          <button
                            type="button"
                            onClick={() => setVerifyTarget(p)}
                            className="btn btn-sm"
                            title="যাচাই ও অনুমোদন করুন"
                            style={{
                              background: '#059669', color: '#FFFFFF',
                              fontWeight: 700, fontSize: 12, borderRadius: 8, padding: '6px 12px',
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}
                          >
                            <ShieldCheck size={14} /> অনুমোদন
                          </button>
                        )}

                        {p.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => { setRejectTarget(p); setRejectionReason(''); setRejectError('') }}
                            className="btn btn-sm btn-outline-warning"
                            title="বাতিল বা সংশোধন অনুরোধ"
                            style={{ fontWeight: 700, fontSize: 12, borderRadius: 8, padding: '6px 10px' }}
                          >
                            বাতিল
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="btn btn-sm btn-outline-danger"
                          title="মুছে ফেলুন"
                          style={{ borderRadius: 8, padding: '6px 10px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TABLE FOOTER ── */}
        {!loading && pagination.total > 0 && (
          <TableFooter
            page={page}
            perPage={perPage}
            total={pagination.total}
            from={pagination.from}
            to={pagination.to}
            lastPage={pagination.lastPage}
            onPageChange={p => setPage(p)}
            onPerPageChange={pp => { setPerPage(pp); setPage(1) }}
          />
        )}
      </div>

      {/* ── 1. SECURE DOCUMENT INSPECTION VIEWER MODAL ── */}
      <Modal
        show={!!docViewer}
        onHide={() => setDocViewer(null)}
        size="lg"
        centered
        backdrop="static"
      >
        <Modal.Header closeButton style={{ padding: '16px 20px', borderBottom: '1.5px solid #E2E8F0' }}>
          <div>
            <h5 style={{ fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {docViewer?.title}
            </h5>
            <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>
              ফার্মেসি: <strong>{docViewer?.pharmacyName}</strong> (সুরক্ষিত প্রাইভেট ভল্ট স্ট্রিমিং)
            </div>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, background: '#F8FAFC', minHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {docViewer && (
            <iframe
              src={resolveDocStreamUrl(docViewer.pharmacyId, docViewer.docType)}
              title={docViewer.title}
              style={{ width: '100%', height: 580, border: 'none' }}
            />
          )}
        </Modal.Body>
        <Modal.Footer style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={16} color="#059669" />
            <span>এই ডকুমেন্টটি শুধুমাত্র অনুমোদিত অ্যাডমিন হিসেবে আপনি দেখতে পাচ্ছেন।</span>
          </div>
          <button
            type="button"
            onClick={() => setDocViewer(null)}
            className="btn btn-secondary"
            style={{ borderRadius: 8, fontSize: 13, fontWeight: 700 }}
          >
            বন্ধ করুন
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── 2. APPROVE & VERIFY CONFIRMATION MODAL ── */}
      <Modal
        show={!!verifyTarget}
        onHide={() => !verifying && setVerifyTarget(null)}
        centered
      >
        <Modal.Body style={{ padding: '28px 24px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: '#ECFDF5', color: '#059669',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16
          }}>
            <ShieldCheck size={36} />
          </div>

          <h4 style={{ fontWeight: 900, color: '#0F172A', fontSize: 19, marginBottom: 8 }}>
            ফার্মেসি অনুমোদন ও যাচাই করবেন?
          </h4>
          <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
            আপনি কি নিশ্চিত যে <strong>{verifyTarget?.name}</strong>-এর ড্রাগ লাইসেন্স ও অন্যান্য কাগজপত্র যথাযথভাবে পরীক্ষা করেছেন? অনুমোদনের পর এটি সরাসরি পাবলিক তালিকায় <strong>ভেরিফাইড ব্যাজ</strong> সহ প্রকাশিত হবে।
          </p>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              disabled={verifying}
              onClick={() => setVerifyTarget(null)}
              className="btn btn-light"
              style={{ flex: 1, padding: '11px', borderRadius: 10, fontWeight: 700 }}
            >
              বাতিল
            </button>
            <button
              type="button"
              disabled={verifying}
              onClick={confirmVerify}
              style={{
                flex: 1.3, padding: '11px', borderRadius: 10,
                background: '#059669', color: '#FFFFFF',
                fontWeight: 800, border: 'none',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              {verifying ? <Spinner animation="border" size="sm" /> : 'হ্যাঁ, অনুমোদন করুন'}
            </button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ── 3. REJECT WITH REASON MODAL ── */}
      <Modal
        show={!!rejectTarget}
        onHide={() => !rejecting && setRejectTarget(null)}
        centered
      >
        <Modal.Header closeButton style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
          <h5 style={{ fontWeight: 800, color: '#991B1B', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
            <AlertTriangle size={18} />
            <span>আবেদন বাতিল বা সংশোধনের কারণ</span>
          </h5>
        </Modal.Header>
        <Modal.Body style={{ padding: '20px' }}>
          <p style={{ fontSize: 13, color: '#475569', marginBottom: 14 }}>
            <strong>{rejectTarget?.name}</strong>-এর আবেদনে কী সমস্যা পাওয়া গেছে তা বিস্তারিত লিখুন। আবেদনকারী তার ড্যাশবোর্ডে এই বার্তাটি দেখতে পাবেন।
          </p>

          <textarea
            rows={4}
            value={rejectionReason}
            onChange={e => { setRejectionReason(e.target.value); setRejectError('') }}
            placeholder="যেমন: ড্রাগ লাইসেন্সটি অস্পষ্ট বা মেয়াদোত্তীর্ণ। অনুগ্রহ করে স্পষ্ট কপি পুনরায় আপলোড করুন।"
            className={`form-control ${rejectError ? 'is-invalid' : ''}`}
            style={{ fontSize: 13, borderRadius: 10 }}
          />
          {rejectError && (
            <div style={{ color: '#DC2626', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
              {rejectError}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ padding: '12px 20px', borderTop: '1px solid #E2E8F0' }}>
          <button
            type="button"
            disabled={rejecting}
            onClick={() => setRejectTarget(null)}
            className="btn btn-light"
            style={{ borderRadius: 8, fontSize: 13, fontWeight: 700 }}
          >
            বাতিল
          </button>
          <button
            type="button"
            disabled={rejecting}
            onClick={confirmReject}
            className="btn btn-danger"
            style={{ borderRadius: 8, fontSize: 13, fontWeight: 800 }}
          >
            {rejecting ? <Spinner animation="border" size="sm" /> : 'কারণ সহ বাতিল করুন'}
          </button>
        </Modal.Footer>
      </Modal>

      {/* ── 4. DELETE MODAL ── */}
      <DeleteModal
        isOpen={!!deleteTarget}
        title="ফার্মেসি মুছে ফেলতে চান?"
        message={`আপনি কি নিশ্চিতভাবে "${deleteTarget?.name}" ফার্মেসি ও এর সমস্ত নথিপত্র স্থায়ীভাবে মুছে ফেলতে চান?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleting}
      />
    </div>
  )
}
