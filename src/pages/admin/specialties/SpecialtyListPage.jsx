// SpecialtyListPage.jsx — Premium Specialty Management (Admin)
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSpecialties, deleteSpecialty } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'

export default function SpecialtyListPage() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getSpecialties()
      setItems(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
} finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteSpecialty(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      
    } catch (err) {
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
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🏷️</span>
            Medical Specialties
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Categorize healthcare professionals for optimized patient matching</p>
        </div>
        <Link to="/admin/specialties/create" className="admin-btn admin-btn-primary" style={{ background: 'var(--admin-primary)', borderRadius: 12, padding: '12px 24px' }}>
          + Add Specialty
        </Link>
      </div>

      <div className="admin-card" style={{ marginBottom: 28, borderTop: '4px solid var(--admin-primary)' }}>
        <div className="admin-card-body">
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input 
                type="text" 
                className="admin-form-input" 
                placeholder="Search specialties (e.g. Cardiology, Neurology)..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                style={{ width: '100%', height: 46, paddingLeft: 44, borderRadius: 12 }}
              />
              <span style={{ position: 'absolute', left: 16, top: 13, fontSize: 18 }}>🔍</span>
            </div>
            <button className="admin-btn admin-btn-primary" onClick={fetchData} style={{ height: 46, background: 'var(--admin-primary)', padding: '0 30px', borderRadius: 12 }}>
              Sync Records
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: 'rgba(0,0,0,0.02)' }}>
          <h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>Professional Categories</h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-primary)', background: 'rgba(0, 168, 140, 0.1)', padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} Specialties Active
          </span>
        </div>

        {loading ? (
          <div className="admin-loading" style={{ padding: 60 }}><div className="admin-spinner" /> Validating Database...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty" style={{ padding: 60, textAlign: 'center' }}>
            <div className="admin-empty-icon" style={{ fontSize: 40, marginBottom: 16 }}>🏷️</div>
            <h4 style={{ color: 'var(--admin-text)' }}>No Categories Found</h4>
            <p style={{ color: 'var(--admin-text-muted)' }}>You haven't added any medical specialties yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 100, paddingLeft: 24, color: 'var(--admin-text-muted)' }}>ID</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>Specialty Designation</th>
                  <th style={{ color: 'var(--admin-text-muted)' }}>URL Slug</th>
                  <th style={{ textAlign: 'right', paddingRight: 24, color: 'var(--admin-text-muted)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <span style={{ fontWeight: 800, color: 'var(--admin-text-muted)', fontSize: 13 }}>#{item.id}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 800, color: 'var(--admin-text)', fontSize: 16 }}>{item.name}</div>
                    </td>
                    <td>
                      <code style={{ fontSize: 12, color: 'var(--admin-text-muted)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 4 }}>
                        /{item.slug || 'no-slug'}
                      </code>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end', display: 'flex', gap: 12 }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => navigate(`/admin/specialties/edit/${item.id}`)}
                          style={{ borderRadius: 10, padding: '8px 16px' }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={() => setDeleteTarget(item)}
                          style={{ borderRadius: 10, width: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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
        title="Delete Specialty" 
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This might affect doctor listings.`} 
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
