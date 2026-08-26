import { useState, useEffect } from 'react'
import { getAdminPackages, createAdminPackage, updateAdminPackage, deleteAdminPackage } from '../../../api/subscriptionApi'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES, DIALOG_BUTTONS } from '../../../utils/dialogMessages'

export default function AdminPackagesPage() {
  const { confirm, showSuccess, showError } = useDialog()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', duration_months: 1,
    price: '', discount_percent: 0, discount_amount: 0,
    is_popular: false, is_active: true, sort_order: 0
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await getAdminPackages()
      setPackages(res.data?.data || [])
    } catch {  }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '', duration_months: 1, price: '', discount_percent: 0, discount_amount: 0, is_popular: false, is_active: true, sort_order: 0 })
    setShowModal(true)
  }

  const openEdit = (pkg) => {
    setEditing(pkg)
    setForm({
      name: pkg.name, description: pkg.description || '', duration_months: pkg.duration_months,
      price: pkg.price, discount_percent: pkg.discount_percent || 0, discount_amount: pkg.discount_amount || 0,
      is_popular: pkg.is_popular, is_active: pkg.is_active, sort_order: pkg.sort_order || 0
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await updateAdminPackage(editing.id, form)
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: 'প্যাকেজ সফলভাবে হালনাগাদ হয়েছে।',
        })
      } else {
        await createAdminPackage(form)
        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: 'নতুন প্যাকেজ সফলভাবে তৈরি হয়েছে।',
        })
      }
      setShowModal(false)
      load()
    } catch (err) {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'প্যাকেজ সংরক্ষণ করা সম্ভব হয়নি।',
      })
    }
  }

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: DIALOG_MESSAGES.PACKAGE_DELETE_CONFIRM.title,
      message: DIALOG_MESSAGES.PACKAGE_DELETE_CONFIRM.message,
      confirmText: DIALOG_BUTTONS.DELETE,
      cancelText: DIALOG_BUTTONS.CANCEL,
      variant: 'danger',
    })
    if (!isConfirmed) return
    try {
      await deleteAdminPackage(id)
      showSuccess({
        title: DIALOG_MESSAGES.DELETE_SUCCESS.title,
        message: DIALOG_MESSAGES.DELETE_SUCCESS.message,
      })
      load()
    } catch {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'প্যাকেজ মুছে ফেলা সম্ভব হয়নি।',
      })
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">📦 Subscription Packages</h2>
          <p className="admin-page-subtitle">{packages.length} packages configured</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ New Package</button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Duration</th>
                  <th>Price (৳)</th>
                  <th>Discount</th>
                  <th>Effective</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {packages.map(pkg => {
                  const effective = pkg.effective_price !== undefined ? pkg.effective_price : pkg.price
                  return (
                    <tr key={pkg.id}>
                      <td>
                        <span style={{ fontWeight: 700, color: 'var(--admin-text)' }}>{pkg.name}</span>
                        {pkg.is_popular && <span style={{ marginLeft: 8, background: 'var(--admin-sidebar-active)', color: 'var(--admin-sidebar-accent)', padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700 }}>⭐ Popular</span>}
                      </td>
                      <td>{pkg.duration_months} month(s)</td>
                      <td>৳{Math.round(pkg.price)}</td>
                      <td>
                        {pkg.discount_percent > 0 ? `${pkg.discount_percent}%` : ''}
                        {pkg.discount_amount > 0 ? ` ৳${pkg.discount_amount}` : ''}
                        {!pkg.discount_percent && !pkg.discount_amount ? '—' : ''}
                      </td>
                      <td style={{ fontWeight: 800, color: '#00A88C' }}>৳{Math.round(effective)}</td>
                      <td>
                        <span style={{
                          background: pkg.is_active ? '#D1FAE5' : '#FEE2E2',
                          color: pkg.is_active ? '#065F46' : '#991B1B',
                          padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700
                        }}>{pkg.is_active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(pkg)}>✏️ Edit</button>
                        <button className="admin-btn admin-btn-sm" style={{ background: 'var(--admin-sidebar-active)', color: 'var(--admin-danger)', border: 'none' }} onClick={() => handleDelete(pkg.id)}>🗑️</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editing ? 'Edit Package' : 'Create Package'}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Name</label>
                  <input className="admin-form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Description</label>
                  <textarea className="admin-form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Duration (months)</label>
                    <select className="admin-form-select" value={form.duration_months} onChange={e => setForm(f => ({ ...f, duration_months: Number(e.target.value) }))}>
                      <option value={1}>1 Month</option>
                      <option value={3}>3 Months</option>
                      <option value={6}>6 Months</option>
                      <option value={12}>12 Months</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Price (৳)</label>
                    <input className="admin-form-input" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} required />
                  </div>
                </div>
                <div className="admin-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Discount %</label>
                    <input className="admin-form-input" type="number" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} min="0" max="100" />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Flat Discount (৳)</label>
                    <input className="admin-form-input" type="number" value={form.discount_amount} onChange={e => setForm(f => ({ ...f, discount_amount: e.target.value }))} min="0" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, marginTop: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--admin-text)' }}>
                    <input type="checkbox" checked={form.is_popular} onChange={e => setForm(f => ({ ...f, is_popular: e.target.checked }))} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>⭐ Popular</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'var(--admin-text)' }}>
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Active</span>
                  </label>
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
