import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Container, Table, Button, Badge, Modal } from 'react-bootstrap'
import { IconPlus, IconEdit, IconTrash, IconEye } from '@tabler/icons-react'
import axiosInstance from '../../../api/axiosInstance'
import { toast } from 'react-hot-toast'

export default function ServiceListPage() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [search, setSearch] = useState('')
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchServices = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/admin/services')
      setServices(res.data)
    } catch (err) {
      
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  const handleDelete = async () => {
    try {
      await axiosInstance.delete(`/admin/services/\${deletingId}`)
      
      fetchServices()
      setShowDelete(false)
    } catch (err) {
      
    }
  }

  const filtered = services.filter(s =>
    s.title_en?.toLowerCase().includes(search.toLowerCase()) ||
    s.title_bn?.toLowerCase().includes(search.toLowerCase())
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setCurrentPage(1) }, [filtered.length])

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">Services Management</h2>
          <p className="admin-page-subtitle">Manage healthcare services shown on the website</p>
        </div>
        <Button as={Link} to="/admin/services/create" className="btn-admin-primary">
          <IconPlus size={18} /> Add Service
        </Button>
      </div>

      {/* Search + Show Entries Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-muted)', fontWeight: 600 }}>
          Show
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setCurrentPage(1) }} style={{ padding: '5px 10px', borderRadius: 8, border: '1.5px solid var(--admin-border)', background: 'white', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer', outline: 'none', minWidth: 70 }}>
            {[10, 25, 50, 100, 500].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          entries
        </div>
        <input type="text" placeholder="Search services..." value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1) }} style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', minWidth: 200 }} />
      </div>

      <div className="admin-card">
        <Table responsive hover className="admin-table">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Title (EN)</th>
              <th>Title (BN)</th>
              <th>Status</th>
              <th>Sort</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="text-center py-5">Loading services...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-5">No services found</td></tr>
            ) : paginatedData.map(service => (
              <tr key={service.id}>
                <td>
                  <div className="service-icon-preview">
                    {service.icon?.startsWith('http') ? <img src={service.icon} alt="" width="30" /> : <i className={service.icon}></i>}
                  </div>
                </td>
                <td><strong>{service.title_en}</strong></td>
                <td>{service.title_bn}</td>
                <td>
                  <Badge bg={service.is_active ? 'success' : 'secondary'}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td>{service.sort_order}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button variant="light" size="sm" as={Link} to={`/admin/services/edit/\${service.id}`}>
                      <IconEdit size={16} />
                    </Button>
                    <Button variant="light" size="sm" className="text-danger" onClick={() => { setDeletingId(service.id); setShowDelete(true); }}>
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Bottom Pagination */}
      {(() => {
        const totalPages = Math.ceil(filtered.length / perPage)
        if (filtered.length === 0) return null
        const pages = []
        if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i) }
        else {
          pages.push(1)
          if (currentPage > 3) pages.push('...')
          const start = Math.max(2, currentPage - 1)
          const end = Math.min(totalPages - 1, currentPage + 1)
          for (let i = start; i <= end; i++) pages.push(i)
          if (currentPage < totalPages - 2) pages.push('...')
          pages.push(totalPages)
        }
        const btnBase = { height: 34, minWidth: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: 'white', color: '#0f172a', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }
        const btnActive = { ...btnBase, border: 'none', background: 'linear-gradient(135deg, #00B875, #009E64)', color: '#fff', boxShadow: '0 2px 8px rgba(0,184,117,0.35)' }
        const btnDisabled = { ...btnBase, opacity: 0.4, cursor: 'not-allowed' }
        return (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Showing <strong>{filtered.length === 0 ? 0 : (currentPage - 1) * perPage + 1}</strong>–<strong>{Math.min(currentPage * perPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries</div>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => currentPage > 1 && setCurrentPage(1)} style={currentPage === 1 ? btnDisabled : btnBase}>«</button>
                <button onClick={() => currentPage > 1 && setCurrentPage(p => p - 1)} style={currentPage === 1 ? btnDisabled : btnBase}>‹</button>
                {pages.map((p, i) => p === '...' ? <span key={`d${i}`} style={{ width: 30, textAlign: 'center', color: '#64748b', fontWeight: 700 }}>…</span> : <button key={p} onClick={() => setCurrentPage(p)} style={p === currentPage ? btnActive : btnBase}>{p}</button>)}
                <button onClick={() => currentPage < totalPages && setCurrentPage(p => p + 1)} style={currentPage === totalPages ? btnDisabled : btnBase}>›</button>
                <button onClick={() => currentPage < totalPages && setCurrentPage(totalPages)} style={currentPage === totalPages ? btnDisabled : btnBase}>»</button>
              </div>
            )}
          </div>
        )
      })()}

      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete this service? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>Cancel</Button>
          <Button variant="danger" onClick={handleDelete}>Delete Service</Button>
        </Modal.Footer>
      </Modal>

      <style>{`
        .service-icon-preview {
          width: 40px;
          height: 40px;
          background: var(--admin-bg);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: var(--admin-primary);
        }
      `}</style>
    </div>
  )
}
