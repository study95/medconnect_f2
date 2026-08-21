// PrescriptionListPage.jsx — List all prescriptions (doctor sees own, admin sees all)
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPrescriptions, deletePrescription } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import ListToolbar from '../../../components/admin/ListToolbar'
import { TableSkeleton } from '../../../components/common/Skeletons'
import EmptyState from '../../../components/common/EmptyState'
import CompactUlid from '../../../components/common/CompactUlid'
import TableFooter from '../../../components/admin/TableFooter'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function PrescriptionListPage() {
  const { user, isAdmin, isDoctor } = useAuth()
  const navigate = useNavigate()
  const [prescriptions, setPrescriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [perPage, setPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const res = await getPrescriptions()
      setPrescriptions(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchPrescriptions() }, [])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePrescription(deleteTarget.id)
      setPrescriptions(prescriptions.filter(p => p.id !== deleteTarget.id))
    } catch (err) {
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = prescriptions.filter(p => {
    if (search) {
      const q = search.toLowerCase()
      const matchName = p.patient_name?.toLowerCase().includes(q)
      const matchDoc = p.doctor_name?.toLowerCase().includes(q)
      const matchDiag = p.diagnosis?.toLowerCase().includes(q)
      const matchId = String(p.id).includes(q)
      if (!matchName && !matchDoc && !matchDiag && !matchId) return false
    }
    if (dateFilter && p.prescription_date) {
      if (!p.prescription_date.startsWith(dateFilter)) return false
    }
    return true
  })

  useEffect(() => { setCurrentPage(1) }, [filtered.length])
  const paginatedData = filtered.slice((currentPage - 1) * perPage, currentPage * perPage)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title" style={{ color: 'var(--admin-text)' }}>
            <span style={{ marginRight: 12 }}>📋</span>
            Prescriptions
          </h2>
          <p className="admin-page-subtitle" style={{ color: 'var(--admin-text-muted)' }}>Digital clinical prescriptions and diagnosis records</p>
        </div>
      </div>

      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by patient, doctor, diagnosis, ID..."
        onRefresh={fetchPrescriptions}
        refreshing={loading}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(p => !p)}
        hasActiveFilters={Boolean(dateFilter)}
        onClearFilters={() => setDateFilter('')}
        activeFilters={[
          dateFilter && { key: 'date', label: `Date: ${dateFilter}`, onRemove: () => setDateFilter('') },
        ].filter(Boolean)}
        actions={
          isDoctor && (
            <Link to="/admin/prescriptions/create" className="admin-btn admin-btn-primary" style={{ height: 38, display: 'inline-flex', alignItems: 'center' }}>
              + New Prescription
            </Link>
          )
        }
      >
        <div style={{ minWidth: 160 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-muted)', marginBottom: 4, textTransform: 'uppercase' }}>Date</label>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ width: '100%', height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-card-bg)', color: 'var(--admin-text)' }}
          />
        </div>
      </ListToolbar>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">Prescription Records</h3>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{filtered.length} total</span>
        </div>

        {loading ? (
          <TableSkeleton rowCount={8} columnWidths={['100px', '22%', '20%', '18%', '16%', '14%']} headers={['ID', 'Patient', 'Doctor', 'Date', 'Diagnosis', 'Actions']} />
        ) : filtered.length === 0 ? (
          <EmptyState hasFilters={Boolean(search || dateFilter)} searchQuery={search} onClearFilters={() => setDateFilter('')} onClearSearch={() => setSearch('')} icon="📋" title="No prescriptions found" description="No prescription records match your criteria." primaryAction={isDoctor ? { label: '+ New Prescription', to: '/admin/prescriptions/create' } : undefined} />
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  {isAdmin && <th>Doctor</th>}
                  <th>Date</th>
                  <th>Diagnosis</th>
                  <th>Medicines</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(p => (
                  <tr key={p.id}>
                    <td>
                      <CompactUlid value={p.public_id || p.id} />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.patient_name || (p.patient ? p.patient.name : '—')}</div>
                      {p.patient_phone && <div style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{p.patient_phone}</div>}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.doctor_name || (p.doctor ? p.doctor.name : '—')}</div>
                      </td>
                    )}
                    <td>{p.prescription_date || '—'}</td>
                    <td>
                      <span style={{ maxWidth: 180, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.diagnosis || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge admin-badge-info">
                        {p.medicines ? p.medicines.length : 0} items
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        <button
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => navigate(`/admin/prescriptions/${p.id}`)}
                          title="View / Print"
                        >👁️ View</button>
                        <button
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          onClick={() => navigate(`/admin/prescriptions/edit/${p.id}`)}
                          title="Edit"
                        >✏️</button>
                        <button
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => setDeleteTarget(p)}
                          title="Delete"
                        >🗑️</button>
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
        title="Delete Prescription"
        message={`Are you sure you want to delete prescription for "${deleteTarget?.patient_name || ''}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  )
}