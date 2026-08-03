import React, { useState } from 'react'
import { Eye, EyeOff, CheckCircle2, Circle } from 'lucide-react'

export default function PasswordInput({ 
  value, 
  onChange, 
  name = "password", 
  placeholder = "Enter your password", 
  className = "", 
  showStrength = true 
}) {
  const [showPassword, setShowPassword] = useState(false)

  // Validation criteria
  const hasMinLength = value.length >= 12
  const hasUppercase = /[A-Z]/.test(value)
  const hasLowercase = /[a-z]/.test(value)
  const hasNumber = /[0-9]/.test(value)
  const hasSymbol = /[@$!%*#?&]/.test(value)

  const toggleVisibility = () => {
    setShowPassword(!showPassword)
  }

  const criteria = [
    { label: "Min 12 Characters", met: hasMinLength },
    { label: "Uppercase Letter", met: hasUppercase },
    { label: "Lowercase Letter", met: hasLowercase },
    { label: "Number", met: hasNumber },
    { label: "Symbol (@$!%*#?&)", met: hasSymbol }
  ]

  return (
    <div className="password-input-wrapper" style={{ width: '100%', position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <input
          className={className}
          type={showPassword ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{ paddingRight: '40px' }} // make room for the eye icon
        />
        <button
          type="button"
          onClick={toggleVisibility}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4
          }}
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: '#F8FAFC',
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px'
        }}>
          {criteria.map((c, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: c.met ? '#10B981' : '#64748B',
              fontWeight: c.met ? '600' : '400',
              transition: 'all 0.2s ease'
            }}>
              {c.met ? (
                <CheckCircle2 size={14} color="#10B981" />
              ) : (
                <Circle size={14} color="#CBD5E1" />
              )}
              {c.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
