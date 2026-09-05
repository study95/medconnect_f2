// DistrictListPage.jsx — Premium District Management (Admin)
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { useDivisions, useDistricts, useAdminLocationMutations } from '../../../hooks/admin/useAdminLocations'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

// Premium Searchable Select for Filtering
function SearchableSelect({ label, options, value, onChange, placeholder, disabled = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = (options || []).find(opt => opt && String(opt.id) === String(value || ''))
  const filteredOptions = (options || [])
    .filter(opt => opt && opt.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  return (
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 220px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: 'var(--admin-card-bg)', 
          height: 42, padding: '0 14px', border: '1px solid var(--admin-border)', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', color: 'var(--admin-text)'
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span style={{ color: selectedOption ? 'var(--admin-text)' : 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <span style={{ fontSize: 10, color: 'var(--admin-text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'var(--admin-card-bg)', border: '1px solid var(--admin-border)', borderRadius: 12, marginTop: 6,
          boxShadow: 'var(--admin-shadow-lg)', overflow: 'hidden', zIndex: 1000
        }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--admin-border)', background: 'var(--admin-bg)' }}>
            <input 
              type="text" 
              className="admin-form-input" 
              placeholder="Type to search..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              autoFocus 
              style={{ height: 36, fontSize: 13, borderRadius: 8 }}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto', padding: '4px 0' }}>
            <div 
              style={{ 
                padding: '8px 14px', fontSize: 13, cursor: 'pointer', 
                background: !value ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                fontWeight: !value ? 700 : 400,
                borderBottom: '1px solid var(--admin-border)',
                color: 'var(--admin-text)'
              }}
              onClick={() => {
                onChange('')
                setIsOpen(false)
                setSearch('')
              }}
            >
              {placeholder}
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--admin-text-muted)', textAlign: 'center' }}>
                No options matching "{search}"
              </div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: String(value || '') === String(opt.id) ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)',
                    color: 'var(--admin-text)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(245, 158, 11, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = String(value || '') === String(opt.id) ? 'rgba(245, 158, 11, 0.12)' : 'transparent'}
                  onClick={() => {
                    onChange(opt.id.toString())
                    setIsOpen(false)
                    setSearch('')
                  }}
                >
                  <div style={{ fontWeight: String(value || '') === String(opt.id) ? 700 : 500 }}>
                    {opt.name}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function DistrictListPage() {
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const hasFilters = Boolean(search || divisionFilter)

  // Enterprise TanStack Query Hooks
  const { divisions } = useDivisions()
  const { districts: items = [], isLoading: loading, refetch: fetchDistricts } = useDistricts(divisionFilter || null)
  const { deleteDistrict: saveDeleteDistrict, isDeletingDistrict: deleting } = useAdminLocationMutations()

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await saveDeleteDistrict(deleteTarget.id)
      toast.success(res?.data?.message || 'District deleted successfully')
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete district', err)
      toast.error(getErrorMessage(err, 'Failed to delete district'))
    }
  }

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  useEffect(() => {
    setCurrentPage(1)
  }, [filtered.length])

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🏙️</span>
            District Management
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure major regional boundaries for hospital and clinic networks</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search district by name..."
        onRefresh={fetchDistricts}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(divisionFilter)}
        onClearFilters={() => setDivisionFilter('')}
        activeFilters={[
          divisionFilter && { key: 'division', label: `Division: ${divisions.find(d => String(d.id) === String(divisionFilter))?.name || divisionFilter}`, onRemove: () => setDivisionFilter('') },
        ].filter(Boolean)}
        actions={
          <Link to="/admin/districts/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
            + Add District
          </Link>
        }
      >
        <SearchableSelect
          label="Division"
          placeholder="All Divisions"
          options={divisions}
          value={divisionFilter}
          onChange={setDivisionFilter}
        />
      </ListToolbar>
      
      <div className="admin-card">
        <div className="admin-card-header" style={{ background: '#F8FAFC' }}>
          <h3 className="admin-card-title">All Registered Districts</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#E2E8F0', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Entries Found
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={6} columnWidths={['100px', '45%', '30%', '15%']} headers={['ID', 'District Name', 'Division', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(divisionFilter || search)} searchQuery={search} onClearFilters={() => setDivisionFilter('')} onClearSearch={() => setSearch('')} icon="🏙️" title="No districts found" description="Try changing your search keywords or clear division filters." primaryAction={{ label: '+ Add District', to: '/admin/districts/create' }} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24 }}>ID</th>
                  <th>District Name</th>
                  <th>Parent Division</th>
                  <th style={{ textAlign: 'right', paddingRight: 24 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(item => (
                  <tr key={item.id}>
                    <td style={{ paddingLeft: 24 }}>
                      <CompactUlid value={item.public_id || item.id} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.name}</div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-block', fontSize: 11, color: '#B45309', background: '#FFFBEB', padding: '4px 12px', borderRadius: 8, fontWeight: 800 }}>
                        {item.division?.name || divisions.find(d => d.id === item.division_id)?.name || '—'}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => navigate(`/admin/districts/edit/${item.id}`)}
                          style={{ borderRadius: 8 }}
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={() => setDeleteTarget(item)}
                          style={{ borderRadius: 8 }}
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
        title="Delete District" 
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All associated upazilas and clinics will be affected.`} 
        onConfirm={handleDelete} 
        onCancel={() => setDeleteTarget(null)} 
        loading={deleting} 
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-container { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 1; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
