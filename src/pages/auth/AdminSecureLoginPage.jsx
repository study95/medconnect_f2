import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Lock, Mail, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSecureLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { storeAuth } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axiosInstance.post('/admin-login', { email, password });
      
      if (response.data.success) {
        
        
        // Update AuthContext state directly without full page reload
        storeAuth(response.data.token, response.data.user, 'admin');
        
        // Navigate securely using React Router
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      if (err.response?.data?.unauthorized_role) {
        
        navigate('/');
      } else if (err.response?.status === 403) {
        
      } else {
        
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        padding: '40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)'
          }}>
            <ShieldAlert color="white" size={32} />
          </div>
          <h2 style={{ color: 'white', fontWeight: '700', fontSize: '24px', marginBottom: '8px' }}>
            System Access
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>
            Restricted administrative portal. Unauthorized access is strictly prohibited.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Administrator Email
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 14px 14px 44px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="admin@doctorbooklet.com"
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
              Secure Password
            </label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '14px 40px 14px 44px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                placeholder="••••••••••••"
                onFocus={(e) => e.target.style.borderColor = '#ef4444'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'transform 0.1s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm" /> Authenticating...</>
            ) : (
              'Access System'
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 16px 0' }}>
            Attempting to breach this system will result in immediate IP and account blocking.
          </p>
          <button 
            onClick={() => navigate('/')}
            style={{ 
              background: 'none', border: 'none', color: '#94a3b8', fontSize: '13px', 
              cursor: 'pointer', textDecoration: 'underline' 
            }}
          >
            Return to Main Portal
          </button>
        </div>
      </div>
    </div>
  );
}
