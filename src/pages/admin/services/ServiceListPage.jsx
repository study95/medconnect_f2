import React, { useState, useEffect, useCallback } from 'react'
import { Table, Modal, Button } from 'react-bootstrap'
import {
  IconTicket, IconSearch, IconRefresh, IconEye, IconTrash,
  IconCheck, IconClock, IconAlertTriangle, IconX, IconCopy,
  IconChecklist
} from '@tabler/icons-react'
import axiosInstance from '../../../api/axiosInstance'
import { toast } from 'react-hot-toast'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

const STATUS_CONFIG = {
  pending:    { label: 'অপেক্ষমাণ',      color: '#F59E0B', bg: '#FEF3C7', icon: <IconClock size={13} /> },
  processing: { label: 'প্রক্রিয়াধীন',   color: '#3B82F6', bg: '#DBEAFE', icon: <IconAlertTriangle size={13} /> },
  resolved:   { label: 'সমাধান হয়েছে',   color: '#10B981', bg: '#D1FAE5', icon: <IconCheck size={13} /> },
  closed:     { label: 'বন্ধ',            color: '#6B7280', bg: '#F3F4F6', icon: <IconX size={13} /> },
}

const PRIORITY_CONFIG = {
  'সাধারণ':       { color: '#6B7280', bg: '#F3F4F6' },
  'জরুরী':        { color: '#F59E0B', bg: '#FEF3C7' },
  'অত্যন্ত জরুরী': { color: '#EF4444', bg: '#FEE2E2' },
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 16,
      padding: '18px 22px',
      border: '1px solid #E2E8F0',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flex: 1,
      minWidth: 160,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      <div style={{
        width: 46, height: 46, borderRadius: 14,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginTop: 2 }}>{label}</div>
      </div>
    </div>
  )
}

export default function ServiceListPage() {
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewTicket, setViewTicket] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [copied, setCopied] = useState(null)
  const [updatingStatus, setUpdatingStatus] = useState(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch dynamic ticket data and database counts
      const res = await axiosInstance.get('/admin/services', {
        params: {
          search: search || undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined,
          priority: filterPriority !== 'all' ? filterPriority : undefined,
          per_page: perPage,
          page: currentPage
        }
      })

      if (res.data?.data) {
        setTickets(res.data.data)
        if (res.data.stats) {
          setStats(res.data.stats)
        }
      } else if (Array.isArray(res.data)) {
        setTickets(res.data)
        setStats({
          total: res.data.length,
          pending: res.data.filter(t => t.status === 'pending').length,
          processing: res.data.filter(t => t.status === 'processing').length,
          resolved: res.data.filter(t => t.status === 'resolved').length,
          closed: res.data.filter(t => t.status === 'closed').length,
        })
      } else {
        setTickets([])
        setStats({ total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 })
      }
    } catch {
      setTickets([])
      setStats({ total: 0, pending: 0, processing: 0, resolved: 0, closed: 0 })
    } finally {
      setLoading(false)
    }
  }, [search, filterStatus, filterPriority, perPage, currentPage])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await axiosInstance.delete(`/admin/services/${deleteId}`)
      setTickets(prev => prev.filter(t => t.id !== deleteId))
      setStats(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }))
      setDeleteId(null)
      if (viewTicket?.id === deleteId) setViewTicket(null)
    } catch {
      setTickets(prev => prev.filter(t => t.id !== deleteId))
      setDeleteId(null)
      if (viewTicket?.id === deleteId) setViewTicket(null)
    }
  }

  const handleStatusChange = async (ticketId, newStatus) => {
    setUpdatingStatus(ticketId)
    try {
      await axiosInstance.patch(`/admin/services/${ticketId}/status`, { status: newStatus })
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
      if (viewTicket?.id === ticketId) setViewTicket(prev => ({ ...prev, status: newStatus }))
      fetchTickets()
    } catch {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t))
      if (viewTicket?.id === ticketId) setViewTicket(prev => ({ ...prev, status: newStatus }))
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleCopy = (text, key) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
    }
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return String(iso)
    }
  }

  const btnBase = { height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
  const btnActive = { ...btnBase, border: 'none', background: 'linear-gradient(135deg, #00B875, #009E64)', color: '#fff', boxShadow: '0 2px 8px rgba(0,184,117,0.35)' }
  const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">সাপোর্ট টিকিট ও অভিযোগ ব্যবস্থাপনা</h2>
          <p className="admin-page-subtitle">ব্যবহারকারীদের প্রেরিত অভিযোগ ও সাপোর্ট রিকোয়েস্ট পরিচালনা করুন</p>
        </div>
        <button
          onClick={fetchTickets}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #00B875, #009E64)', color: 'white', border: 'none', borderRadius: 12, padding: '10px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,184,117,0.25)' }}
        >
          <IconRefresh size={17} /> রিফ্রেশ তালিকা
        </button>
      </div>

      {/* Dynamic Database Count Cards */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
        <StatCard label="মোট অভিযোগ / টিকিট" value={stats.total} icon={<IconTicket size={24} />} color="#00B875" />
        <StatCard label="অপেক্ষমাণ (Pending)" value={stats.pending} icon={<IconClock size={24} />} color="#F59E0B" />
        <StatCard label="প্রক্রিয়াধীন (Processing)" value={stats.processing} icon={<IconAlertTriangle size={24} />} color="#3B82F6" />
        <StatCard label="সমাধান সম্পন্ন (Resolved)" value={stats.resolved} icon={<IconCheck size={24} />} color="#10B981" />
      </div>

      <ListToolbar
        search={search}
        onSearchChange={val => { setSearch(val); setCurrentPage(1) }}
        searchPlaceholder="টিকিট নম্বর, নাম, ফোন বা ইমেইল খুঁজুন..."
        onRefresh={fetchTickets}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(filterStatus !== 'all' || filterPriority !== 'all')}
        onClearFilters={() => { setFilterStatus('all'); setFilterPriority('all'); setCurrentPage(1) }}
        activeFilters={[
          filterStatus !== 'all' && { key: 'status', label: `স্ট্যাটাস: ${STATUS_CONFIG[filterStatus]?.label || filterStatus}`, onRemove: () => { setFilterStatus('all'); setCurrentPage(1) } },
          filterPriority !== 'all' && { key: 'priority', label: `অগ্রাধিকার: ${filterPriority}`, onRemove: () => { setFilterPriority('all'); setCurrentPage(1) } },
        ].filter(Boolean)}
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>স্ট্যাটাস</label>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব স্ট্যাটাস</option>
            <option value="pending">অপেক্ষমাণ (Pending)</option>
            <option value="processing">প্রক্রিয়াধীন (Processing)</option>
            <option value="resolved">সমাধান হয়েছে (Resolved)</option>
            <option value="closed">বন্ধ (Closed)</option>
          </select>
        </div>
        <div style={{ minWidth: 160 }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>অগ্রাধিকার</label>
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value); setCurrentPage(1) }} style={{ height: 38, padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', cursor: 'pointer', background: 'white', fontWeight: 600, width: '100%' }}>
            <option value="all">সব অগ্রাধিকার</option>
            <option value="সাধারণ">সাধারণ</option>
            <option value="জরুরী">জরুরী</option>
            <option value="অত্যন্ত জরুরী">অত্যন্ত জরুরী</option>
          </select>
        </div>
      </ListToolbar>
<div className="admin-card">
        {loading ? (
          <TableSkeleton
            rowCount={6}
            columnWidths={['120px', '22%', '20%', '16%', '12%', '10%']}
            headers={['টিকিট নম্বর', 'প্রেরক ও যোগাযোগ', 'বিষয় ও বিভাগ', 'অগ্রাধিকার', 'স্ট্যাটাস', 'তারিখ', 'অ্যাকশন']}
          />
        ) : tickets.length === 0 ? (
          <EmptyState
            hasFilters={Boolean(filterStatus !== 'all' || filterPriority !== 'all' || search)}
            searchQuery={search}
            onClearFilters={() => { setFilterStatus('all'); setFilterPriority('all'); setCurrentPage(1) }}
            onClearSearch={() => { setSearch(''); setCurrentPage(1) }}
            icon="🎫"
            title="কোনো সাপোর্ট টিকিট পাওয়া যায়নি"
            description="আপনার সার্চ বা ফিল্টারের সাথে মিলে এমন কোনো টিকিট ডাটাবেজে নেই।"
          />
        ) : (
          <Table responsive hover className="admin-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th>টিকিট নম্বর</th>
                <th>প্রেরক ও যোগাযোগ</th>
                <th>অভিযোগের বিষয়</th>
                <th>ক্যাটাগরি</th>
                <th>অগ্রাধিকার</th>
                <th>বর্তমান স্ট্যাটাস</th>
                <th>তারিখ</th>
                <th style={{ textAlign: 'center' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map(ticket => {
                const sc = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.pending
                const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG['সাধারণ']
                const ticketNum = ticket.ticket_number || `TK-${ticket.id}`
                return (
                  <tr key={ticket.id}>
                    <td>
                      <CompactUlid value={ticketNum} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: '#1E293B' }}>{ticket.name}</div>
                      <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>{ticket.contact}</div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, color: '#334155', fontWeight: 600 }} title={ticket.subject}>
                        {ticket.subject}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#334155', background: '#F1F5F9', padding: '3px 10px', borderRadius: 99, fontWeight: 700 }}>
                        {ticket.category || 'সাধারণ'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: pc.color, background: pc.bg, padding: '3px 10px', borderRadius: 99, fontWeight: 800 }}>
                        {ticket.priority || 'সাধারণ'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`, padding: '3px 10px', borderRadius: 99, fontWeight: 800 }}>
                        {sc.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: '#64748B', whiteSpace: 'nowrap' }}>
                      {formatDate(ticket.created_at)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => setViewTicket(ticket)}
                          title="বিস্তারিত ও স্ট্যাটাস পরিবর্তন"
                          style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#0F172A', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                        >
                          <IconEye size={14} /> দেখুন
                        </button>
                        <button
                          onClick={() => handleDelete(ticket.id)}
                          disabled={deleting === ticket.id}
                          title="মুছে ফেলুন"
                          style={{ padding: '6px 8px', borderRadius: 8, border: '1px solid #FEE2E2', background: '#FEF2F2', color: '#EF4444', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </Table>
        )}
      </div>

      <TableFooter
        total={tickets.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

      {/* View Ticket Details Modal */}
      <Modal show={!!viewTicket} onHide={() => setViewTicket(null)} centered size="lg">
        <Modal.Header closeButton style={{ borderBottom: '1px solid #F1F5F9', padding: '18px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconTicket size={22} color="#00B875" />
            </div>
            <div>
              <Modal.Title style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', margin: 0 }}>অভিযোগ ও টিকিটের বিস্তারিত তথ্য</Modal.Title>
              {viewTicket && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 13.5, fontWeight: 900, color: '#00B875' }}>
                    {viewTicket.ticket_number || `TK-${viewTicket.id}`}
                  </span>
                  <button
                    onClick={() => handleCopy(viewTicket.ticket_number || `TK-${viewTicket.id}`, 'modal')}
                    style={{ border: 'none', background: 'transparent', padding: 2, cursor: 'pointer', color: copied === 'modal' ? '#00B875' : '#94A3B8', display: 'flex', alignItems: 'center' }}
                  >
                    <IconCopy size={14} />
                  </button>
                  {copied === 'modal' && <span style={{ fontSize: 11.5, color: '#00B875', fontWeight: 700 }}>কপি সম্পন্ন হয়েছে!</span>}
                </div>
              )}
            </div>
          </div>
        </Modal.Header>
        <Modal.Body style={{ padding: 24 }}>
          {viewTicket && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                {[
                  { label: 'প্রেরকের নাম', value: viewTicket.name },
                  { label: 'মোবাইল / ইমেইল', value: viewTicket.contact },
                  { label: 'ক্যাটাগরি', value: viewTicket.category },
                  { label: 'অগ্রাধিকার মাত্রা', value: viewTicket.priority },
                  { label: 'জমার তারিখ', value: formatDate(viewTicket.created_at || viewTicket.submitted_at) },
                  { label: 'বর্তমান স্ট্যাটাস', value: STATUS_CONFIG[viewTicket.status]?.label || viewTicket.status },
                ].map(item => (
                  <div key={item.label} style={{ background: '#F8FAFC', borderRadius: 12, padding: '12px 16px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{item.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{item.value || '—'}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 18, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>বিষয়</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{viewTicket.subject}</div>
              </div>

              <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '14px 16px', marginBottom: 20, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>বিস্তারিত অভিযোগ ও বার্তা</div>
                <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{viewTicket.message || '—'}</div>
              </div>

              <div>
                <div style={{ fontSize: 12.5, color: '#475569', fontWeight: 800, marginBottom: 10 }}>স্ট্যাটাস পরিবর্তন করুন:</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(viewTicket.id, key)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 7,
                        border: `1.5px solid ${viewTicket.status === key ? cfg.color : '#E2E8F0'}`,
                        background: viewTicket.status === key ? cfg.bg : 'white',
                        color: viewTicket.status === key ? cfg.color : '#64748B',
                        borderRadius: 10, padding: '8px 16px', fontSize: 13, fontWeight: 800, cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {cfg.icon} {cfg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid #F1F5F9', padding: '16px 24px', display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="light"
            onClick={() => { setDeleteId(viewTicket?.id); setViewTicket(null) }}
            style={{ color: '#EF4444', fontWeight: 800, fontSize: 13, border: '1px solid #FEE2E2', background: '#FEF2F2' }}
          >
            <IconTrash size={15} style={{ marginRight: 6 }} /> অভিযোগ মুছুন
          </Button>
          <Button variant="secondary" onClick={() => setViewTicket(null)} style={{ fontWeight: 700 }}>
            বন্ধ করুন
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!deleteId} onHide={() => setDeleteId(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title style={{ fontSize: 16, fontWeight: 800, color: '#EF4444' }}>অভিযোগ মুছে ফেলার নিশ্চিতকরণ</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ fontSize: 14, color: '#475569' }}>
          আপনি কি নিশ্চিত যে এই সাপোর্ট টিকিট/অভিযোগটি ডাটাবেজ থেকে মুছে ফেলতে চান? এই কাজটি পুনরায় ফিরিয়ে আনা যাবে না।
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setDeleteId(null)}>বাতিল</Button>
          <Button variant="danger" onClick={handleDelete} style={{ background: '#EF4444', border: 'none', fontWeight: 800 }}>হ্যাঁ, নিশ্চিত মুছুন</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
