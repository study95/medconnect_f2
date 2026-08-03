// PrescriptionListPage.jsx — List all prescriptions (doctor sees own, admin sees all)
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { getPrescriptions, deletePrescription } from '../../../api/adminApi'
import DeleteModal from '../../../components/admin/DeleteModal'
import { toast } from 'react-toastify'
import { getErrorMessage } from '../../../utils/errorHelper'

export default function PrescriptionListPage() {
  const { isAdmin, isDoctor, isManager } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const isDoctorOnly = !isAdmin && !isManager && isDoctor

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await getPrescriptions()
      setItems(res.data?.data?.data || res.data?.data || res.data || [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load prescriptions'))
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deletePrescription(deleteTarget.id)
      setItems(items.filter(i => i.id !== deleteTarget.id))
      toast.success('Prescription deleted')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Delete failed'))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const filtered = items.filter(p =>
    p.patient_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.diagnosis?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">{isDoctorOnly ? 'My Prescriptions' : 'Prescriptions'}</h2>
          <p className="admin-page-subtitle">{items.length} prescription(s)</p>
        </div>
        {(isDoctorOnly || isAdmin) && (
          <Link to="/admin/prescriptions/create" className="admin-btn admin-btn-primary">
            + Write Prescription
          </Link>
        )}
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3 className="admin-card-title">All Prescriptions</h3>
          <div className="admin-table-search">
            <input type="text" placeholder="Search by patient, diagnosis..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <h4>No prescriptions found</h4>
            <p>{search ? 'Try different search' : 'No prescriptions written yet'}</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Patient</th>
                  {!isDoctorOnly && <th>Doctor</th>}
                  <th>Diagnosis</th>
                  <th>Medicines</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rx => (
                  <tr key={rx.id}>
                    <td>#{rx.id}</td>
                    <td style={{ fontWeight: 600 }}>{rx.patient_name || '—'}</td>
                    {!isDoctorOnly && <td>{rx.doctor_name || '—'}</td>}
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rx.diagnosis || '—'}
                    </td>
                    <td>
                      <span style={{ background: '#E6F6F4', color: '#00A88C', padding: '4px 10px', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
                        {rx.medicines?.length || 0} items
                      </span>
                    </td>
                    <td>{rx.created_at ? new Date(rx.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>
                      <div className="admin-actions">
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/prescriptions/view/${rx.id}`)}>
                          👁️ View
                        </button>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => navigate(`/admin/prescriptions/edit/${rx.id}`)}>
                          ✏️ Edit
                        </button>
                        {(isAdmin || isDoctorOnly) && (
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setDeleteTarget(rx)}>🗑️</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteModal show={!!deleteTarget} title="Delete Prescription" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </div>
  )
}
