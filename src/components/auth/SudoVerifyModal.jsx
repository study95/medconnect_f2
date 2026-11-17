import { useState, useEffect } from 'react'
import axiosInstance from '../../api/axiosInstance'
import { ShieldCheck, Lock, KeyRound, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SudoVerifyModal() {
  const [promptState, setPromptState] = useState(null)
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const handleRequest = (e) => {
      setPassword('')
      setCode('')
      setError('')
      setPromptState(e.detail)
    }

    window.addEventListener('sudo-verify-requested', handleRequest)
    return () => window.removeEventListener('sudo-verify-requested', handleRequest)
  }, [])

  if (!promptState) return null

  const handleCancel = () => {
    const rejectFn = promptState.reject
    setPromptState(null)
    if (typeof rejectFn === 'function') {
      rejectFn(new Error('নিরাপত্তা যাচাই বাতিল করা হয়েছে।'))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!password) {
      setError('অনুগ্রহ করে আপনার পাসওয়ার্ড দিন।')
      return
    }
    if (promptState.requires2fa && !code.trim()) {
      setError('অনুগ্রহ করে আপনার Google Authenticator কোড দিন।')
      return
    }

    setSubmitting(true)
    try {
      const res = await axiosInstance.post(
        '/sudo/verify',
        {
          password,
          code: promptState.requires2fa ? code.trim() : undefined,
        },
        { skipGlobalToast: true }
      )
      if (res.data?.success) {
        toast.success('নিরাপত্তা যাচাই সফল হয়েছে।')
        const resolveFn = promptState.resolve
        setPromptState(null)
        if (typeof resolveFn === 'function') {
          resolveFn()
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'যাচাই ব্যর্থ হয়েছে। সঠিক তথ্য দিন।')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sudo-verify-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#FFFFFF',
          borderRadius: 18,
          padding: '24px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid #E2E8F0',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={handleCancel}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            border: 'none',
            background: 'transparent',
            color: '#64748B',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 id="sudo-verify-title" style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>
              অতিরিক্ত নিরাপত্তা যাচাই (Sudo Mode)
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 12.5, color: '#64748B' }}>
              আগামী ৩০ মিনিটের জন্য একবার যাচাই করলেই চলবে
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              আপনার বর্তমান পাসওয়ার্ড
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                placeholder="পাসওয়ার্ড লিখুন"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 36px',
                  borderRadius: 10,
                  border: '1px solid #CBD5E1',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {promptState.requires2fa && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Google Authenticator (2FA) কোড
              </label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="৬ সংখ্যার কোড"
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          )}

          {error && (
            <div style={{
              marginBottom: 14,
              padding: '9px 12px',
              borderRadius: 8,
              background: '#FEF2F2',
              color: '#B91C1C',
              fontSize: 12.5,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#334155',
                fontSize: 13.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              বাতিল
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: 'none',
                background: '#4F46E5',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 700,
                cursor: submitting ? 'wait' : 'pointer',
              }}
            >
              {submitting ? 'যাচাই হচ্ছে...' : 'যাচাই ও চালিয়ে যান'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
