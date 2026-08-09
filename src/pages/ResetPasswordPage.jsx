import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { Container, Form, Button, Card } from 'react-bootstrap'
import axiosInstance from '../api/axiosInstance'
import { useTranslation } from 'react-i18next'
import PasswordInput from '../components/common/PasswordInput'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''
  const navigate = useNavigate()

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [password_confirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()


  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })
    if (!token) {
      setStatusMsg({ type: 'danger', text: 'Invalid token.' })
      return
    }

    if (password.length < 6) {
      setStatusMsg({ type: 'danger', text: 'Password must be at least 6 characters.' })
      return
    }

    if (password !== password_confirmation) {
      setStatusMsg({ type: 'danger', text: 'Passwords do not match.' })
      return
    }

    setLoading(true)
    try {
      const res = await axiosInstance.post('/reset-password', {
        email, token, password, password_confirmation
      })
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: 'Password reset successfully! Redirecting...' })
        setTimeout(() => navigate('/login'), 3000)
      } else {
        setStatusMsg({ type: 'danger', text: res.data.message || 'Password reset failed.' })
      }
    } catch (err) {
      setStatusMsg({ type: 'danger', text: err.response?.data?.message || 'Something went wrong.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="page-wrapper d-flex align-items-center justify-content-center"
      style={{ minHeight: '80vh', background: 'linear-gradient(135deg, #f0f7ff 0%, #E6F6F4 100%)' }}
    >
      <Container style={{ maxWidth: 440 }}>
        <Card className="border-0 shadow-sm" style={{ borderRadius: 20, padding: '8px' }}>
          <Card.Body className="p-4">
            <div className="text-center mb-4">
              <div
                style={{
                  width: 52, height: 52, background: '#00A88C', borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                }}
              >
                <span style={{ fontSize: 24 }}>🔑</span>
              </div>
              <h4 className="fw-bold mb-1">{t('reset_password_title')}</h4>
              <p className="text-muted" style={{ fontSize: 14 }}>{t('reset_password_subtitle')}</p>
            </div>

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: 14, fontWeight: 600 }}>{t('email_address')}</Form.Label>
                <Form.Control

                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  readOnly={!!emailParam}
                  required
                  className="mc-form-control"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: 14, fontWeight: 600 }}>{t('new_password')}</Form.Label>
                <PasswordInput
                  className="mc-form-control"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  showStrength={false}
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label style={{ fontSize: 14, fontWeight: 600 }}>{t('confirm_password')}</Form.Label>
                <PasswordInput
                  className="mc-form-control"
                  name="password_confirmation"
                  value={password_confirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repeat new password"
                  showStrength={false}
                />
              </Form.Group>

              <Button
                type="submit"
                disabled={loading || !token}
                className="w-100 btn-mc-primary btn"
                style={{ padding: '12px', fontSize: 15 }}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />{t('updating')}</>
                ) : (
                  t('reset_password_btn')
                )}
              </Button>
            </Form>

            <p className="text-center mt-4 mb-0" style={{ fontSize: 14 }}>
              <Link to="/login" className="fw-600 text-muted">← {t('back_to_login') || 'Back to Login'}</Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}

export default ResetPasswordPage
