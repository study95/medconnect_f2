// DivisionListPage.jsx — Premium Division Management (Admin)
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDivisions, useAdminLocationMutations } from '../../../hooks/admin/useAdminLocations'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

export default function DivisionListPage() {
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Enterprise TanStack Query Hooks
  const { divisions: items, isLoading: loading, refetch: fetchDivisions } = useDivisions()
  const { deleteDivision: saveDeleteDivision, isDeletingDivision: deleting } = useAdminLocationMutations()

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await saveDeleteDivision(deleteTarget.id)
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete division', err)
    }
  }

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.bangla_name?.includes(search)
  )

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [filtered.length])

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🗺️ Divisions</h2>
          <p className="admin-page-subtitle">{items.length} administrative division(s)</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search division by name, Bengali name..."
        onRefresh={fetchDivisions}
        refreshing={loading}
        actions={
          <Link to="/admin/divisions/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
            + Add Division
          </Link>
        }
      />
      <div className="admin-card">
        <div className="admin-card-header" style={{ background: '#F8FAFC' }}>
          <h3 className="admin-card-title">Territorial Database</h3>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444', background: '#FEE2E2', padding: '4px 12px', borderRadius: 20 }}>
            {filtered.length} Active Regions
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={6} columnWidths={['100px', '40%', '35%', '15%']} headers={['ID', 'Division Name', 'Bengali Name', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState searchQuery={search} onClearSearch={() => setSearch('')} icon="🗺️" title="No divisions found" description="Try a different search term or register a new division." primaryAction={{ label: '+ Add Division', to: '/admin/divisions/create' }} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 100, paddingLeft: 24 }}>ID</th>
                  <th>Division Name</th>
                  <th>Bangla Name</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Management Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(item => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <CompactUlid value={item.public_id || item.id} />
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

      <TableFooter
        total={filtered.length}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        perPage={perPage}
        setPerPage={setPerPage}
      />

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
