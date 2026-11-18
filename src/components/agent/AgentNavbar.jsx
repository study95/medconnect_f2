import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Gauge, 
  Stethoscope, 
  ClipboardList, 
  Wallet, 
  ArrowUpRight, 
  Sparkles,
  ChevronRight,
  Lock
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import agentApi from '../../api/agentApi'

export default function AgentNavbar() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')
  const location = useLocation()
  const [balance, setBalance] = useState(null)

  useEffect(() => {
    let isMounted = true
    agentApi.getWalletStatement({ per_page: 1 })
      .then((res) => {
        if (isMounted && res.data?.summary?.available_balance !== undefined) {
          setBalance(res.data.summary.available_balance)
        }
      })
      .catch(() => {})

    return () => { isMounted = false }
  }, [location.pathname])

  const navLinks = [
    { to: '/agent', label: 'Overview', icon: Gauge, exact: true },
    { 
      to: '/agent/onboard/doctor', 
      label: isAgentSuspended ? 'Onboard (Locked)' : '+ Onboard Doctor', 
      icon: isAgentSuspended ? Lock : Stethoscope,
      locked: isAgentSuspended
    },
    { to: '/agent/tracker', label: 'My Submissions', icon: ClipboardList },
    { to: '/agent/wallet', label: 'Commission Wallet', icon: Wallet },
  ]

  const isLinkActive = (item) => {
    if (item.exact) {
      return location.pathname === item.to
    }
    return location.pathname.startsWith(item.to)
  }

  return (
    <div style={{
      position: 'sticky',
      top: 'var(--header-height, 102px)',
      zIndex: 90,
      background: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '0 20px',
        height: 54,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16
      }}>
        {/* Left: Partner Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg, rgba(0, 184, 117, 0.12) 0%, rgba(2, 132, 199, 0.12) 100%)',
            color: '#00B875',
            padding: '4px 10px',
            borderRadius: 8,
            border: '1px solid rgba(0, 184, 117, 0.25)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B875', boxShadow: '0 0 6px #00B875' }} />
            Field Partner Desk
          </span>
        </div>

        {/* Center: Navigation Links */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: '#F1F5F9',
          padding: '3px 5px',
          borderRadius: 10,
        }}>
          {navLinks.map((item) => {
            const active = isLinkActive(item)
            const Icon = item.icon
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: active ? 800 : 600,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  background: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#00B875' : '#64748B',
                  boxShadow: active ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <Icon size={14} color={active ? '#00B875' : '#64748B'} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right: Wallet Balance & Admin Desk shortcut */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to="/agent/wallet"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: 'rgba(0, 184, 117, 0.1)',
              border: '1px solid rgba(0, 184, 117, 0.3)',
              textDecoration: 'none',
              fontSize: 12.5,
              fontWeight: 800,
              color: '#00B875'
            }}
          >
            <Wallet size={13} />
            <span>৳{balance !== null ? parseFloat(balance).toFixed(2) : '0.00'}</span>
          </Link>

          {(isAdmin || isSuperAdmin) && (
            <Link
              to="/admin/dashboard"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11.5,
                fontWeight: 700,
                color: '#0284C7',
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(2, 132, 199, 0.2)',
                textDecoration: 'none'
              }}
            >
              <span>Admin Desk</span>
              <ArrowUpRight size={12} />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
