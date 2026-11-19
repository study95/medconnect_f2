import { useState, useEffect } from 'react'
import { getActiveSessionsApi, revokeSessionApi } from '../../api/authApi'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { useDialog } from '../../hooks/useDialog'
import { Laptop, LogOut, Trash2, RefreshCw, ShieldAlert } from 'lucide-react'

export default function ActiveSessionsCard() {
  const { logoutAll } = useAuth()
  const { showSuccess, showError } = useDialog()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [revokingId, setRevokingId] = useState(null)
  const [revokingAll, setRevokingAll] = useState(false)

  const loadSessions = async () => {
    setLoading(true)
    try {
      const res = await getActiveSessionsApi()
      if (res.data?.success) {
        setSessions(res.data.sessions || [])
      }
    } catch {
      toast.error('সক্রিয় সেশন তালিকা লোড করা যায়নি।')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSessions()
  }, [])

  const handleRevoke = async (session) => {
    setRevokingId(session.id)
    try {
      const res = await revokeSessionApi(session.id)
      if (res.data?.success) {
        showSuccess({
          title: 'সেশন বাতিল সম্পন্ন',
          message: 'নির্বাচিত ডিভাইস সেশনটি সফলভাবে বাতিল করা হয়েছে।',
          confirmText: 'ঠিক আছে',
          autoCloseMs: 2200
        })
        setSessions((prev) => prev.filter((s) => s.id !== session.id))
      }
    } catch {
      showError({
        title: 'সেশন বাতিল ব্যর্থ',
        message: 'সেশন বাতিল করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        confirmText: 'ঠিক আছে'
      })
    } finally {
      setRevokingId(null)
    }
  }

  const handleLogoutAll = async () => {
    setRevokingAll(true)
    try {
      await logoutAll()
      showSuccess({
        title: 'লগআউট সম্পন্ন',
        message: 'সবগুলো ডিভাইস থেকে সফলভাবে লগআউট করা হয়েছে।',
        confirmText: 'ঠিক আছে',
        autoCloseMs: 2500
      })
    } finally {
      setRevokingAll(false)
    }
  }

  const formatDate = (iso) => {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString('bn-BD', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    } catch {
      return iso
    }
  }

  return (
    <div style={{
      marginTop: 20,
      background: 'var(--admin-card-bg, #FFFFFF)',
      border: '1px solid var(--admin-border)',
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#F0F9FF',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Laptop size={20} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--admin-text)' }}>
              Active Sessions (লগইনকৃত ডিভাইসসমূহ)
            </h4>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--admin-text-muted)' }}>
              আপনার অ্যাকাউন্ট বর্তমানে কোন কোন ডিভাইসে চালু আছে তা দেখুন ও নিয়ন্ত্রণ করুন
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={loadSessions}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 9,
              border: '1px solid var(--admin-border)',
              background: 'transparent',
              color: 'var(--admin-text)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={14} /> রিফ্রেশ
          </button>

          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={revokingAll}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 9,
              border: 'none',
              background: '#DC2626',
              color: '#FFFFFF',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: revokingAll ? 'wait' : 'pointer',
            }}
          >
            <LogOut size={14} /> {revokingAll ? 'লগআউট হচ্ছে...' : 'সব ডিভাইস থেকে লগআউট'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '18px 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
          সেশন তথ্য লোড হচ্ছে...
        </div>
      ) : sessions.length === 0 ? (
        <div style={{
          padding: '16px',
          borderRadius: 10,
          background: '#F8FAFC',
          fontSize: 13,
          color: 'var(--admin-text-muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <ShieldAlert size={16} /> কোনো সক্রিয় সেশন পাওয়া যায়নি।
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                border: session.is_current ? '1px solid #10B981' : '1px solid var(--admin-border)',
                background: session.is_current ? '#ECFDF5' : 'transparent',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--admin-text)' }}>
                    {session.device_label || 'Unknown Device'}
                  </span>
                  {session.is_current && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: '#059669',
                      color: '#FFFFFF',
                    }}>
                      বর্তমান ডিভাইস
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginTop: 4 }}>
                  IP: {session.ip_address || '—'} · সর্বশেষ ব্যবহার: {formatDate(session.last_used_at || session.created_at)}
                </div>
              </div>

              {!session.is_current && (
                <button
                  type="button"
                  onClick={() => handleRevoke(session)}
                  disabled={revokingId === session.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#B91C1C',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: revokingId === session.id ? 'wait' : 'pointer',
                  }}
                >
                  <Trash2 size={13} /> {revokingId === session.id ? 'বাতিল হচ্ছে...' : 'লগআউট করুন'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
