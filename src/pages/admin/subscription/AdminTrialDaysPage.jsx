// AdminTrialDaysPage.jsx — Grant free trial days per doctor
import { useState, useEffect } from 'react'
import { getAdminTrialDays, grantTrialDays, deleteTrialDay } from '../../../api/subscriptionApi'
import { getDoctors } from '../../../api/adminApi'
import { toast } from 'react-toastify'

export default function AdminTrialDaysPage() {
  const [trials, setTrials] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ doctor_id: '', trial_days: 7, reason: '' })

  useEffect(() => { load(); loadDoctors() }, [])

  const load = async () => {
    try {
      const res = await getAdminTrialDays()
      setTrials(res.data?.data || [])
    } catch { toast.error('Failed to load') }
    finally { setLoading(false) }
  }

  const loadDoctors = async () => {
    try {
      const res = await getDoctors()
      const data = res.data?.data || res.data || []
      setDoctors(Array.isArray(data) ? data : data.data || [])
    } catch {}
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await grantTrialDays(form)
      toast.success('Trial days granted!')
      setShowModal(false)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this trial entry?')) return
    try { await deleteTrialDay(id); toast.success('Removed'); load() }
    catch { toast.error('Failed') }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🎁 Trial Days</h2>
          <p className="admin-page-subtitle">Grant free trial access to doctors</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={() => { setForm({ doctor_id: '', trial_days: 7, reason: '' }); setShowModal(true) }}>
          + Grant Trial
        </button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : trials.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🎁</div>
            <h4>No trial entries</h4>
            <p>Grant trial days to doctors for testing purposes.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Trial Days</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Granted By</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trials.map(t => {
                  const isActive = new Date(t.end_date) >= new Date(new Date().toISOString().slice(0, 10))
                  return (
                    <tr key={t.id}>
                      <td style={{ fontWeight: 700 }}>{t.doctor?.name || `Doctor #${t.doctor_id}`}</td>
                      <td style={{ fontWeight: 800, color: '#6366F1' }}>{t.trial_days} days</td>
                      <td style={{ fontSize: 12, color: '#64748B' }}>
                        {t.start_date?.slice(0, 10)} → {t.end_date?.slice(0, 10)}
                      </td>
                      <td>
                        <span style={{
                          background: isActive ? '#D1FAE5' : '#F1F5F9',
                          color: isActive ? '#065F46' : '#64748B',
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700
                        }}>{isActive ? 'Active' : 'Expired'}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{t.granted_by_user?.name || '—'}</td>
                      <td style={{ fontSize: 12, color: '#64748B', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.reason || '—'}</td>
                      <td>
                        <button className="admin-btn admin-btn-sm" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }} onClick={() => handleDelete(t.id)}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">Grant Trial Days</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Select Doctor</label>
                  <select className="admin-form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))} required>
                    <option value="">-- Choose Doctor --</option>
                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} (ID: {d.id})</option>)}
                  </select>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Trial Days</label>
                  <input className="admin-form-input" type="number" min={1} max={365} value={form.trial_days} onChange={e => setForm(f => ({ ...f, trial_days: Number(e.target.value) }))} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Reason (optional)</label>
                  <textarea className="admin-form-input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder="e.g. Testing phase, demo access" />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">Grant Trial</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
