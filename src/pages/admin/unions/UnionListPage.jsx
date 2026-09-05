// UnionListPage.jsx — Premium Union Management with Triple-Tier Cascading Filters
import { getErrorMessage } from '../../../utils/errorHelper'
import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { 
  useDivisions, 
  useDistricts, 
  useUpazilas, 
  useUnions, 
  useAdminLocationMutations 
} from '../../../hooks/admin/useAdminLocations'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'

// Premium Searchable Select Component for Filters
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
    <div className="searchable-select-container" ref={dropdownRef} style={{ position: 'relative', flex: '1 1 180px', opacity: disabled ? 0.6 : 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div 
        className="status-select" 
        style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'var(--admin-bg)' : 'var(--admin-card-bg)', 
          height: 42, padding: '0 14px', border: '1px solid var(--admin-border)', borderRadius: 10, 
          fontSize: 13, fontWeight: 500, boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', transition: 'all 0.2s',
          color: 'var(--admin-text)'
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
              autoFocus
              placeholder="Search..." 
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', outline: 'none', fontSize: 13, background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              onClick={e => e.stopPropagation()}
            />
          </div>
          <div style={{ maxHeight: 200, overflowY: 'auto' }}>
            <div 
              style={{ padding: '10px 14px', fontSize: 12, cursor: 'pointer', color: '#4F46E5', fontWeight: 700, textAlign: 'center', background: 'rgba(79, 70, 229, 0.08)' }}
              onClick={() => { onChange(''); setIsOpen(false); setSearch('') }}
            >
              ✕ Clear Filter
            </div>
            {filteredOptions.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>No results</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt.id} 
                  style={{ 
                    padding: '10px 14px', fontSize: 13, cursor: 'pointer', 
                    background: String(value || '') === String(opt.id) ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                    borderBottom: '1px solid var(--admin-border)',
                    color: 'var(--admin-text)'
                  }}
                  onMouseEnter={(e) => e.target.style.background = 'rgba(79, 70, 229, 0.05)'}
                  onMouseLeave={(e) => e.target.style.background = String(value || '') === String(opt.id) ? 'rgba(79, 70, 229, 0.1)' : 'transparent'}
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

export default function UnionListPage() {
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  
  // Filtering States
  const [divisionFilter, setDivisionFilter] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [upazilaFilter, setUpazilaFilter] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Enterprise TanStack Query Hooks
  const { divisions } = useDivisions()
  const { districts = [] } = useDistricts(divisionFilter || null)
  const { upazilas = [] } = useUpazilas(districtFilter || null)
  const { unions: items = [], isLoading: loading, refetch: fetchItems } = useUnions(upazilaFilter || null)
  const { deleteUnion: saveDeleteUnion, isDeletingUnion: deleting } = useAdminLocationMutations()

  const handleDivisionChange = (val) => {
    setDivisionFilter(val)
    setDistrictFilter('')
    setUpazilaFilter('')
  }

  const handleDistrictChange = (val) => {
    setDistrictFilter(val)
    setUpazilaFilter('')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await saveDeleteUnion(deleteTarget.id)
      toast.success(res?.data?.message || 'Union deleted successfully')
      setDeleteTarget(null)
    } catch (err) {
      console.error('Failed to delete union', err)
      toast.error(getErrorMessage(err, 'Failed to delete union'))
    }
  }

  const clearFilters = () => {
    setSearch('')
    setDivisionFilter('')
    setDistrictFilter('')
    setUpazilaFilter('')
  }

  const filtered = items.filter(i => 
    i.name?.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  const hasActiveFilters = Boolean(search || divisionFilter || districtFilter || upazilaFilter)

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>🏡</span>
            Union Council Management
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Configure grassroots administrative unions for precision patient catchment</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search union by name..."
        onRefresh={fetchItems}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(divisionFilter || districtFilter || upazilaFilter)}
        onClearFilters={() => { setDivisionFilter(''); setDistrictFilter(''); setUpazilaFilter('') }}
        activeFilters={[
          divisionFilter && { key: 'division', label: `Division: ${divisions.find(d => String(d.id) === String(divisionFilter))?.name || divisionFilter}`, onRemove: () => handleDivisionChange('') },
          districtFilter && { key: 'district', label: `District: ${districts.find(d => String(d.id) === String(districtFilter))?.name || districtFilter}`, onRemove: () => handleDistrictChange('') },
          upazilaFilter && { key: 'upazila', label: `Upazila: ${upazilas.find(u => String(u.id) === String(upazilaFilter))?.name || upazilaFilter}`, onRemove: () => setUpazilaFilter('') },
        ].filter(Boolean)}
        actions={
          <Link to="/admin/unions/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
            + Add Union
          </Link>
        }
      >
        <SearchableSelect label="Division" placeholder="All Divisions" options={divisions} value={divisionFilter} onChange={handleDivisionChange} />
        <SearchableSelect label="District" placeholder="All Districts" options={districts} value={districtFilter} onChange={handleDistrictChange} disabled={!divisionFilter} />
        <SearchableSelect label="Upazila" placeholder="All Upazilas" options={upazilas} value={upazilaFilter} onChange={setUpazilaFilter} disabled={!districtFilter} />
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header" style={{ background: '#F8FAFC' }}>
          <h3 className="admin-card-title">Geographic Data Table</h3>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', background: '#E2E8F0', padding: '4px 10px', borderRadius: 20 }}>
            {filtered.length} Entries
          </span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={6} columnWidths={['100px', '40%', '35%', '15%']} headers={['ID', 'Union Name', 'Parent Upazila', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(divisionFilter || districtFilter || upazilaFilter || search)} searchQuery={search} onClearFilters={() => { setDivisionFilter(''); setDistrictFilter(''); setUpazilaFilter('') }} onClearSearch={() => setSearch('')} icon="🏡" title="No unions found" description="Try adjusting your filters or add a new union." primaryAction={{ label: '+ Add Union', to: '/admin/unions/create' }} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 80, paddingLeft: 24 }}>ID</th>
                  <th>Union Name</th>
                  <th>Parent Hierarchy</th>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {item.upazila?.district?.division?.name || '—'}
                        </span>
                        <span style={{ color: '#CBD5E1' }}>›</span>
                        <span style={{ fontSize: 11, color: '#00A88C', background: '#F0FDFA', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {item.upazila?.district?.name || '—'}
                        </span>
                        <span style={{ color: '#CBD5E1' }}>›</span>
                        <span style={{ fontSize: 11, color: '#1E293B', background: '#F1F5F9', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {item.upazila?.name || '—'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', paddingRight: 24 }}>
                      <div className="admin-actions" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="admin-btn admin-btn-outline admin-btn-sm" 
                          onClick={() => navigate(`/admin/unions/edit/${item.id}`)}
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
        title="Delete Union" 
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"?`} 
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
