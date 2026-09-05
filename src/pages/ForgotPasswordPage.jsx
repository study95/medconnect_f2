import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Form, Button, Card } from 'react-bootstrap'
import axiosInstance from '../api/axiosInstance'
import { useTranslation } from 'react-i18next'


function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [devToken, setDevToken] = useState('')
  const { t } = useTranslation()


  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatusMsg({ type: '', text: '' })
    try {
      const res = await axiosInstance.post('/forgot-password', { email })
      if (res.data.success) {
        setStatusMsg({ type: 'success', text: res.data.message || 'Password reset link has been sent to your email.' })
      } else {
        setStatusMsg({ type: 'danger', text: res.data.message || 'Unable to process request.' })
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
                <span style={{ fontSize: 24 }}>🔒</span>
              </div>
              <h4 className="fw-bold mb-1">{t('forgot_password_title')}</h4>
              <p className="text-muted" style={{ fontSize: 14 }}>{t('forgot_password_subtitle')}</p>
            </div>

            {statusMsg.text && (
              <div className={`alert alert-${statusMsg.type === 'success' ? 'success' : 'danger'} mb-4`} role="alert" style={{ fontSize: 13.5, borderRadius: 12 }}>
                {statusMsg.text}
              </div>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-4">
                <Form.Label style={{ fontSize: 14, fontWeight: 600 }}>{t('email_address')}</Form.Label>

                <Form.Control
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mc-form-control"
                />
              </Form.Group>

              <Button
                type="submit"
                disabled={loading}
                className="w-100 btn-mc-primary btn"
                style={{ padding: '12px', fontSize: 15 }}
              >
                {loading ? (
                  <><span className="spinner-border spinner-border-sm me-2" />{t('sending')}</>
                ) : (
                  t('send_reset_link')
                )}
              </Button>

            </Form>

            <p className="text-center mt-4 mb-0" style={{ fontSize: 14 }}>
              {t('remembered_password')}{' '}
              <Link to="/login" className="fw-600 text-primary">{t('login_here')}</Link>
            </p>
          </Card.Body>
        </Card>
      </Container>
    </div>
  )
}

export default ForgotPasswordPage
