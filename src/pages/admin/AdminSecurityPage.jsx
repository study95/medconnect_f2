import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import TwoFactorSecurityCard from '../../components/auth/TwoFactorSecurityCard'
import ActiveSessionsCard from '../../components/auth/ActiveSessionsCard'
import { ShieldCheck, Lock, KeyRound, ArrowRight } from 'lucide-react'

export default function AdminSecurityPage() {
  const navigate = useNavigate()
  const { isDoctor, isManager } = useAuth()

  const portalBase = isDoctor ? '/doctor' : (isManager ? '/hospital' : '/admin')

  return (
    <div style={{ padding: '24px 32px', maxWidth: 720, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          background: '#ECFDF5',
          padding: 12,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={28} color="#059669" />
        </div>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--admin-text)' }}>
            Two-Factor Security (২-ধাপ যাচাই)
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--admin-text-muted)' }}>
            Google Authenticator অ্যাপের মাধ্যমে আপনার অ্যাকাউন্টের সর্বোচ্চ নিরাপত্তা নিশ্চিত করুন
          </p>
        </div>
      </div>

      {/* Main Feature: Two-Factor Security Card (Instruction, Status, Enable/Disable Buttons) */}
      <TwoFactorSecurityCard />

      {/* Active Sessions & Multi-Device Logout Control */}
      <ActiveSessionsCard />

      {/* Password Change Navigation Card */}
      <div style={{
        marginTop: 20,
        background: 'var(--admin-card-bg, #FFFFFF)',
        border: '1px solid var(--admin-border)',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: '#EEF2FF',
            color: '#4F46E5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Lock size={22} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--admin-text)' }}>
              পাসওয়ার্ড পরিবর্তন করতে চান?
            </h4>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
              আপনার অ্যাকাউন্টের বর্তমান পাসওয়ার্ড আপডেট করতে পাসওয়ার্ড পরিবর্তন পেজে যান
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(`${portalBase}/password`)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '11px 20px',
            borderRadius: 10,
            background: '#4F46E5',
            border: 'none',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
          }}
        >
          <KeyRound size={16} /> পাসওয়ার্ড পরিবর্তন করুন <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
