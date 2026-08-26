import { useState, useEffect } from 'react'
import { getAdminPromoCodes, createAdminPromoCode, updateAdminPromoCode, deleteAdminPromoCode } from '../../../api/subscriptionApi'
import { useDialog } from '../../../hooks/useDialog'
import { DIALOG_MESSAGES, DIALOG_BUTTONS } from '../../../utils/dialogMessages'

export default function AdminPromoCodesPage() {
  const { confirm, showSuccess, showError } = useDialog()
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    code: '', discount_type: 'percent', discount_value: '',
    max_uses: '', valid_from: '', valid_until: '', is_active: true
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await getAdminPromoCodes()
      setPromos(res.data?.data || [])
    } catch {  }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', discount_type: 'percent', discount_value: '', max_uses: '', valid_from: '', valid_until: '', is_active: true })
    setShowModal(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      code: p.code, discount_type: p.discount_type, discount_value: p.discount_value,
      max_uses: p.max_uses || '', valid_from: p.valid_from?.slice(0, 10) || '',
      valid_until: p.valid_until?.slice(0, 10) || '', is_active: p.is_active
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const data = { ...form }
      if (!data.max_uses) data.max_uses = null
      if (editing) {
        await updateAdminPromoCode(editing.id, data)
        showSuccess({
          title: DIALOG_MESSAGES.UPDATE_SUCCESS.title,
          message: 'প্রোমো কোড সফলভাবে হালনাগাদ হয়েছে।',
        })
      } else {
        await createAdminPromoCode(data)
        showSuccess({
          title: DIALOG_MESSAGES.SAVE_SUCCESS.title,
          message: 'নতুন প্রোমো কোড সফলভাবে তৈরি হয়েছে।',
        })
      }
      setShowModal(false)
      load()
    } catch (err) {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'প্রোমো কোড সংরক্ষণ করা সম্ভব হয়নি।',
      })
    }
  }

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: DIALOG_MESSAGES.PROMO_DELETE_CONFIRM.title,
      message: DIALOG_MESSAGES.PROMO_DELETE_CONFIRM.message,
      confirmText: DIALOG_BUTTONS.DELETE,
      cancelText: DIALOG_BUTTONS.CANCEL,
      variant: 'danger',
    })
    if (!isConfirmed) return
    try { 
      await deleteAdminPromoCode(id)
      showSuccess({
        title: DIALOG_MESSAGES.DELETE_SUCCESS.title,
        message: DIALOG_MESSAGES.DELETE_SUCCESS.message,
      })
      load() 
    } catch {
      showError({
        title: DIALOG_MESSAGES.ERROR.title,
        message: 'প্রোমো কোড মুছে ফেলা সম্ভব হয়নি।',
      })
    }
  }

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h2 className="admin-page-title">🎟️ Promo Codes</h2>
          <p className="admin-page-subtitle">{promos.length} promo codes</p>
        </div>
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ New Promo</button>
      </div>

      <div className="admin-card">
        {loading ? (
          <div className="admin-loading"><div className="admin-spinner" /> Loading...</div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Usage</th>
                  <th>Valid Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promos.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>{p.code}</td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>
                      {p.discount_type === 'percent' ? `${p.discount_value}%` : `৳${p.discount_value}`}
                    </td>
                    <td>
                      {p.used_count}{p.max_uses ? ` / ${p.max_uses}` : ' / ∞'}
                    </td>
                    <td style={{ fontSize: 12, color: '#64748B' }}>
                      {p.valid_from?.slice(0, 10)} → {p.valid_until?.slice(0, 10)}
                    </td>
                    <td>
                      <span style={{
                        background: p.is_active ? '#D1FAE5' : '#FEE2E2',
                        color: p.is_active ? '#065F46' : '#991B1B',
                        padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700
                      }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => openEdit(p)}>✏️</button>
                      <button className="admin-btn admin-btn-sm" style={{ background: '#FEE2E2', color: '#DC2626', border: 'none' }} onClick={() => handleDelete(p.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="admin-modal-header">
              <h3 className="admin-modal-title">{editing ? 'Edit Promo' : 'Create Promo'}</h3>
              <button className="admin-modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label className="admin-form-label">Code</label>
                  <input className="admin-form-input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} required style={{ textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Type</label>
                    <select className="admin-form-select" value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value }))}>
                      <option value="percent">Percent (%)</option>
                      <option value="fixed">Fixed (৳)</option>
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Value</label>
                    <input className="admin-form-input" type="number" value={form.discount_value} onChange={e => setForm(f => ({ ...f, discount_value: e.target.value }))} required />
                  </div>
                </div>
                <div className="admin-form-group">
                  <label className="admin-form-label">Max Uses (empty = unlimited)</label>
                  <input className="admin-form-input" type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Valid From</label>
                    <input className="admin-form-input" type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} required />
                  </div>
                  <div className="admin-form-group">
                    <label className="admin-form-label">Valid Until</label>
                    <input className="admin-form-input" type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} required />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Active</span>
                </label>
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
