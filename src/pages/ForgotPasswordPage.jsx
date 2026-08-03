import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Container, Form, Button, Card } from 'react-bootstrap'
import axiosInstance from '../api/axiosInstance'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toastify'


function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [devToken, setDevToken] = useState('')
  const { t } = useTranslation()


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axiosInstance.post('/forgot-password', { email })
      // For development, API might return the token in response so we can test the reset flow easily.
      if (res.data.token) {
        setDevToken(res.data.token)
        toast.success('Development Mode: Reset link generated.')
      }
      
      if (res.data.success) {
        toast.success(res.data.message || t('password_reset_sent'))
      } else if (!res.data.token) {
        toast.error(res.data.message || t('something_went_wrong'))
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('something_went_wrong'))
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


            {devToken && (
              <div style={{ background: '#ECFDF5', border: '1px solid #10B98130', borderRadius: 24, padding: '30px', marginBottom: 28, textAlign: 'center' }}>
                 <div style={{ fontSize: 36, marginBottom: 12 }}>🚀</div>
                 <h6 style={{ fontWeight: 900, color: '#065F46', marginBottom: 8, fontSize: 18 }}>Dev Mode Shortcut</h6>
                 <p style={{ fontSize: 13, color: '#059669', marginBottom: 20, lineHeight: 1.6 }}>
                   Real emails are disabled in local development. Use this shortcut to test the reset flow:
                 </p>
                 <Link 
                   to={`/reset-password?token=${devToken}&email=${email}`}
                   style={{ 
                     display: 'block', padding: '14px', background: '#00A88C', color: 'white', 
                     borderRadius: 14, fontWeight: 900, textDecoration: 'none', fontSize: 14,
                     boxShadow: '0 8px 16px rgba(0,168,140,0.2)', transition: '0.3s'
                   }}
                 >
                   RESET PASSWORD ➝
                 </Link>
                 <div style={{ marginTop: 20, padding: 10, background: '#D1FAE5', borderRadius: 10, fontSize: 11, color: '#047857', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                   TOKEN: {devToken}
                 </div>
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
