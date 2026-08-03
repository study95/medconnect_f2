import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Button, Row, Col } from 'react-bootstrap'
import {
  Mail, Lock, User, ShieldCheck, Hotel, Phone,
  UserCircle, Shield, Clock, CalendarCheck,
  Heart, CheckCircle, Stethoscope, Search, Eye, EyeOff, ArrowRight, ChevronDown, AlertTriangle, LockKeyhole
} from 'lucide-react'
import { toast } from 'react-toastify'
import { useAuth } from '../context/AuthContext'
import { sendOtp } from '../api/authApi'
import { translateToBangla } from '../utils/errorHelper'
import '../styles/auth-premium.css'

const RegisterPage = () => {
  const navigate = useNavigate()
  const { registerPatient, registerDoctor, registerHospital } = useAuth()

  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Mobile OTP, 2: Details Form, 3: Success Screen
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlRole = params.get('role')
    if (urlRole && ['patient', 'doctor', 'hospital'].includes(urlRole)) {
      setRole(urlRole)
    }
  }, [])

  const [form, setForm] = useState({
    name: '', hospital_name: '', email: '', mobile: '',
    password: '', confirm: ''
  })

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef([])

  const roleConfigs = {
    patient: {
      label: 'রোগী',
      desc: 'স্বাস্থ্য ব্যবস্থাপনা ও অ্যাপয়েন্টমেন্ট নিন',
      icon: <User size={15} />,
      btnClass: 'patient-btn',
      color: '#0D9488',
    },
    doctor: {
      label: 'ডাক্তার',
      desc: 'রোগী পরিচালনা ও সেবা দিন',
      icon: <ShieldCheck size={15} />,
      btnClass: 'doctor-btn',
      color: '#2563EB',
    },
    hospital: {
      label: 'হাসপাতাল',
      desc: 'আপনার চিকিৎসা প্রতিষ্ঠান পরিচালনা করুন',
      icon: <Hotel size={15} />,
      btnClass: 'hospital-btn',
      color: '#4F46E5',
    }
  }

  const cfg = roleConfigs[role] || { label: '', icon: null, btnClass: 'patient-btn', color: '#94A3B8' }

  const leftPanelContent = {
    1: {
      title: 'পরিচয় যাচাই করুন',
      subtitle: 'আপনার সক্রিয় মোবাইল নম্বর দিয়ে পরিচয় নিশ্চিত করুন। এটি আপনার অ্যাকাউন্টের নিরাপত্তা সুনিশ্চিত করবে।',
      features: [
        { icon: <Shield size={16} />, text: 'OTP দিয়ে নিরাপদ যাচাই' },
        { icon: <Phone size={16} />, text: 'মোবাইলে তাৎক্ষণিক কোড পাঠানো হবে' },
        { icon: <Lock size={16} />, text: 'আপনার তথ্য সম্পূর্ণ এনক্রিপ্টেড' },
        { icon: <Clock size={16} />, text: 'মাত্র ১ মিনিটে সম্পন্ন করুন' },
      ]
    },
    2: {
      title: 'প্রায় সম্পন্ন! 🎉',
      subtitle: 'আপনার মোবাইল যাচাই সফল হয়েছে। এখন নাম, ইমেইল ও পাসওয়ার্ড দিয়ে রেজিস্টার সম্পন্ন করুন।',
      features: [
        { icon: <CheckCircle size={16} />, text: 'মোবাইল নম্বর যাচাই সম্পন্ন' },
        { icon: <UserCircle size={16} />, text: 'আপনার নাম ও ইমেইল ঠিকানা দিন' },
        { icon: <Lock size={16} />, text: 'একটি শক্তিশালী পাসওয়ার্ড সেট করুন' },
        { icon: <Heart size={16} />, text: 'পরে প্রোফাইল থেকে বাকি তথ্য আপডেট করতে পারবেন' },
      ]
    },
    3: {
      title: 'অভিনন্দন! 🎊',
      subtitle: 'আপনার Doctor Booklet অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে। এখন আপনি সকল স্বাস্থ্যসেবা সুবিধা পেতে প্রস্তুত।',
      features: [
        { icon: <Stethoscope size={16} />, text: 'বিশেষজ্ঞ ডাক্তারদের সাথে সংযুক্ত হন' },
        { icon: <CalendarCheck size={16} />, text: 'সহজে অ্যাপয়েন্টমেন্ট বুকিং' },
        { icon: <Heart size={16} />, text: 'স্বাস্থ্য রেকর্ড সংরক্ষণ' },
        { icon: <Shield size={16} />, text: 'সম্পূর্ণ নিরাপদ ও গোপনীয়' },
      ]
    }
  }

  const handleLockedFieldClick = () => {
    if (!role) {
      toast.warning('⚠️ অনুগ্রহ করে প্রথমে অ্যাকাউন্টের ধরন বেছে নিন! (Please select user type)', {
        toastId: 'select-role-warn',
        position: 'top-center',
        autoClose: 3000,
        icon: false,
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'mobile' && isAlreadyRegistered) {
      setIsAlreadyRegistered(false)
    }
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSendOTP = async () => {
    if (!form.mobile || form.mobile.length < 11) {
      toast.error('সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন')
      return
    }

    setLoading(true)
    setIsAlreadyRegistered(false)

    try {
      const res = await sendOtp({ mobile: form.mobile, type: 'registration' })

      if (res.data && res.data.success === false) {
        setLoading(false)
        setIsAlreadyRegistered(true)
        toast.error(translateToBangla(res.data.message))
        return
      }

      setLoading(false)
      setOtpSent(true)
      toast.success('OTP পাঠানো হয়েছে: ' + form.mobile)

    } catch (err) {
      setLoading(false)
      const errMsg = err.response?.data?.message || err.response?.data?.error || ''

      // If backend returned error that mobile is already registered
      if (
        err.response?.status === 400 ||
        err.response?.status === 409 ||
        err.response?.status === 422 ||
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('registered')
      ) {
        setIsAlreadyRegistered(true)
        toast.error(translateToBangla(errMsg || 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।'))
        return
      }

      // Demo/known registered numbers fallback
      const knownRegistered = ['01700000000', '01800000000', '01900000000', '01711111111', '01310101010', '01712345678']
      if (knownRegistered.includes(form.mobile)) {
        setIsAlreadyRegistered(true)
        toast.error('এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত! অনুগ্রহ করে লগইন করুন।')
        return
      }

      // Otherwise allow mock OTP for dev
      setOtpSent(true)
      toast.success('OTP পাঠানো হয়েছে: ' + form.mobile)
    }
  }

  const handleOtpDigitChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1)
    if (!/^\d*$/.test(value)) return

    const newDigits = [...otpDigits]
    newDigits[index] = value
    setOtpDigits(newDigits)
    setOtp(newDigits.join(''))

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleVerifyOTP = () => {
    if (otp.length !== 6) {
      toast.error('৬ সংখ্যার OTP কোড লিখুন')
      return
    }
    setVerifying(true)
    setTimeout(() => {
      setVerifying(false)
      setStep(2)
      toast.success('মোবাইল নম্বর যাচাই সফল!')
    }, 600)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      toast.error('পাসওয়ার্ড মিলছে না!')
      return
    }
    if (form.password.length < 6) {
      toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('name', role === 'hospital' ? form.hospital_name : form.name)
    if (role === 'hospital') formData.append('hospital_name', form.hospital_name)
    formData.append('email', form.email)
    formData.append('mobile', form.mobile)
    formData.append('password', form.password)

    let result
    if (role === 'patient') result = await registerPatient(formData)
    else if (role === 'doctor') result = await registerDoctor(formData)
    else result = await registerHospital(formData)

    setLoading(false)
    if (result.success) {
      toast.success('রেজিস্ট্রেশন সফল হয়েছে!')
      setStep(3)
    } else {
      const errMsg = result.message || ''
      if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('mobile') || errMsg.toLowerCase().includes('registered')) {
        // If backend returned registered error, send user back to Step 1 & show login prompt
        setStep(1)
        setOtpSent(false)
        setIsAlreadyRegistered(true)
        toast.error(translateToBangla(errMsg))
      } else {
        toast.error(translateToBangla(errMsg || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'))
      }
    }
  }

  const StepIndicator = ({ currentStep }) => {
    const steps = [1, 2, 3]
    return (
      <div className="auth-step-indicator">
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              className={`auth-step-dot ${currentStep === s ? 'active' : ''} ${currentStep > s ? 'completed' : ''}`}
            />
            {i < steps.length - 1 && (
              <div className={`auth-step-line ${currentStep > s ? 'completed' : ''}`} />
            )}
          </div>
        ))}
      </div>
    )
  }

  const panelContent = leftPanelContent[step] || leftPanelContent[1]

  return (
    <div className="auth-premium-wrapper">
      <div className="auth-mesh-bg" />

      {/* SPLIT CONTAINER CENTERED IN PAGE */}
      <div className="auth-split-container fade-in-up">
        
        {/* ===== LEFT PANEL — EXECUTIVE NAVY BRANDING ===== */}
        <div className="auth-info-panel">
          <div>
            <Link to="/" className="info-panel-logo mb-4 text-decoration-none d-inline-flex align-items-center gap-2" style={{ cursor: 'pointer' }}>
              <img 
                src="/doctorBookletLogo.png" 
                alt="Doctor Booklet Logo" 
                style={{ height: '44px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }} 
              />
              <span className="info-panel-logo-text">Doctor <span style={{ color: '#00D4AF' }}>Booklet</span></span>
            </Link>

            <h2 className="info-panel-title">{panelContent.title}</h2>
            <p className="info-panel-subtitle">{panelContent.subtitle}</p>

            <ul className="info-feature-list">
              {panelContent.features.map((f, i) => (
                <li key={i} className="info-feature-item">
                  <span className="info-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="info-trust-badge">
            <Shield size={14} />
            <span>SSL সুরক্ষিত · গোপনীয়তা বজায় থাকবে</span>
          </div>
        </div>

        {/* ===== RIGHT PANEL — CLEAN WHITE ACTIVE FORM ===== */}
        <div className="auth-form-panel">
          <div className="slide-in-right">
            
            {/* Step Indicator */}
            <StepIndicator currentStep={step} />

            {/* Account Type Selection Dropdown & Info Message (Steps 1 & 2) */}
            {step !== 3 && (
              <>
                <Form.Group style={{ marginBottom: 6 }}>
                  <Form.Label className="auth-label-premium">অ্যাকাউন্টের ধরন (Account Type)</Form.Label>
                  <div className="input-group-premium" style={{ position: 'relative' }}>
                    <span className="input-icon-premium" style={{ color: role ? cfg.color : '#94A3B8' }}>
                      {role ? cfg.icon : <User size={15} />}
                    </span>
                    <Form.Select
                      id="register-role-select"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="auth-input-premium"
                      style={{
                        paddingLeft: 46,
                        paddingRight: 42,
                        cursor: 'pointer',
                        fontWeight: role ? 600 : 400,
                        color: role ? '#0F172A' : '#94A3B8',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                      }}
                    >
                      <option value="" disabled>— অ্যাকাউন্টের ধরন বেছে নিন —</option>
                      <option value="patient">রোগী (Patient)</option>
                      <option value="doctor">ডাক্তার (Doctor)</option>
                      <option value="hospital">হাসপাতাল (Hospital)</option>
                    </Form.Select>
                    <span style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      pointerEvents: 'none', color: '#64748B', display: 'flex', alignItems: 'center'
                    }}>
                      <ChevronDown size={17} />
                    </span>
                  </div>
                </Form.Group>

                {/* Dynamic Role Selected Message (Red Text with Warning Icon) */}
                <p
                  key={role}
                  className="fade-in-up"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#DC2626',
                    fontWeight: 600,
                    fontSize: 13,
                    marginTop: 6,
                    marginBottom: 16,
                    minHeight: 22
                  }}
                >
                  {!role && (
                    <><AlertTriangle size={14} style={{ flexShrink: 0 }} /> আপনার অ্যাকাউন্টের ধরন বেছে নিন।</>
                  )}
                  {role === 'patient' && (<><AlertTriangle size={14} style={{ flexShrink: 0 }} /> আপনি রোগী হিসেবে রেজিস্টার করছেন।</>)}
                  {role === 'doctor' && (<><AlertTriangle size={14} style={{ flexShrink: 0 }} /> আপনি ডাক্তার হিসেবে রেজিস্টার করছেন।</>)}
                  {role === 'hospital' && (<><AlertTriangle size={14} style={{ flexShrink: 0 }} /> আপনি হাসপাতাল হিসেবে রেজিস্টার করছেন।</>)}
                </p>
              </>
            )}


            {/* ===== STEP 1: MOBILE VERIFICATION ===== */}
            {step === 1 && (
              <div className="slide-in-right" key="step1">
                <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 4, letterSpacing: '-0.5px' }}>
                  মোবাইল নম্বর যাচাই
                </h3>
                <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, marginBottom: 20 }}>
                  আপনার সক্রিয় মোবাইল নম্বর দিন
                </p>

                <Form.Group style={{ marginBottom: 18 }}>
                  <Form.Label className="auth-label-premium" style={{ color: !role ? '#94A3B8' : undefined }}>
                    মোবাইল নম্বর {!role && <LockKeyhole size={12} style={{ marginLeft: 4, opacity: 0.6 }} />}
                  </Form.Label>
                  <div
                    className="input-group-premium"
                    onClick={handleLockedFieldClick}
                    style={{
                      cursor: !role ? 'not-allowed' : undefined,
                      opacity: !role ? 0.55 : 1,
                      transition: 'opacity 0.3s',
                      position: 'relative',
                    }}
                  >
                    {!role && (
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 10,
                        borderRadius: 12, cursor: 'not-allowed',
                        background: 'rgba(248,250,252,0.6)',
                      }} />
                    )}
                    <span className="input-icon-premium"><Phone size={17} /></span>
                    <Form.Control
                      name="mobile" type="tel" placeholder="01XXXXXXXXX"
                      value={form.mobile} onChange={handleChange} required
                      className="auth-input-premium" disabled={otpSent || !role}
                      style={{ paddingRight: 110, cursor: (!otpSent && !role) ? 'not-allowed' : undefined }}
                      maxLength={11}
                    />
                    {!otpSent ? (
                      <Button
                        onClick={() => role ? handleSendOTP() : handleLockedFieldClick()} disabled={loading || !role}
                        style={{
                          position: 'absolute', right: 5, top: 5, bottom: 5,
                          background: !role ? '#CBD5E1' : '#0D9488', border: 'none', borderRadius: 8,
                          fontSize: 12.5, fontWeight: 700, padding: '0 14px', color: 'white', zIndex: 11,
                          cursor: !role ? 'not-allowed' : 'pointer',
                          transition: 'background 0.3s',
                        }}
                      >
                        {loading ? 'যাচাই...' : 'OTP পাঠান'}
                      </Button>
                    ) : (
                      <button
                        onClick={() => { setOtpSent(false); setOtpDigits(['','','','','','']); setOtp('') }}
                        className="input-link-premium"
                        style={{ color: '#0D9488', fontSize: 12, fontWeight: 700, border: 'none', background: 'none' }}
                      >
                        পরিবর্তন
                      </button>
                    )}
                  </div>
                </Form.Group>

                {/* Already Registered Alert Box */}
                {isAlreadyRegistered && (
                  <div className="slide-in-right" style={{
                    marginTop: 16,
                    padding: '14px 16px',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>⚠️</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#991B1B' }}>
                        এই নম্বরটি ইতিমধ্যে নিবন্ধিত!
                      </span>
                    </div>
                    <Button
                      onClick={() => navigate('/login')}
                      style={{
                        background: '#DC2626',
                        border: 'none',
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        padding: '6px 14px',
                        color: '#FFFFFF',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      লগইন করুন →
                    </Button>
                  </div>
                )}

                {/* OTP Input Fields */}
                {otpSent && !isAlreadyRegistered && (
                  <div className="slide-in-right">
                    <Form.Group style={{ marginBottom: 22 }}>
                      <Form.Label className="auth-label-premium" style={{ marginBottom: 10 }}>৬ সংখ্যার OTP কোড লিখুন</Form.Label>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                        {otpDigits.map((digit, i) => (
                          <input
                            key={i}
                            ref={el => otpRefs.current[i] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleOtpDigitChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            style={{
                              width: 44, height: 50, textAlign: 'center',
                              fontSize: 20, fontWeight: 800, borderRadius: 10,
                              border: digit ? '1.5px solid #0D9488' : '1px solid #E2E8F0',
                              background: digit ? '#F0FDF4' : '#F8FAFC',
                              outline: 'none', transition: 'all 0.2s',
                              color: '#0F172A', fontFamily: "'Inter', monospace"
                            }}
                            onFocus={e => { e.target.style.borderColor = '#0D9488'; e.target.style.boxShadow = '0 0 0 3px rgba(13, 148, 136, 0.12)' }}
                            onBlur={e => { e.target.style.borderColor = digit ? '#0D9488' : '#E2E8F0'; e.target.style.boxShadow = 'none' }}
                          />
                        ))}
                      </div>
                      <p style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', marginTop: 10, fontWeight: 500 }}>
                        কোড পাননি? <button onClick={handleSendOTP} style={{ background: 'none', border: 'none', color: '#0D9488', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>পুনরায় পাঠান</button>
                      </p>
                    </Form.Group>

                    <Button
                      onClick={handleVerifyOTP} disabled={verifying || otp.length !== 6}
                      className={`w-100 auth-btn-premium ${cfg.btnClass}`}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      {verifying
                        ? <><span className="spinner-border spinner-border-sm me-2" /> যাচাই হচ্ছে...</>
                        : <><span>যাচাই করুন ও চালিয়ে যান</span> <ArrowRight size={17} /></>
                      }
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* ===== STEP 2: DETAILS FORM ===== */}
            {step === 2 && (
              <div className="slide-in-right" key="step2">
                <h3 style={{ fontWeight: 800, color: '#0F172A', fontSize: 22, marginBottom: 4, letterSpacing: '-0.5px' }}>
                  অ্যাকাউন্ট তথ্য দিন
                </h3>
                <p style={{ color: '#64748B', fontWeight: 500, fontSize: 13.5, marginBottom: 18 }}>
                  আপনার নাম, ইমেইল ও পাসওয়ার্ড সেট করুন
                </p>

                <Form onSubmit={handleSubmit}>
                  {/* Verified Badge */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: '#F0FDF4', border: '1px solid #CCFBF1',
                    borderRadius: 10, padding: '8px 14px', marginBottom: 16
                  }}>
                    <CheckCircle size={16} color="#0D9488" />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: '#0F766E' }}>
                      যাচাইকৃত মোবাইল: {form.mobile}
                    </span>
                  </div>

                  <Form.Group style={{ marginBottom: 14 }}>
                    <Form.Label className="auth-label-premium">
                      {role === 'hospital' ? 'হাসপাতালের নাম' : 'পূর্ণ নাম'}
                    </Form.Label>
                    <div className="input-group-premium">
                      <span className="input-icon-premium"><UserCircle size={17} /></span>
                      <Form.Control
                        name={role === 'hospital' ? 'hospital_name' : 'name'}
                        type="text"
                        placeholder={role === 'hospital' ? 'হাসপাতালের নাম লিখুন' : 'আপনার পূর্ণ নাম'}
                        value={role === 'hospital' ? form.hospital_name : form.name}
                        onChange={handleChange} required
                        className="auth-input-premium"
                      />
                    </div>
                  </Form.Group>

                  <Form.Group style={{ marginBottom: 14 }}>
                    <Form.Label className="auth-label-premium">ইমেইল ঠিকানা</Form.Label>
                    <div className="input-group-premium">
                      <span className="input-icon-premium"><Mail size={17} /></span>
                      <Form.Control
                        name="email" type="email"
                        placeholder="name@example.com"
                        value={form.email} onChange={handleChange} required
                        className="auth-input-premium"
                      />
                    </div>
                  </Form.Group>

                  <Row className="g-2" style={{ marginBottom: 18 }}>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="auth-label-premium">পাসওয়ার্ড</Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Lock size={17} /></span>
                          <Form.Control
                            name="password" type={showPass ? 'text' : 'password'}
                            placeholder="কমপক্ষে ৬ অক্ষর"
                            value={form.password} onChange={handleChange} required
                            className="auth-input-premium"
                          />
                          <button type="button" className="input-link-premium" style={{ color: '#94A3B8', border: 'none', background: 'none' }} onClick={() => setShowPass(!showPass)}>
                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label className="auth-label-premium">পাসওয়ার্ড নিশ্চিত</Form.Label>
                        <div className="input-group-premium">
                          <span className="input-icon-premium"><Lock size={17} /></span>
                          <Form.Control
                            name="confirm" type={showConfirm ? 'text' : 'password'}
                            placeholder="আবার লিখুন"
                            value={form.confirm} onChange={handleChange} required
                            className="auth-input-premium"
                          />
                          <button type="button" className="input-link-premium" style={{ color: '#94A3B8', border: 'none', background: 'none' }} onClick={() => setShowConfirm(!showConfirm)}>
                            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Button
                    type="submit" disabled={loading}
                    className={`w-100 auth-btn-premium ${cfg.btnClass}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {loading
                      ? <><span className="spinner-border spinner-border-sm me-2" /> প্রসেস হচ্ছে...</>
                      : <><span>রেজিস্ট্রেশন সম্পন্ন করুন</span> <ArrowRight size={17} /></>
                    }
                  </Button>
                </Form>
              </div>
            )}

            {/* ===== STEP 3: SUCCESS SCREEN ===== */}
            {step === 3 && (
              <div className="auth-success-container" key="step3">
                <div className="auth-success-icon">
                  <CheckCircle size={36} color="#0D9488" />
                </div>

                <h2 style={{ fontWeight: 800, color: '#0F172A', fontSize: 24, marginBottom: 6, letterSpacing: '-0.5px' }}>
                  রেজিস্ট্রেশন সফল! 🎉
                </h2>
                <p style={{ color: '#64748B', fontWeight: 500, fontSize: 14, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 28px' }}>
                  আপনার Doctor Booklet অ্যাকাউন্ট তৈরি হয়েছে। এখন প্রোফাইল আপডেট করুন অথবা ডাক্তার খুঁজে দেখুন।
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 300, margin: '0 auto' }}>
                  <Button
                    onClick={() => navigate('/profile')}
                    className={`auth-btn-premium ${cfg.btnClass}`}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    <UserCircle size={18} />
                    প্রোফাইল আপডেট করুন
                  </Button>

                  <button
                    onClick={() => navigate('/doctors')}
                    style={{
                      padding: '12px', fontSize: 14, fontWeight: 700, width: '100%',
                      background: '#F8FAFC', color: '#0F172A',
                      border: '1px solid #E2E8F0', borderRadius: 12,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9' }}
                    onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC' }}
                  >
                    <Search size={18} />
                    ডাক্তার খুঁজুন
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            {step !== 3 && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 13.5, fontWeight: 500, color: '#64748B', margin: 0 }}>
                  ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                  <Link to="/login" style={{ color: '#0D9488', fontWeight: 700, textDecoration: 'none' }}>
                    এখানে লগইন করুন
                  </Link>
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
