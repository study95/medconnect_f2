import { useState } from 'react'
import { updatePasswordApi } from '../../api/authApi'
import { Lock, Save, Eye, EyeOff } from 'lucide-react'

export default function AdminPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.new_password_confirmation) {
      return 
    }

    setLoading(true)
    try {
      await updatePasswordApi(form)
      
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to update password'
      
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ background: '#EEF2FF', padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock size={24} color="#4338CA" />
        </div>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>Update Password</h2>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-text-muted)' }}>Ensure your account is using a long, secure password.</p>
        </div>
      </div>

      <div style={{ background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>Current Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showCurrent ? "text" : "password"} 
                name="current_password"
                value={form.current_password}
                onChange={handleChange}
                placeholder="Enter current password"
                style={{ width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', outline: 'none', color: 'var(--admin-text)', fontSize: 14 }}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowCurrent(!showCurrent)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showCurrent ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNew ? "text" : "password"} 
                name="new_password"
                value={form.new_password}
                onChange={handleChange}
                placeholder="Enter new password"
                style={{ width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', outline: 'none', color: 'var(--admin-text)', fontSize: 14 }}
                required
                minLength={12}
              />
              <button 
                type="button" 
                onClick={() => setShowNew(!showNew)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showNew ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: 0 }}>
              Must be at least 12 characters, including uppercase, lowercase, number, and special character.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirm ? "text" : "password"} 
                name="new_password_confirmation"
                value={form.new_password_confirmation}
                onChange={handleChange}
                placeholder="Confirm new password"
                style={{ width: '100%', padding: '12px 16px', paddingRight: 40, borderRadius: 10, border: '1.5px solid var(--admin-border)', background: 'var(--admin-bg-alt)', outline: 'none', color: 'var(--admin-text)', fontSize: 14 }}
                required
                minLength={12}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 12, top: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                {showConfirm ? <EyeOff size={18} color="#6B7280" /> : <Eye size={18} color="#6B7280" />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
              padding: '14px 20px', borderRadius: 12, background: 'var(--admin-primary)', border: 'none', 
              color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: '0.2s', opacity: loading ? 0.7 : 1 
            }}
          >
            {loading ? 'Saving...' : <><Save size={18} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  )
}
