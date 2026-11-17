import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { 
  Lock, Mail, Eye, EyeOff, AlertTriangle, ArrowLeft, ShieldCheck, 
  Smartphone, User, ArrowRight, QrCode, Key, Copy, Check, Download 
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';

export default function AdminSecureLoginPage() {
  const [step, setStep] = useState('credentials'); // 'credentials' | '2fa'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');

  // 2FA state
  const [twoFactorData, setTwoFactorData] = useState(null); // { session_key, is_initial_setup, secret, otpauth_url, backup_codes }
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [useBackupMode, setUseBackupMode] = useState(false);

  // Setup mode helpers
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);

  const navigate = useNavigate();
  const { storeAuth } = useAuth();

  // Step 1: Submit Credentials
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError('');

    try {
      localStorage.removeItem('admin_trusted_device_token'); // Clean up any legacy bypass token
      const response = await axiosInstance.post(
        '/admin-login',
        { 
          email: email.trim(), 
          password
        },
        { skipGlobalToast: true }
      );

      if (response.data.requires_2fa) {
        setTwoFactorData(response.data);
        setStep('2fa');
        setCode('');
        setCodeError('');
        setUseBackupMode(false);
        setPassword('');
      } else if (response.data.success) {
        storeAuth(response.data.token, response.data.user, 'admin');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setPassword('');
      const msg = err.response?.data?.message || 'অননুমোদিত অ্যাক্সেস অথবা ভুল ক্রেডেনশিয়াল।';
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Google Authenticator code or Backup code
  const handleVerify2Fa = async (e) => {
    e.preventDefault();
    const cleanCode = code.trim();

    if (!cleanCode) {
      setCodeError('অনুগ্রহ করে কোডটি লিখুন।');
      return;
    }

    if (!useBackupMode && cleanCode.length !== 6) {
      setCodeError('অনুগ্রহ করে ৬-সংখ্যার Authenticator কোডটি লিখুন।');
      return;
    }

    setLoading(true);
    setCodeError('');

    try {
      const response = await axiosInstance.post(
        '/admin-verify-2fa',
        {
          session_key: twoFactorData?.session_key,
          code: cleanCode
        },
        { skipGlobalToast: true }
      );

      if (response.data.success) {
        storeAuth(response.data.token, response.data.user, 'admin');
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      setCode('');
      const msg = err.response?.data?.message || 'ভুল সিকিউরিটি কোড! সঠিক কোডটি দিন।';
      setCodeError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Copy manual key
  const handleCopySecret = () => {
    if (twoFactorData?.secret) {
      navigator.clipboard.writeText(twoFactorData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2500);
    }
  };

  // Copy all backup codes
  const handleCopyBackupCodes = () => {
    if (twoFactorData?.backup_codes) {
      const text = twoFactorData.backup_codes.join('\n');
      navigator.clipboard.writeText(text);
      setCopiedBackup(true);
      setTimeout(() => setCopiedBackup(false), 2500);
    }
  };

  // Download backup codes as TXT
  const handleDownloadBackupCodes = () => {
    if (twoFactorData?.backup_codes) {
      const content = `DoctorBooklet Enterprise Emergency 2FA Backup Codes\nAccount: ${email}\nDate: ${new Date().toLocaleString()}\n\n` +
        twoFactorData.backup_codes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
        `\n\n* Each code can be used ONLY ONCE if you lose access to your authenticator device.\n* Store this file securely.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `doctorbooklet-backup-codes-${email.split('@')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const isSetupMode = twoFactorData?.is_initial_setup === true;

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
        padding: isSetupMode ? '36px 32px' : '44px 40px',
        width: '100%',
        maxWidth: isSetupMode ? '520px' : '440px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.05), 0 8px 10px -6px rgba(15, 23, 42, 0.02)',
        transition: 'all 0.3s ease'
      }}>

        {/* Top Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
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

            {/* Zero-Trust Error Alert */}
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
                    placeholder="••••••••••••"
                    required
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 42px',
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
        ) : isSetupMode ? (
          /* STEP 2A: FIRST-TIME 2FA ENROLLMENT WITH QR CODE & BACKUP CODES */
          <>
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
                <span>{email || 'Admin'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 10px',
                boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
                color: '#FFFFFF'
              }}>
                <QrCode size={24} />
              </div>
              <h2 style={{ color: '#0F172A', fontWeight: 700, fontSize: '19px', marginBottom: '4px' }}>
                Google Authenticator সেটআপ করুন
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: 1.4 }}>
                আপনার ফোনের Google Authenticator অ্যাপ দিয়ে নিচের কিউআর কোডটি স্ক্যান করুন।
              </p>
            </div>

            {/* Error Alert */}
            {codeError && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FEE2E2',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                <span style={{ color: '#991B1B', fontSize: '13px', fontWeight: 500 }}>
                  {codeError}
                </span>
              </div>
            )}

            {/* QR Code Container */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '16px',
              padding: '18px',
              marginBottom: '18px'
            }}>
              {twoFactorData?.otpauth_url && (
                <div style={{
                  background: '#FFFFFF',
                  padding: '12px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <QRCodeSVG 
                    value={twoFactorData.otpauth_url} 
                    size={160} 
                    level="M" 
                    includeMargin={false}
                  />
                </div>
              )}

              {/* Manual Entry Secret Key */}
              <div style={{
                marginTop: '12px',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '12px'
              }}>
                <span style={{ color: '#64748B', fontFamily: 'monospace' }}>
                  কী: <strong style={{ color: '#0F172A', letterSpacing: '1px' }}>{twoFactorData?.secret}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleCopySecret}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: copiedSecret ? '#0D9488' : '#64748B',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {copiedSecret ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedSecret ? 'কপি হয়েছে' : 'কপি'}</span>
                </button>
              </div>
            </div>

            {/* Emergency Backup Codes Section */}
            <div style={{
              background: '#FFFBEB',
              border: '1px solid #FDE68A',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#92400E', fontSize: '12.5px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} /> জরুরি ব্যাকআপ কোডসমূহ (১ বার ব্যবহার্য)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleCopyBackupCodes}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FCD34D',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#92400E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    {copiedBackup ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedBackup ? 'কপি হয়েছে' : 'কপি'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadBackupCodes}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #FCD34D',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#92400E',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontWeight: 600
                    }}
                  >
                    <Download size={12} />
                    <span>TXT</span>
                  </button>
                </div>
              </div>

              {/* 2-Column Grid for Backup Codes */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#78350F'
              }}>
                {twoFactorData?.backup_codes?.map((codeItem, idx) => (
                  <div key={idx} style={{
                    background: '#FFFFFF',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    border: '1px solid #FEF3C7',
                    textAlign: 'center',
                    fontWeight: 600,
                    letterSpacing: '1px'
                  }}>
                    {codeItem}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="backup-confirm-checkbox"
                  checked={backupConfirmed}
                  onChange={(e) => setBackupConfirmed(e.target.checked)}
                  style={{ cursor: 'pointer', accentColor: '#0D9488', width: '15px', height: '15px' }}
                />
                <label 
                  htmlFor="backup-confirm-checkbox"
                  style={{ color: '#78350F', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', margin: 0 }}
                >
                  আমি ব্যাকআপ কোডগুলো নিরাপদ স্থানে সংরক্ষণ করেছি
                </label>
              </div>
            </div>

            {/* Confirm 6-digit form */}
            <form onSubmit={handleVerify2Fa}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{
                  display: 'block',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  marginBottom: '6px',
                  textAlign: 'center'
                }}>
                  অ্যাপের ৬-সংখ্যার কোডটি দিয়ে নিশ্চিত করুন
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setCode(val);
                    if (codeError) setCodeError('');
                  }}
                  autoFocus
                  required
                  placeholder="••••••"
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: '#FFFFFF',
                    border: '2px solid #CBD5E1',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: '22px',
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

              <button
                type="submit"
                disabled={loading || code.length !== 6 || !backupConfirmed}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: (loading || code.length !== 6 || !backupConfirmed) ? 'not-allowed' : 'pointer',
                  opacity: (loading || code.length !== 6 || !backupConfirmed) ? 0.65 : 1,
                  boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)',
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
                    <span>সেটআপ সম্পন্ন করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>সেটআপ সম্পন্ন ও লগইন করুন</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setCodeError('');
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
                <ArrowLeft size={14} /> বাতিল করুন
              </button>
            </div>
          </>
        ) : (
          /* STEP 2B: STANDARD DAILY VERIFICATION (GOOGLE AUTHENTICATOR OR BACKUP CODE) */
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
                <span>{email || 'Admin'}</span>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '22px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                background: useBackupMode 
                  ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' 
                  : 'linear-gradient(135deg, #0D9488 0%, #0F766E 100%)',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                boxShadow: useBackupMode 
                  ? '0 4px 14px rgba(245, 158, 11, 0.25)' 
                  : '0 4px 14px rgba(13, 148, 136, 0.25)',
                color: '#FFFFFF'
              }}>
                {useBackupMode ? <Key size={24} /> : <Smartphone size={26} />}
              </div>
              <h2 style={{
                color: '#0F172A',
                fontWeight: 700,
                fontSize: '20px',
                marginBottom: '6px'
              }}>
                {useBackupMode ? 'জরুরি ব্যাকআপ কোড' : '২-ধাপের যাচাইকরণ'}
              </h2>
              <p style={{ color: '#64748B', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                {useBackupMode 
                  ? 'আপনার ৮টি জরুরি রিকভারি কোডের যেকোনো একটি লিখুন।'
                  : 'আপনার Google Authenticator অ্যাপে প্রদর্শিত ৬-সংখ্যার কোডটি দিন।'}
              </p>
            </div>

            {/* Error Alert */}
            {codeError && (
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
                  {codeError}
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
                  {useBackupMode ? 'ব্যাকআপ রিকভারি কোড (XXXX-XXXX)' : '৬-সংখ্যার সিকিউরিটি কোড'}
                </label>
                <input
                  type="text"
                  maxLength={useBackupMode ? 9 : 6}
                  value={code}
                  onChange={(e) => {
                    let val = e.target.value.toUpperCase();
                    if (!useBackupMode) {
                      val = val.replace(/\D/g, '').slice(0, 6);
                    } else {
                      val = val.replace(/[^A-Z0-9-]/g, '').slice(0, 9);
                    }
                    setCode(val);
                    if (codeError) setCodeError('');
                  }}
                  autoFocus
                  required
                  placeholder={useBackupMode ? 'XXXX-XXXX' : '••••••'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: '#FFFFFF',
                    border: '2px solid #CBD5E1',
                    borderRadius: '12px',
                    color: '#0F172A',
                    fontSize: useBackupMode ? '20px' : '24px',
                    fontWeight: 700,
                    letterSpacing: useBackupMode ? '3px' : '8px',
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

              <button
                type="submit"
                disabled={loading || !code.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '100px',
                  fontSize: '14.5px',
                  fontWeight: 600,
                  cursor: (loading || !code.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !code.trim()) ? 0.65 : 1,
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

            {/* Toggle Between App Code and Backup Recovery Code */}
            <div style={{ marginTop: '18px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setUseBackupMode(!useBackupMode);
                  setCode('');
                  setCodeError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0D9488',
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {useBackupMode ? (
                  <>
                    <Smartphone size={14} />
                    <span>Google Authenticator অ্যাপ কোড ব্যবহার করুন</span>
                  </>
                ) : (
                  <>
                    <Key size={14} />
                    <span>ফোন সাথে নেই? জরুরি ব্যাকআপ কোড ব্যবহার করুন</span>
                  </>
                )}
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => {
                  setStep('credentials');
                  setCode('');
                  setCodeError('');
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
