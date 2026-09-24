import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft, ShieldCheck, Smartphone, User, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSecureLoginPage() {
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2FA state
  const [twoFactorData, setTwoFactorData] = useState(null); // { session_key, masked_mobile, dev_otp }
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);

  const navigate = useNavigate();
  const { storeAuth } = useAuth();

  // Step 1: Submit Credentials
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      const response = await axiosInstance.post(
        '/admin-login',
        { 
          email: email.trim(), 
          password,
          device_token: localStorage.getItem('admin_trusted_device_token')
        },
        { skipGlobalToast: true }
      );

      if (response.data.requires_2fa) {
        setTwoFactorData(response.data);
        setStep('2fa');
        setOtp('');
        setOtpError('');
        setTrustDevice(false);
        setPassword('');
      } else if (response.data.success) {
        storeAuth(response.data.token, response.data.user, 'admin');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setPassword('');
      const msg = err.response?.data?.message || 'অননুমোদিত অ্যাক্সেস অথবা ভুল ক্রেডেনশিয়াল।';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA OTP
  const handleVerify2Fa = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setOtpError('অনুগ্রহ করে ৬-সংখ্যার সিকিউরিটি কোডটি লিখুন।');
      return;
    }

    setLoading(true);
    setOtpError('');

    try {
      const response = await axiosInstance.post(
        '/admin-verify-2fa',
        {
          session_key: twoFactorData?.session_key,
          otp: otp.trim(),
          trust_device: trustDevice
        },
        { skipGlobalToast: true }
      );

      if (response.data.success) {
        if (response.data.trusted_device_token) {
          localStorage.setItem('admin_trusted_device_token', response.data.trusted_device_token);
        }
        storeAuth(response.data.token, response.data.user, 'admin');
        navigate('/admin', { replace: true });
      }
    } catch (err) {
      setOtp('');
      const msg = err.response?.data?.message || 'ভুল সিকিউরিটি কোড! সঠিক কোডটি দিন।';
      setOtpError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(180deg, #F8FAFC 0%, #EEF2F6 100%)',
      padding: '32px 16px',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Central Google-Style Material Card */}
      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '28px',
        padding: '44px 40px',
        width: '100%',
        maxWidth: '440px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)',
        transition: 'all 0.3s ease'
      }}>

        {/* Top Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link to="/" style={{ display: 'inline-block', textDecoration: 'none' }}>
            <img 
              src="/doctorBookletLogo.png" 
              alt="Doctor Booklet" 
              style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'inline-flex';
              }}
            />
            <div style={{ display: 'none', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 800, fontSize: '20px' }}>
              <ShieldCheck color="#0D9488" size={26} />
              <span>Doctor Booklet</span>
            </div>
          </Link>
        </div>

        {step === 'credentials' ? (
          /* STEP 1: CREDENTIALS (GOOGLE SIGN-IN STYLE) */
          <>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '22px',
                marginBottom: '8px',
                letterSpacing: '-0.3px'
              }}>
                সাইন ইন করুন
              </h1>
              <p style={{ color: '#64748B', fontSize: '14px', margin: 0, fontWeight: 400 }}>
                Doctor Booklet অ্যাডমিন কনসোলে প্রবেশ করতে
              </p>
            </div>

            {/* Zero-Trust Clean Error Alert */}
            {authError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertTriangle size={18} color="#DC2626" style={{ flexShrink: 0 }} />
                <span style={{ color: '#991B1B', fontSize: '13px', fontWeight: 500, lineHeight: 1.4 }}>
                  {authError}
                </span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              {/* Email Input */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}>
                  অ্যাডমিনের ইমেইল
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8'
                  }}>
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="admin@example.com"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px 12px 42px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0D9488';
                      e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}>
                  পাসওয়ার্ড
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94A3B8'
                  }}>
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (authError) setAuthError('');
                    }}
                    placeholder="••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 42px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '12px',
                      color: '#0F172A',
                      fontSize: '14px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#0D9488';
                      e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.12)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#CBD5E1';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Google Pill Button */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.75 : 1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                onMouseEnter={(e) => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'none'; }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>পরবর্তী</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <Link 
                to="/"
                style={{ 
                  color: '#64748B', 
                  fontSize: '13px', 
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                ← হোমপেজে ফিরে যান
              </Link>
            </div>
          </>
        ) : (
          /* STEP 2: GOOGLE 2-STEP VERIFICATION STYLE */
          <>
            {/* User Account Chip */}
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '13px',
                color: '#334155',
                fontWeight: 600
              }}>
                <User size={15} color="#0D9488" />
                <span>{email || 'Super Admin'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
                color: '#FFFFFF'
              }}>
                <Smartphone size={26} />
              </div>
              <h2 style={{
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '20px',
                marginBottom: '6px'
              }}>
                ২-ধাপের যাচাইকরণ
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                আপনার অনুমোদিত মোবাইল নম্বর{' '}
                <strong style={{ color: '#0F172A' }}>{twoFactorData?.masked_mobile || '017****'}</strong>
                -এ পাঠানো ৬-সংখ্যার কোডটি দিন।
              </p>
            </div>

            {/* Dev Mode OTP Indicator for smooth local testing */}
            {twoFactorData?.dev_otp && (
              <div 
                onClick={() => setOtp(twoFactorData.dev_otp)}
                style={{
                  background: '#FEF3C7',
                  border: '1px dashed #F59E0B',
                  borderRadius: '10px',
                  padding: '9px 14px',
                  marginBottom: '18px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
                title="ক্লিক করে কোডটি অটো-ফিল করুন"
              >
                <span style={{ color: '#92400E', fontSize: '12px', fontWeight: 600 }}>
                  ⚡ টেস্ট মোড ওটিপি: <strong>{twoFactorData.dev_otp}</strong> (ক্লিক করলে অটো-ফিল হবে)
                </span>
              </div>
            )}

            {/* 2FA Error Alert */}
            {otpError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                borderRadius: '12px',
                padding: '11px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                <span style={{ color: '#991B1B', fontSize: '13px', fontWeight: 500 }}>
                  {otpError}
                </span>
              </div>
            )}

            <form onSubmit={handleVerify2Fa}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  ৬-সংখ্যার এসএমএস কোড
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    if (otpError) setOtpError('');
                  }}
                  autoFocus
                  required
                  placeholder="••••••"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#FFFFFF',
                    border: '2px solid #CBD5E1',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: '24px',
                    fontWeight: 700,
                    letterSpacing: '8px',
                    textAlign: 'center',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#0D9488';
                    e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#CBD5E1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* Google Standard "Don't ask again on this device" Checkbox */}
              <div style={{
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#F8FAFC',
                padding: '11px 14px',
                borderRadius: '12px',
                border: '1px solid #E2E8F0'
              }}>
                <input
                  type="checkbox"
                  id="admin-trust-device-check"
                  checked={trustDevice}
                  onChange={(e) => setTrustDevice(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#0D9488', width: '16px', height: '16px' }}
                />
                <label 
                  htmlFor="admin-trust-device-check" 
                  style={{ color: '#334155', fontSize: '13px', fontWeight: 500, margin: 0, cursor: 'pointer' }}
                >
                  এই ডিভাইসে আর জিজ্ঞাসা করবেন না
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
                  opacity: (loading || otp.length !== 6) ? 0.65 : 1,
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                  transition: 'transform 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>যাচাই করুন ও প্রবেশ করুন</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '22px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setOtp('');
                  setOtpError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 500
                }}
              >
                <ArrowLeft size={14} /> অন্য অ্যাকাউন্ট দিয়ে চেষ্টা করুন
              </button>
            </div>
          </>
        )}

      </div>

      {/* Modern Clean Google Style Minimal Footer */}
      <div style={{
        marginTop: '20px',
        color: '#94A3B8',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontWeight: 500
      }}>
        <ShieldCheck size={14} color="#0D9488" />
        <span>Doctor Booklet · নিরাপদ এন্টারপ্রাইজ পোর্টাল</span>
      </div>
    </div>
  );
}
