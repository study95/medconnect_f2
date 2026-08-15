// DashboardPage.jsx — Premium Analytics Dashboard with Recharts
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getDashboardStats, getDashboardAnalytics } from '../../api/adminApi'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const RANGE_OPTIONS = [
  { key: 'day', label: 'Daily (30d)' },
  { key: 'week', label: 'Weekly (12w)' },
  { key: 'month', label: 'Monthly (12m)' },
]

const PIE_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']

// Animated number counter
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    if (num === 0) { setDisplay(0); return }
    const duration = 800
    const steps = 30
    const increment = num / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= num) { setDisplay(num); clearInterval(timer) }
      else setDisplay(Math.floor(current))
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])
  return <>{prefix}{display.toLocaleString()}{suffix}</>
}

// Premium tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--admin-card-bg)', backdropFilter: 'blur(12px)',
      padding: '12px 16px', borderRadius: 12, border: '1px solid var(--admin-border)',
      boxShadow: 'var(--admin-shadow-lg)'
    }}>
      <p style={{ margin: '0 0 8px', fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: '2px 0', fontSize: 13, fontWeight: 700, color: p.color || 'var(--admin-text)' }}>
          {p.name}: {typeof p.value === 'number' && p.value > 99 ? `৳${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  )
}

// Stat card
function StatCard({ icon, label, value, prefix, suffix, color, bg, to }) {
  const inner = (
    <div style={{
      background: 'var(--admin-card-bg)', borderRadius: 20, padding: '24px 20px',
      display: 'flex', alignItems: 'center', gap: 18,
      border: `1px solid var(--admin-border)`, transition: 'all 0.3s',
      cursor: to ? 'pointer' : 'default', position: 'relative', overflow: 'hidden'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 12px 32px ${color}25` }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{
        position: 'absolute', top: -20, right: -20, width: 100, height: 100,
        borderRadius: '50%', background: `${color}08`
      }} />
      <div style={{
        width: 56, height: 56, borderRadius: 16, background: `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 26, flexShrink: 0
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 28, fontWeight: 900, color: 'var(--admin-text)',
          lineHeight: 1.1, letterSpacing: '-0.5px'
        }}>
          <AnimatedNumber value={value} prefix={prefix || ''} suffix={suffix || ''} />
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', letterSpacing: '0.3px' }}>
          {label}
        </p>
      </div>
    </div>
  )
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

// Chart card wrapper
function ChartCard({ title, subtitle, children, span = 1 }) {
  return (
    <div style={{
      background: 'var(--admin-card-bg)', borderRadius: 20, padding: '24px',
      border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-shadow)',
      gridColumn: span > 1 ? `span ${span}` : undefined,
      transition: 'box-shadow 0.3s',
    }}
    onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--admin-shadow-md)'}
    onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--admin-shadow)'}
    >
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: 'var(--admin-text)' }}>{title}</h3>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 500 }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const { isAdmin, isDoctor, isManager, user } = useAuth()
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [range, setRange] = useState('month')
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const res = await getDashboardStats()
      setStats(res.data.data)
    } catch (err) { console.error('Stats error:', err) }
    finally { setLoading(false) }
  }, [])

  const fetchAnalytics = useCallback(async (r) => {
    try {
      setAnalyticsLoading(true)
      const res = await getDashboardAnalytics({ range: r })
      setAnalytics(res.data.data)
    } catch (err) { console.error('Analytics error:', err) }
    finally { setAnalyticsLoading(false) }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchAnalytics(range) }, [range, fetchAnalytics])

  const handleRangeChange = (r) => setRange(r)

  // Format period labels for readability
  const formatLabel = (period) => {
    if (!period) return ''
    if (range === 'day') {
      const d = new Date(period)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (range === 'week') return period.replace(/^\d{4}-/, '')
    if (range === 'month') {
      const [y, m] = period.split('-')
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      return `${months[parseInt(m)-1]} ${y.slice(2)}`
    }
    return period
  }

  // Build chart data from analytics
  const appointmentsChartData = analytics?.appointments?.trend?.map(d => ({
    name: formatLabel(d.period),
    Total: d.value,
    Pending: analytics.appointments.by_status.pending?.find(x => x.period === d.period)?.value || 0,
    Confirmed: analytics.appointments.by_status.confirmed?.find(x => x.period === d.period)?.value || 0,
    Completed: analytics.appointments.by_status.completed?.find(x => x.period === d.period)?.value || 0,
    Cancelled: analytics.appointments.by_status.cancelled?.find(x => x.period === d.period)?.value || 0,
  })) || []

  const paymentsChartData = analytics?.payments?.paid?.map((d, i) => ({
    name: formatLabel(d.period),
    Paid: d.value,
    Unpaid: analytics.payments.unpaid?.[i]?.value || 0,
  })) || []

  const growthChartData = analytics?.users?.map((d, i) => ({
    name: formatLabel(d.period),
    Users: d.value,
    Patients: analytics.patients?.[i]?.value || 0,
    Doctors: analytics.doctors?.[i]?.value || 0,
  })) || []

  const statusPieData = analytics?.appointments?.status_breakdown
    ? Object.entries(analytics.appointments.status_breakdown).map(([k, v]) => ({
        name: k.charAt(0).toUpperCase() + k.slice(1), value: v
      }))
    : []

  const topDoctorsData = (analytics?.top_doctors || []).map(d => ({
    name: d.name?.length > 15 ? d.name.slice(0, 15) + '…' : d.name,
    Appointments: d.total_appointments,
    Revenue: Math.round(d.total_revenue),
  }))

  if (loading) {
    return <div className="admin-loading"><div className="admin-spinner" /> Loading dashboard...</div>
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 16, marginBottom: 32
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--admin-text)', letterSpacing: '-0.5px' }}>
            {isDoctor ? `Welcome, Dr. ${user?.name}` : '📊 Analytics Dashboard'}
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
            {isAdmin && 'System-wide performance overview'}
            {isManager && 'Hospital performance overview'}
            {isDoctor && 'Your practice performance overview'}
          </p>
        </div>
        <div style={{
          display: 'flex', gap: 4, padding: 4, background: 'var(--admin-bg)',
          borderRadius: 14, border: '1px solid var(--admin-border)'
        }}>
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => handleRangeChange(opt.key)}
              style={{
                padding: '10px 18px', borderRadius: 10, border: 'none',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.25s ease',
                background: range === opt.key ? 'var(--admin-primary)' : 'transparent',
                color: range === opt.key ? '#FFFFFF' : 'var(--admin-text-muted)',
                boxShadow: range === opt.key ? '0 4px 12px rgba(0, 184, 117, 0.25)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stats Row */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16, marginBottom: 32
        }}>
          {isAdmin && <>
            <StatCard icon="👨‍⚕️" label="Total Doctors" value={stats.total_doctors} color="#6366F1" to="/admin/doctors" />
            <StatCard icon="🏥" label="Total Hospitals" value={stats.total_hospitals} color="#0EA5E9" to="/admin/hospitals" />
            <StatCard icon="📅" label="Total Appointments" value={stats.total_appointments} color="#F59E0B" to="/admin/appointments" />
            <StatCard icon="💰" label="Revenue Collected" value={stats.total_payments_collected || 0} prefix="৳" color="#10B981" to="/admin/payments" />
            <StatCard icon="👥" label="Total Users" value={stats.total_users} color="#8B5CF6" to="/admin/users" />
          </>}
          {isDoctor && <>
            <StatCard icon="📅" label="Total Appointments" value={stats.total_appointments} color="#6366F1" to="/admin/appointments" />
            <StatCard icon="⏳" label="Pending" value={stats.pending_appointments} color="#F59E0B" />
            <StatCard icon="✅" label="Confirmed" value={stats.confirmed_appointments} color="#3B82F6" />
            <StatCard icon="✔️" label="Completed" value={stats.completed_appointments} color="#10B981" />
            <StatCard icon="💰" label="My Earnings" value={stats.total_payments_collected || 0} prefix="৳" color="#8B5CF6" to="/admin/payments" />
          </>}
          {isManager && <>
            <StatCard icon="👨‍⚕️" label="Doctors" value={stats.total_doctors} color="#6366F1" />
            <StatCard icon="🏢" label="Chambers" value={stats.total_chambers} color="#0EA5E9" to="/admin/chambers" />
            <StatCard icon="📅" label="Appointments" value={stats.total_appointments} color="#F59E0B" to="/admin/appointments" />
            <StatCard icon="⏳" label="Pending" value={stats.pending_appointments} color="#EF4444" />
          </>}
        </div>
      )}

      {/* Charts Loading */}
      {analyticsLoading ? (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: 60, color: 'var(--admin-text-muted)', fontSize: 14, fontWeight: 600
        }}>
          <div className="admin-spinner" style={{ marginRight: 12 }} /> Loading analytics...
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 24,
        }}>
          {/* 1. Appointments Trend — Area Chart */}
          <ChartCard title="📅 Appointments Trend" subtitle={`${range === 'day' ? 'Last 30 days' : range === 'week' ? 'Last 12 weeks' : 'Last 12 months'}`}>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={appointmentsChartData}>
                <defs>
                  <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="Total" stroke="#6366F1" strokeWidth={2.5} fill="url(#gradTotal)" />
                <Area type="monotone" dataKey="Completed" stroke="#10B981" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="Cancelled" stroke="#EF4444" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2. Appointment Status — Pie/Doughnut */}
          <ChartCard title="📊 Status Breakdown" subtitle="Current period distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={statusPieData}
                  cx="50%" cy="50%"
                  innerRadius={65} outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {statusPieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: 12, fontWeight: 600 }}
                  formatter={(value) => <span style={{ color: 'var(--admin-text)' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3. Revenue Analytics — Bar Chart */}
          <ChartCard title="💰 Revenue Analytics" subtitle={`Paid: ৳${(analytics?.payments?.total_paid || 0).toLocaleString()} · Unpaid: ৳${(analytics?.payments?.total_unpaid || 0).toLocaleString()}`}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={paymentsChartData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="Paid" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Bar dataKey="Unpaid" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={32} />
                <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4. Growth Chart — Admin/Manager only */}
          {(isAdmin || isManager) && growthChartData.length > 0 && (
            <ChartCard title="📈 User & Registration Growth" subtitle="New registrations over time">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={growthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="Users" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r: 4, fill: '#8B5CF6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Patients" stroke="#0EA5E9" strokeWidth={2.5} dot={{ r: 4, fill: '#0EA5E9' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Doctors" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* 5. Top Doctors — Admin/Manager only */}
          {(isAdmin || isManager) && topDoctorsData.length > 0 && (
            <ChartCard title="🏆 Top Doctors" subtitle="By appointment volume" span={2}>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topDoctorsData} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: 'var(--admin-text)', fontWeight: 600 }} tickLine={false} axisLine={false} width={130} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="Appointments" fill="#6366F1" radius={[0, 8, 8, 0]} maxBarSize={28} />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Doctor-only: Additional quick stats */}
          {isDoctor && stats && (
            <ChartCard title="📋 Quick Stats" subtitle="Your practice summary" span={2}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 16
              }}>
                {[
                  { icon: '🏢', label: 'My Chambers', value: stats.total_chambers, color: '#6366F1' },
                  { icon: '📋', label: 'Prescriptions', value: stats.total_prescriptions, color: '#10B981' },
                  { icon: '❌', label: 'Cancelled', value: stats.cancelled_appointments, color: '#EF4444' },
                ].map(s => (
                  <div key={s.label} style={{
                    padding: '20px 16px', borderRadius: 16,
                    background: 'var(--admin-bg)', border: `1px solid var(--admin-border)`,
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
                    <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: 'var(--admin-text)' }}>
                      <AnimatedNumber value={s.value} />
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </ChartCard>
          )}

          {/* Admin extra stats row */}
          {isAdmin && stats && (
            <ChartCard title="🗺️ Platform Overview" subtitle="Locations & infrastructure" span={2}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: 12
              }}>
                {[
                  { icon: '🏷️', label: 'Specialties', value: stats.total_specialties, color: '#10B981', to: '/admin/specialties' },
                  { icon: '🗺️', label: 'Divisions', value: stats.total_divisions, color: '#0EA5E9', to: '/admin/divisions' },
                  { icon: '📍', label: 'Districts', value: stats.total_districts, color: '#6366F1', to: '/admin/districts' },
                  { icon: '🏢', label: 'Chambers', value: stats.total_chambers, color: '#8B5CF6', to: '/admin/chambers' },
                  { icon: '📋', label: 'Prescriptions', value: stats.total_prescriptions, color: '#00A88C', to: '/admin/prescriptions' },
                ].map(s => {
                  const card = (
                    <div key={s.label} style={{
                      padding: '18px 14px', borderRadius: 14,
                      background: 'var(--admin-bg)', border: `1px solid var(--admin-border)`,
                      textAlign: 'center', cursor: s.to ? 'pointer' : 'default',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{s.icon}</div>
                      <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: 'var(--admin-text)' }}>
                        <AnimatedNumber value={s.value} />
                      </p>
                      <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-muted)' }}>{s.label}</p>
                    </div>
                  )
                  return s.to ? <Link key={s.label} to={s.to} style={{ textDecoration: 'none' }}>{card}</Link> : card
                })}
              </div>
            </ChartCard>
          )}
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
