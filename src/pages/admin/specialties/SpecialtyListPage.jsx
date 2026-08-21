// SpecialtyListPage.jsx — Premium Specialty Management (Admin)
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getSpecialties, deleteSpecialty } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

export default function SpecialtyListPage() {
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
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
          <h2 className="admin-page-title">🩺 Specialties</h2>
          <p className="admin-page-subtitle">{items.length} medical specialty domain(s)</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search specialty by name, Bengali name..."
        onRefresh={fetchSpecialties}
        refreshing={loading}
        actions={
          isAdmin && (
            <Link to="/admin/specialties/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + Add Specialty
            </Link>
          )
        }
      />
<div className="admin-card">
        <div className="admin-card-header" style={{ background: 'rgba(0,0,0,0.02)' }}>
          <h3 className="admin-card-title" style={{ color: 'var(--admin-text)' }}>Professional Categories</h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--admin-primary)', background: 'rgba(0, 168, 140, 0.1)', padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} Specialties Active
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={6} columnWidths={['100px', '40%', '35%', '15%']} headers={['ID', 'Specialty Name', 'Bengali Title', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState searchQuery={search} onClearSearch={() => setSearch('')} icon="🩺" title="No specialties found" description="Try a different search term or add a new medical specialty." primaryAction={isAdmin ? { label: '+ Add Specialty', to: '/admin/specialties/create' } : undefined} />
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
                      <CompactUlid value={item.public_id || item.id} />
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

      <TableFooter
        total={items ? items.length : 0}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

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
