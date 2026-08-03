// DivisionListPage.jsx — Premium Division Management (Admin)
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDivisions, deleteDivision } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'

export default function DivisionListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchDivisions()
  }, [])

  const fetchDivisions = async () => {
    try {
      setLoading(true)
      const res = await getDivisions()
      setItems(res.data.data || res.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load divisions'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteDivision(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      toast.success('Division deleted successfully')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">
            <span style={{ marginRight: 12 }}>🏢</span>
            National Divisions
          </h2>
          <p className="admin-page-subtitle">Manage top-tier administrative regions for clinical service distribution</p>
        </div>
        <Link to="/admin/divisions/create" className="admin-btn admin-btn-primary" style={{ background: '#EF4444', borderRadius: 12 }}>
          + Add New Division
        </Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid #EF4444' }}>
        <div className="admin-card-body">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="status-select" 
                placeholder="Search divisions by name..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', height: 46, paddingLeft: 44, border: '1px solid #E2E8F0', borderRadius: 12 }}
              />
              <span style={{ position: 'absolute', left: 16, top: 13, fontSize: 18 }}>🔍</span>
            </div>
            <button className="admin-btn admin-btn-primary" onClick={fetchDivisions} style={{ height: 46, background: '#EF4444', padding: '0 30px', borderRadius: 12 }}>
              Sync Data
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: '#F8FAFC' }}>
          <h3 className="admin-card-title">Territorial Database</h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} Active Regions
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Loading Territories...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60 }}>
            <div className="admin-empty-icon">🏢</div>
            <h4>No Divisions Found</h4>
            <p>The national territory database is currently empty.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 100, paddingLeft: 24 }}>System ID</th>
                  <th>Territory Name</th>
                  <th>Bangla Name</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Management Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <span style={{ fontWeight: 800, color: '#94A3B8', fontSize: 13 }}>#{item.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: '#1E293B', fontSize: 16 }}>{item.name}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: '#64748B', fontSize: 14 }}>{item.bangla_name || '—'}</div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => navigate(`/admin/divisions/edit/${item.id}`)}
                          style={{ borderRadius: 10, padding: '8px 16px' }}
                        >
                          ✏️ Edit Region
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={() => setDeleteTarget(item)}
                          style={{ borderRadius: 10, width: 40 }}
                        >
                          🗑️
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

      <DeleteModal 
        show={!!deleteTarget} 
        title="Delete Division" 
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All nested districts, upazilas, and unions will be orphaned or deleted.`} 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
