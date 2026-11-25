import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import {
  ShieldCheck,
  Mail,
  Gauge,
  Wrench,
  Save,
  Send,
  Lock,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  Trash2,
  Info,
} from 'lucide-react'
import axiosInstance from '../../api/axiosInstance'
import { refreshRuntimeConfig } from '../../utils/runtimeConfig'

const TABS = [
  { id: 'turnstile', label: 'Cloudflare Turnstile', icon: ShieldCheck },
  { id: 'mail', label: 'Email / SMTP', icon: Mail },
  { id: 'security', label: 'Idle Timeout & Rate Limits', icon: Gauge },
  { id: 'maintenance', label: 'Maintenance & Notice', icon: Wrench },
]

export default function AdminSystemSettingsPage() {
  const [activeTab, setActiveTab] = useState('turnstile')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState(null)

  // Local secret inputs (only sent when admin explicitly types a new secret)
  const [newTurnstileSecret, setNewTurnstileSecret] = useState('')
  const [newMailPassword, setNewMailPassword] = useState('')
  const [showTurnstileSecret, setShowTurnstileSecret] = useState(false)
  const [showMailPassword, setShowMailPassword] = useState(false)

  // Test email state
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await axiosInstance.get('/admin/system-settings')
      setSettings(res.data?.data || null)
      setNewTurnstileSecret('')
      setNewMailPassword('')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'সিস্টেম সেটিংস লোড করা সম্ভব হয়নি।')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const updateField = (group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: {
        ...(prev?.[group] || {}),
        [key]: value,
      },
    }))
  }

  const handleSave = async (e) => {
    if (e) e.preventDefault()
    if (!settings || saving) return

    setSaving(true)
    try {
      const payload = {
        turnstile: {
          enabled: Boolean(settings.turnstile?.enabled),
          site_key: settings.turnstile?.site_key || '',
          ...(newTurnstileSecret.trim() ? { secret_key: newTurnstileSecret.trim() } : {}),
        },
        mail: {
          mailer: settings.mail?.mailer || 'log',
          host: settings.mail?.host || '',
          port: Number(settings.mail?.port) || 587,
          scheme: settings.mail?.scheme ?? 'tls',
          username: settings.mail?.username || '',
          from_address: settings.mail?.from_address || '',
          from_name: settings.mail?.from_name || '',
          ...(newMailPassword.trim() ? { password: newMailPassword.trim() } : {}),
        },
        security: {
          idle_timeout_admin: Number(settings.security?.idle_timeout_admin) || 15,
          idle_timeout_staff: Number(settings.security?.idle_timeout_staff) || 30,
          idle_timeout_agent: Number(settings.security?.idle_timeout_agent) || 60,
          idle_timeout_patient: Number(settings.security?.idle_timeout_patient) || 60,
        },
        ratelimit: {
          login: Number(settings.ratelimit?.login) || 8,
          login_ip_ceiling: Number(settings.ratelimit?.login_ip_ceiling) || 40,
          otp: Number(settings.ratelimit?.otp) || 5,
          otp_ip_ceiling: Number(settings.ratelimit?.otp_ip_ceiling) || 25,
          sensitive: Number(settings.ratelimit?.sensitive) || 20,
          appointments: Number(settings.ratelimit?.appointments) || 60,
          public: Number(settings.ratelimit?.public) || 180,
          api: Number(settings.ratelimit?.api) || 180,
        },
        maintenance: {
          enabled: Boolean(settings.maintenance?.enabled),
          title: settings.maintenance?.title || '',
          message: settings.maintenance?.message || '',
          banner_enabled: Boolean(settings.maintenance?.banner_enabled),
          banner_type: settings.maintenance?.banner_type || 'info',
          banner_text: settings.maintenance?.banner_text || '',
        },
      }

      const res = await axiosInstance.put('/admin/system-settings', { settings: payload })
      setSettings(res.data?.data || settings)
      setNewTurnstileSecret('')
      setNewMailPassword('')
      await refreshRuntimeConfig()
      toast.success(res.data?.message || 'সিস্টেম কনফিগারেশন সফলভাবে আপডেট হয়েছে।')
    } catch (err) {
      const errors = err?.response?.data?.errors
      const firstErr = errors ? Object.values(errors)?.[0]?.[0] : null
      toast.error(firstErr || err?.response?.data?.message || 'সেটিংস সেভ করা সম্ভব হয়নি।')
    } finally {
      setSaving(false)
    }
  }

  const handleClearSecret = async (group, clearFlag, label) => {
    if (!window.confirm(`আপনি কি নিশ্চিতভাবে সংরক্ষিত ${label} মুছে ফেলতে চান?`)) return
    setSaving(true)
    try {
      const payload = { [group]: { [clearFlag]: true } }
      if (group === 'turnstile') {
        payload.turnstile.enabled = false
      }
      const res = await axiosInstance.put('/admin/system-settings', { settings: payload })
      setSettings(res.data?.data || settings)
      await refreshRuntimeConfig()
      toast.success(`${label} সফলভাবে মুছে ফেলা হয়েছে।`)
    } catch (err) {
      toast.error(err?.response?.data?.message || `${label} মুছে ফেলা সম্ভব হয়নি।`)
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestEmail = async () => {
    const target = testEmail.trim()
    if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
      toast.error('অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।')
      return
    }
    setSendingTest(true)
    try {
      const res = await axiosInstance.post('/admin/system-settings/test-mail', { email: target })
      toast.success(res.data?.message || 'টেস্ট ইমেইল পাঠানো হয়েছে।')
    } catch (err) {
      toast.error(err?.response?.data?.message || 'টেস্ট ইমেইল পাঠানো ব্যর্থ হয়েছে।')
    } finally {
      setSendingTest(false)
    }
  }

  if (loading || !settings) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: '#64748B' }}>
        <RefreshCw size={24} className="spin" style={{ marginBottom: 10 }} />
        <div>সিস্টেম কনফিগারেশন লোড হচ্ছে...</div>
      </div>
    )
  }

  const cardStyle = {
    background: 'var(--admin-card-bg, #FFFFFF)',
    border: '1px solid var(--admin-border, #E2E8F0)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #CBD5E1',
    fontSize: 14,
    background: '#FFFFFF',
    color: '#0F172A',
  }

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: '#334155',
    marginBottom: 6,
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1040, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--admin-text, #0F172A)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={22} color="#059669" />
            System Settings (এনক্রিপ্টেড রানটাইম কনফিগারেশন)
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: '#64748B' }}>
            সার্ভারের <code>.env</code> ফাইল না ছুঁয়েই Turnstile, SMTP ইমেইল, সেশন টাইমআউট, রেট-লিমিট এবং মেইনটেন্যান্স মোড নিরাপদে নিয়ন্ত্রণ করুন।
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 22px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #00B875, #059669)',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: 14,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <Save size={16} />
          {saving ? 'সেভ হচ্ছে...' : 'পরিবর্তন সেভ করুন'}
        </button>
      </div>

      {/* Security Architecture Notice */}
      <div
        style={{
          background: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: 12,
          padding: '12px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          fontSize: 13,
          color: '#166534',
        }}
      >
        <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <strong>জিরো-ট্রাস্ট সুরক্ষা সক্রিয়:</strong> সব সিক্রেট কী ডেটাবেসে <strong>AES-256 এনক্রিপ্টেড</strong> থাকে, পরিবর্তনে <strong>Sudo Mode (পাসওয়ার্ড/2FA)</strong> ও <strong>Audit Log</strong> বাধ্যতামূলক, এবং কোর ইনফ্রাস্ট্রাকচার সিক্রেট (<code>DB_*</code>, <code>APP_KEY</code>, <code>REDIS_*</code>, <code>REVERB_*</code>, <code>R2_*</code>) সার্ভারের Read-Only <code>.env</code> ফাইলে সুরক্ষিত আছে।
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {TABS.map((t) => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: 10,
                border: active ? '1.5px solid #059669' : '1px solid #E2E8F0',
                background: active ? '#ECFDF5' : '#FFFFFF',
                color: active ? '#065F46' : '#475569',
                fontWeight: 700,
                fontSize: 13.5,
                cursor: 'pointer',
              }}
            >
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      <form onSubmit={handleSave}>
        {/* TAB 1: CLOUDFLARE TURNSTILE */}
        {activeTab === 'turnstile' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>Cloudflare Turnstile Anti-Bot</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              OTP, রেজিস্ট্রেশন, ফরগট পাসওয়ার্ড, সাপোর্ট টিকিট এবং কন্টাক্ট ফর্মে অটোমেটেড বট ও SMS বোম্বিং প্রতিরোধ করে। এখান থেকে অন/অফ করলে ফ্রন্টএন্ড রিবিল্ড ছাড়াই সাথে সাথে কার্যকর হয়।
            </p>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, cursor: 'pointer', fontWeight: 700 }}>
              <input
                type="checkbox"
                checked={Boolean(settings.turnstile?.enabled)}
                onChange={(e) => updateField('turnstile', 'enabled', e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <span>Turnstile Anti-Bot Protection চালু করুন (Enabled)</span>
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Turnstile Site Key (Public)</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="0x4AAAAAAA..."
                  value={settings.turnstile?.site_key || ''}
                  onChange={(e) => updateField('turnstile', 'site_key', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  Turnstile Secret Key (Encrypted)
                  {settings.turnstile?.has_secret_key && (
                    <span style={{ marginLeft: 8, color: '#059669', fontSize: 12 }}>
                      <CheckCircle2 size={13} style={{ verticalAlign: 'middle' }} /> সংরক্ষিত ({settings.turnstile.secret_key})
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showTurnstileSecret ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: 38 }}
                      placeholder={settings.turnstile?.has_secret_key ? 'নতুন সিক্রেট কী দিতে এখানে লিখুন (খালি রাখলে আগেরটি থাকবে)' : '0x4AAAAAAA...'}
                      value={newTurnstileSecret}
                      onChange={(e) => setNewTurnstileSecret(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTurnstileSecret((v) => !v)}
                      style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      {showTurnstileSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {settings.turnstile?.has_secret_key && (
                    <button
                      type="button"
                      onClick={() => handleClearSecret('turnstile', 'clear_secret_key', 'Turnstile Secret Key')}
                      title="সিক্রেট কী মুছুন"
                      style={{ padding: '0 12px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL / SMTP */}
        {activeTab === 'mail' && (
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>Email / SMTP কনফিগারেশন</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#64748B' }}>
              অ্যাপয়েন্টমেন্ট ও সিস্টেম নোটিফিকেশন ইমেইল পাঠানোর SMTP সার্ভার সেট করুন। SSRF সুরক্ষার কারণে প্রাইভেট IP বা <code>localhost</code> SMTP হোস্ট ব্লক থাকে।
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              <div>
                <label style={labelStyle}>Mail Driver</label>
                <select
                  style={inputStyle}
                  value={settings.mail?.mailer || 'log'}
                  onChange={(e) => updateField('mail', 'mailer', e.target.value)}
                >
                  <option value="log">Log (লোকাল টেস্ট — ইমেইল লগে সেভ হবে)</option>
                  <option value="smtp">SMTP (প্রোডাকশন লাইভ ইমেইল)</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>SMTP Host</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="smtp.gmail.com / smtp.mailgun.org"
                  value={settings.mail?.host || ''}
                  onChange={(e) => updateField('mail', 'host', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>SMTP Port</label>
                <input
                  type="number"
                  min={1}
                  max={65535}
                  style={inputStyle}
                  value={settings.mail?.port ?? 587}
                  onChange={(e) => updateField('mail', 'port', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>Encryption / Scheme</label>
                <select
                  style={inputStyle}
                  value={settings.mail?.scheme ?? 'tls'}
                  onChange={(e) => updateField('mail', 'scheme', e.target.value)}
                >
                  <option value="tls">TLS (STARTTLS - 587)</option>
                  <option value="smtps">SMTPS / SSL (465)</option>
                  <option value="smtp">SMTP (Plain)</option>
                  <option value="">None</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>SMTP Username</label>
                <input
                  type="text"
                  style={inputStyle}
                  value={settings.mail?.username || ''}
                  onChange={(e) => updateField('mail', 'username', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>
                  SMTP Password (Encrypted)
                  {settings.mail?.has_password && (
                    <span style={{ marginLeft: 8, color: '#059669', fontSize: 12 }}>
                      সংরক্ষিত ({settings.mail.password})
                    </span>
                  )}
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showMailPassword ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: 38 }}
                      placeholder={settings.mail?.has_password ? 'পরিবর্তন না করলে খালি রাখুন' : 'SMTP অ্যাপ পাসওয়ার্ড'}
                      value={newMailPassword}
                      onChange={(e) => setNewMailPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMailPassword((v) => !v)}
                      style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                    >
                      {showMailPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {settings.mail?.has_password && (
                    <button
                      type="button"
                      onClick={() => handleClearSecret('mail', 'clear_password', 'SMTP Password')}
                      title="পাসওয়ার্ড মুছুন"
                      style={{ padding: '0 12px', borderRadius: 10, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label style={labelStyle}>From Email Address</label>
                <input
                  type="email"
                  style={inputStyle}
                  placeholder="noreply@doctorbooklet.com"
                  value={settings.mail?.from_address || ''}
                  onChange={(e) => updateField('mail', 'from_address', e.target.value)}
                />
              </div>

              <div>
                <label style={labelStyle}>From Name</label>
                <input
                  type="text"
                  style={inputStyle}
                  placeholder="Doctor Booklet"
                  value={settings.mail?.from_name || ''}
                  onChange={(e) => updateField('mail', 'from_name', e.target.value)}
                />
              </div>
            </div>

            {/* Test Email Bar */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
              <label style={labelStyle}>লাইভ SMTP কানেকশন টেস্ট করুন (আগে পরিবর্তন সেভ করে নিন)</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 520 }}>
                <input
                  type="email"
                  style={{ ...inputStyle, flex: 1, minWidth: 220 }}
                  placeholder="test@yourdomain.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleSendTestEmail}
                  disabled={sendingTest}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #059669',
                    background: '#ECFDF5',
                    color: '#065F46',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: sendingTest ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Send size={15} />
                  {sendingTest ? 'পাঠানো হচ্ছে...' : 'Send Test Email'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: IDLE TIMEOUT & RATE LIMITS */}
        {activeTab === 'security' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>Role-Based Idle Auto-Logout Timeout (মিনিট)</h3>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>
                নিষ্ক্রিয় থাকলে কত মিনিট পর স্বয়ংক্রিয়ভাবে সেশন লগআউট হবে (ব্যাকএন্ড ও ফ্রন্টএন্ড উভয় জায়গায় সিঙ্ক হবে)।
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Admin / Super-Admin (5–120 মি.)</label>
                  <input type="number" min={5} max={120} style={inputStyle} value={settings.security?.idle_timeout_admin ?? 15} onChange={(e) => updateField('security', 'idle_timeout_admin', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Doctor / Hospital (10–240 মি.)</label>
                  <input type="number" min={10} max={240} style={inputStyle} value={settings.security?.idle_timeout_staff ?? 30} onChange={(e) => updateField('security', 'idle_timeout_staff', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Field Agent (15–240 মি.)</label>
                  <input type="number" min={15} max={240} style={inputStyle} value={settings.security?.idle_timeout_agent ?? 60} onChange={(e) => updateField('security', 'idle_timeout_agent', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Patient / User (15–480 মি.)</label>
                  <input type="number" min={15} max={480} style={inputStyle} value={settings.security?.idle_timeout_patient ?? 60} onChange={(e) => updateField('security', 'idle_timeout_patient', e.target.value)} />
                </div>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>CGNAT-Safe API Rate Limiting (রিকোয়েস্ট / মিনিট)</h3>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>
                ব্রুট-ফোর্স ও অটোমেটেড স্ক্র্যাপিং রোধে প্রতি মিনিটের সর্বোচ্চ রিকোয়েস্ট সীমা। সেভ করলেই সাথে সাথে কার্যকর হয়।
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Login / Account (3–60)</label>
                  <input type="number" min={3} max={60} style={inputStyle} value={settings.ratelimit?.login ?? 8} onChange={(e) => updateField('ratelimit', 'login', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Login IP Ceiling (10–300)</label>
                  <input type="number" min={10} max={300} style={inputStyle} value={settings.ratelimit?.login_ip_ceiling ?? 40} onChange={(e) => updateField('ratelimit', 'login_ip_ceiling', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>OTP Send / Target (2–30)</label>
                  <input type="number" min={2} max={30} style={inputStyle} value={settings.ratelimit?.otp ?? 5} onChange={(e) => updateField('ratelimit', 'otp', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>OTP IP Ceiling (5–150)</label>
                  <input type="number" min={5} max={150} style={inputStyle} value={settings.ratelimit?.otp_ip_ceiling ?? 25} onChange={(e) => updateField('ratelimit', 'otp_ip_ceiling', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>2FA / Reset Sensitive (5–120)</label>
                  <input type="number" min={5} max={120} style={inputStyle} value={settings.ratelimit?.sensitive ?? 20} onChange={(e) => updateField('ratelimit', 'sensitive', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Appointments / User (10–300)</label>
                  <input type="number" min={10} max={300} style={inputStyle} value={settings.ratelimit?.appointments ?? 60} onChange={(e) => updateField('ratelimit', 'appointments', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Public Directory / IP (30–600)</label>
                  <input type="number" min={30} max={600} style={inputStyle} value={settings.ratelimit?.public ?? 180} onChange={(e) => updateField('ratelimit', 'public', e.target.value)} />
                </div>
                <div>
                  <label style={labelStyle}>Authenticated API (30–600)</label>
                  <input type="number" min={30} max={600} style={inputStyle} value={settings.ratelimit?.api ?? 180} onChange={(e) => updateField('ratelimit', 'api', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MAINTENANCE & EMERGENCY NOTICE */}
        {activeTab === 'maintenance' && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800 }}>Emergency Notice Banner (জরুরি নোটিশ বার)</h3>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>
                পাবলিক সাইটের সবার উপরে জরুরি ঘোষণা দেখান (যেমন: আসন্ন মেইনটেন্যান্স বা হটলাইন আপডেট)।
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenance?.banner_enabled)}
                  onChange={(e) => updateField('maintenance', 'banner_enabled', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span>টপ নোটিশ ব্যানার চালু করুন</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>ব্যানার ধরন</label>
                  <select
                    style={inputStyle}
                    value={settings.maintenance?.banner_type || 'info'}
                    onChange={(e) => updateField('maintenance', 'banner_type', e.target.value)}
                  >
                    <option value="info">Info (নীল)</option>
                    <option value="warning">Warning (হলুদ)</option>
                    <option value="danger">Danger (লাল)</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>নোটিশ টেক্সট (সর্বোচ্চ ৩০০ অক্ষর)</label>
                  <input
                    type="text"
                    maxLength={300}
                    style={inputStyle}
                    placeholder="উদাহরণ: আজ রাত ২:০০ টা থেকে ২:৩০ টা পর্যন্ত সার্ভার আপগ্রেড চলবে।"
                    value={settings.maintenance?.banner_text || ''}
                    onChange={(e) => updateField('maintenance', 'banner_text', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div style={{ ...cardStyle, borderColor: settings.maintenance?.enabled ? '#FCA5A5' : '#E2E8F0' }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8, color: settings.maintenance?.enabled ? '#B91C1C' : '#0F172A' }}>
                <AlertTriangle size={18} color={settings.maintenance?.enabled ? '#DC2626' : '#F59E0B'} />
                Portal Maintenance Mode (সাইট সাময়িক বন্ধ)
              </h3>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: '#64748B' }}>
                চালু করলে সাধারণ ভিজিটর ও নন-অ্যাডমিন API রিকোয়েস্ট <code>503</code> মেইনটেন্যান্স স্ক্রিন পাবে। <strong>অ্যাডমিন প্যানেল, অ্যাডমিন লগইন এবং চলমান পেমেন্ট গেটওয়ে কলব্যাক সবসময় খোলা থাকবে।</strong>
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, cursor: 'pointer', fontWeight: 700, color: settings.maintenance?.enabled ? '#B91C1C' : '#0F172A' }}>
                <input
                  type="checkbox"
                  checked={Boolean(settings.maintenance?.enabled)}
                  onChange={(e) => updateField('maintenance', 'enabled', e.target.checked)}
                  style={{ width: 18, height: 18 }}
                />
                <span>পাবলিক পোর্টাল Maintenance Mode চালু করুন</span>
              </label>

              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label style={labelStyle}>মেইনটেন্যান্স শিরোনাম</label>
                  <input
                    type="text"
                    maxLength={160}
                    style={inputStyle}
                    value={settings.maintenance?.title || ''}
                    onChange={(e) => updateField('maintenance', 'title', e.target.value)}
                  />
                </div>
                <div>
                  <label style={labelStyle}>বিস্তারিত বার্তা</label>
                  <textarea
                    rows={3}
                    maxLength={600}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    value={settings.maintenance?.message || ''}
                    onChange={(e) => updateField('maintenance', 'message', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}
