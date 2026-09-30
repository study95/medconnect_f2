// DashboardPage.jsx — Enterprise Executive Health System Command Center
// Inspired by Google Cloud Console & Stripe Dashboard Architecture: High-Density, Zero-Clutter, Action-Oriented
import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { getDashboardStats, getDashboardAnalytics } from '../../api/adminApi'
import { queryKeys } from '../../lib/queryKeys'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  DollarSign, Calendar, Stethoscope, Users, Building2,
  CheckCircle2, AlertCircle, ArrowUpRight, RefreshCw, ShieldCheck,
  ChevronRight, Clock, FileText, ArrowRight, Activity, ShieldAlert,
  MessageSquare
} from 'lucide-react'

const RANGE_OPTIONS = [
  { key: 'day', label: '30D' },
  { key: 'week', label: '12W' },
  { key: 'month', label: '12M' },
]

// Professional clean tooltip
function MetricTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--admin-card-bg)',
      padding: '10px 14px', borderRadius: 8,
      border: '1px solid var(--admin-border)',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      fontSize: 12,
      fontFamily: 'inherit'
    }}>
      <div style={{ fontWeight: 600, color: 'var(--admin-text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, margin: '3px 0' }}>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.name}:</span>
          <span style={{ fontWeight: 800, color: 'var(--admin-text)', fontVariantNumeric: 'tabular-nums' }}>
            {p.dataKey === 'Revenue' ? `৳${Number(p.value).toLocaleString()}` : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  )
}

// Executive KPI Metric Card (Stripe-Style)
function ExecutiveMetricCard({ title, value, subtext, icon: Icon, badge, trendPositive, to }) {
  const card = (
    <div style={{
      background: 'var(--admin-card-bg)',
      border: '1px solid var(--admin-border)',
      borderRadius: 14,
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      transition: 'all 0.2s ease',
      cursor: to ? 'pointer' : 'default',
      position: 'relative'
    }}
    onMouseEnter={e => { if (to) e.currentTarget.style.borderColor = 'var(--admin-primary)' }}
    onMouseLeave={e => { if (to) e.currentTarget.style.borderColor = 'var(--admin-border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--admin-text-muted)', letterSpacing: '0.2px' }}>
          {title}
        </span>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: 'var(--admin-bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--admin-text-muted)'
        }}>
          <Icon size={16} />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <div style={{
          fontSize: 26, fontWeight: 800, color: 'var(--admin-text)',
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.5px', lineHeight: 1.1
        }}>
          {value}
        </div>
        {badge && (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 6,
            background: trendPositive ? 'rgba(0, 184, 117, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            color: trendPositive ? '#00B875' : '#D97706',
            fontVariantNumeric: 'tabular-nums'
          }}>
            {badge}
          </span>
        )}
      </div>

      <div style={{
        marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--admin-border)',
        fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <span>{subtext}</span>
        {to && <ArrowUpRight size={13} color="var(--admin-text-muted)" />}
      </div>
    </div>
  )

  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{card}</Link> : card
}

export default function DashboardPage() {
  const { isAdmin, isDoctor, isManager, user } = useAuth()
  const [range, setRange] = useState('month')
  const [inboundTab, setInboundTab] = useState('doctors') // 'doctors' | 'hospitals' | 'tickets' | 'reports'

  const { data: stats = null, isLoading: loading, refetch: refetchStats } = useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      try {
        const res = await getDashboardStats()
        return res.data?.data || null
      } catch (err) {
        console.error('Stats fetch error:', err)
        return null
      }
    },
    staleTime: 60 * 1000,
  })

  const { data: analytics = null, isLoading: analyticsLoading } = useQuery({
    queryKey: queryKeys.dashboard.analytics({ range }),
    queryFn: async () => {
      try {
        const res = await getDashboardAnalytics({ range })
        return res.data?.data || null
      } catch (err) {
        console.error('Analytics fetch error:', err)
        return null
      }
    },
    staleTime: 60 * 1000,
  })

  // Format label for chart timeline
  const formatLabel = (period) => {
    if (!period) return ''
    if (range === 'day') {
      const d = new Date(period)
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    if (range === 'week') return String(period).replace(/^\d{4}-/, '')
    if (range === 'month') {
      const parts = String(period).split('-')
      if (parts.length >= 2) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        return `${months[parseInt(parts[1])-1] || ''} '${parts[0]?.slice(2) || ''}`
      }
    }
    return period
  }

  // Combined chart dataset
  const combinedTrendData = useMemo(() => {
    const appts = analytics?.appointments?.trend || []
    const payments = analytics?.payments?.paid || []

    return appts.map((item, idx) => ({
      name: formatLabel(item.period),
      Appointments: item.value || 0,
      Revenue: payments[idx]?.value || 0,
      Completed: analytics?.appointments?.by_status?.completed?.find(x => x.period === item.period)?.value || 0,
    }))
  }, [analytics, range])

  // Action desk critical items
  const actionItems = useMemo(() => {
    const list = []
    if (stats?.action_required?.inactive_doctors > 0) {
      list.push({
        id: 'doc',
        title: 'ডাক্তার প্রোফাইল যাচাইকরণ',
        description: `${stats.action_required.inactive_doctors} জন নতুন ডাক্তারের তথ্য ও BMDC সনদ যাচাই বাকি`,
        linkText: 'যাচাই করুন',
        to: '/admin/doctors?is_active=0',
        severity: 'amber'
      })
    }
    if (stats?.action_required?.inactive_hospitals > 0) {
      list.push({
        id: 'hosp',
        title: 'হাসপাতাল সক্রিয়করণ',
        description: `${stats.action_required.inactive_hospitals} টি হাসপাতালের অনবোর্ডিং অনুমোদন অপেক্ষমান`,
        linkText: 'অনুমোদন দিন',
        to: '/admin/hospitals?is_active=0',
        severity: 'amber'
      })
    }
    if (stats?.action_required?.pending_reports > 0) {
      list.push({
        id: 'rep',
        title: 'রিভিউ বিরোধ ও মডারেশন',
        description: `${stats.action_required.pending_reports} টি বিতর্কিত রোগীর রিভিউ রিপোর্টের সিদ্ধান্ত প্রয়োজন`,
        linkText: 'রিভিউ দেখুন',
        to: '/admin/reviews/reports',
        severity: 'red'
      })
    }
    if (stats?.action_required?.pending_commissions > 0) {
      list.push({
        id: 'comm',
        title: 'কমিশন সেটেলমেন্ট',
        description: `${stats.action_required.pending_commissions} টি অ্যাপয়েন্টমেন্টের কমিশন বকেয়া নিষ্পত্তি প্রয়োজন`,
        linkText: 'নিষ্পত্তি করুন',
        to: '/admin/reports/commission?commission_status=pending',
        severity: 'blue'
      })
    }
    return list
  }, [stats])

  // Success rate computation
  const successRate = useMemo(() => {
    if (!stats?.total_appointments) return 100
    return Math.round(((stats.completed_appointments || 0) / stats.total_appointments) * 100)
  }, [stats])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
        <div className="admin-spinner" style={{ marginRight: 10 }} />
        <span style={{ color: 'var(--admin-text-muted)', fontSize: 13, fontWeight: 500 }}>
          লোড হচ্ছে এক্সিকিউটিভ ড্যাশবোর্ড...
        </span>
      </div>
    )
  }

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1400, margin: '0 auto' }}>
      {/* 1. EXECUTIVE HEADER BAR */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 16, marginBottom: 20, paddingBottom: 16,
        borderBottom: '1px solid var(--admin-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{
                margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--admin-text)',
                letterSpacing: '-0.3px', lineHeight: 1.2
              }}>
                {isDoctor ? `Dr. ${user?.name} · Clinical Overview` : isManager ? 'Hospital Operations Portal' : 'Executive Overview'}
              </h1>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '3px 8px', borderRadius: 20,
                background: 'rgba(0, 184, 117, 0.08)',
                border: '1px solid rgba(0, 184, 117, 0.2)',
                fontSize: 11, fontWeight: 700, color: '#00B875'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00B875' }} />
                <span>Live System</span>
              </div>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--admin-text-muted)', fontWeight: 500 }}>
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} · প্ল্যাটফর্ম সেন্ট্রাল কমান্ড ও রিয়েল-টাইম অপারেশন মনিটর
            </p>
            {isAdmin && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, marginTop: 5,
                fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 600, flexWrap: 'wrap'
              }}>
                <span style={{ color: 'var(--admin-primary)' }}>নেটওয়ার্ক বিস্তার:</span>
                <span style={{ color: 'var(--admin-text)' }}>{stats?.total_divisions || 0} বিভাগ</span> · 
                <span style={{ color: 'var(--admin-text)' }}>{stats?.total_districts || 0} জেলা</span> · 
                <span style={{ color: 'var(--admin-text)' }}>{stats?.total_upazilas || 0} উপজেলা</span> · 
                <span style={{ color: 'var(--admin-text)' }}>{stats?.total_unions || 0} ইউনিয়ন</span> · 
                <span style={{ color: 'var(--admin-text)' }}>{stats?.total_specialties || 0} স্পেশালিটি</span>
              </div>
            )}
          </div>
        </div>

        {/* Minimal Time-Horizon Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', padding: 2, background: 'var(--admin-bg)',
            borderRadius: 8, border: '1px solid var(--admin-border)'
          }}>
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setRange(opt.key)}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: 'none',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: '0.15s ease',
                  background: range === opt.key ? 'var(--admin-card-bg)' : 'transparent',
                  color: range === opt.key ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                  boxShadow: range === opt.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => refetchStats()}
            title="রিফ্রেশ"
            style={{
              width: 32, height: 32, borderRadius: 8,
              border: '1px solid var(--admin-border)',
              background: 'var(--admin-card-bg)', color: 'var(--admin-text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: '0.15s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--admin-text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--admin-text-muted)'}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. THE 4 NORTH STAR METRICS (STRIPE-STYLE) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 14, marginBottom: 20
      }}>
        {isAdmin && (
          <>
            <ExecutiveMetricCard
              title="নিবন্ধিত ডাক্তার (Total Doctors)"
              value={`${Number(stats?.total_doctors || 0).toLocaleString()} জন`}
              subtext={`সক্রিয়: ${Math.max(0, (stats?.total_doctors || 0) - (stats?.action_required?.inactive_doctors || 0))} জন · ${stats?.action_required?.inactive_doctors || 0} জন অপেক্ষমান`}
              icon={Stethoscope}
              badge={`+${stats?.today?.new_doctors || 0} আজ`}
              trendPositive={Boolean(stats?.today?.new_doctors)}
              to="/admin/doctors"
            />
            <ExecutiveMetricCard
              title="হাসপাতাল ও ক্লিনিক (Hospitals)"
              value={`${Number(stats?.total_hospitals || 0).toLocaleString()} টি`}
              subtext={`সক্রিয়: ${Math.max(0, (stats?.total_hospitals || 0) - (stats?.action_required?.inactive_hospitals || 0))} টি · ${stats?.action_required?.inactive_hospitals || 0} টি অপেক্ষমান`}
              icon={Building2}
              badge={`+${stats?.today?.new_hospitals || 0} আজ`}
              trendPositive={Boolean(stats?.today?.new_hospitals)}
              to="/admin/hospitals"
            />
            <ExecutiveMetricCard
              title="অ্যাপয়েন্টমেন্ট থ্রুপুট (Bookings)"
              value={`${Number(stats?.total_appointments || 0).toLocaleString()} টি`}
              subtext={`সম্পন্ন: ${stats?.completed_appointments || 0} · কনফার্মড: ${stats?.confirmed_appointments || 0} · পেন্ডিং: ${stats?.pending_appointments || 0} · বাতিল: ${stats?.cancelled_appointments || 0}`}
              icon={Calendar}
              badge={`${stats?.today?.appointments_total || 0} টি আজ`}
              trendPositive={Boolean(stats?.today?.appointments_total)}
              to="/admin/appointments"
            />
            <ExecutiveMetricCard
              title="রোগী ও ব্যবহারকারী (Users & Patients)"
              value={`${Number(stats?.total_users || 0).toLocaleString()} জন`}
              subtext={`${stats?.total_prescriptions || 0} টি ডিজিটাল প্রেসক্রিপশন সংরক্ষিত`}
              icon={Users}
              badge={`+${stats?.today?.new_patients || 0} আজ`}
              trendPositive={Boolean(stats?.today?.new_patients)}
              to="/admin/patients"
            />
          </>
        )}

        {isDoctor && (
          <>
            <ExecutiveMetricCard
              title="আমার অর্জিত ফি"
              value={`৳${Number(stats?.total_payments_collected || 0).toLocaleString()}`}
              subtext="মোট সংগৃহীত পরামর্শ ফি"
              icon={DollarSign}
              to="/doctor/payments"
            />
            <ExecutiveMetricCard
              title="মোট রোগী ও বুকিং"
              value={Number(stats?.total_appointments || 0).toLocaleString()}
              subtext={`সম্পন্ন: ${stats?.completed_appointments || 0} · পেন্ডিং: ${stats?.pending_appointments || 0}`}
              icon={Calendar}
              to="/doctor/appointments"
            />
            <ExecutiveMetricCard
              title="সক্রিয় চেম্বার"
              value={`${stats?.total_chambers || 0} টি`}
              subtext="রোগী দেখার নির্ধারিত চেম্বার"
              icon={Building2}
              to="/doctor/chambers"
            />
            <ExecutiveMetricCard
              title="ডিজিটাল প্রেসক্রিপশন"
              value={`${stats?.total_prescriptions || 0} টি`}
              subtext="তৈরিকৃত চিকিৎসা পরামর্শপত্র"
              icon={FileText}
              to="/doctor/prescriptions"
            />
          </>
        )}

        {isManager && (
          <>
            <ExecutiveMetricCard
              title="হাসপাতাল বুকিং"
              value={Number(stats?.total_appointments || 0).toLocaleString()}
              subtext={`পেন্ডিং: ${stats?.pending_appointments || 0}`}
              icon={Calendar}
              to="/hospital/appointments"
            />
            <ExecutiveMetricCard
              title="হাসপাতালের ডাক্তার"
              value={`${stats?.total_doctors || 0} জন`}
              subtext="তালিকাভুক্ত বিশেষজ্ঞ চিকিৎসক"
              icon={Stethoscope}
              to="/hospital/doctors"
            />
            <ExecutiveMetricCard
              title="সক্রিয় চেম্বার ও বিভাগ"
              value={`${stats?.total_chambers || 0} টি`}
              subtext="কার্যক্রম চলমান চেম্বার"
              icon={Building2}
              to="/hospital/chambers"
            />
            <ExecutiveMetricCard
              title="হাসপাতাল প্রোফাইল"
              value="অ্যাক্টিভ"
              subtext="হাসপাতালের বিবরণ ও সেবা"
              icon={Activity}
              to="/hospital/my-hospital"
            />
          </>
        )}
      </div>

      {/* 3. DUAL GRID: UNIFIED ANALYTICAL TREND (60%) + ACTION DESK (40%) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isAdmin ? '1.5fr 1fr' : '1fr',
        gap: 16, marginBottom: 20
      }}>
        {/* Left: Primary Operational Trend Chart */}
        <div style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 14,
          padding: '20px',
          display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>
                অ্যাপয়েন্টমেন্ট ভলিউম ও সেবা সমাপ্তির ট্রেন্ড
              </div>
              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', fontWeight: 500, marginTop: 2 }}>
                নির্বাচিত সময়কালের বুকিং চাহিদা ও সম্পন্ন সেবার বিশ্লেষণ
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00B875' }} />
                <span style={{ color: 'var(--admin-text)' }}>মোট বুকিং</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                <span style={{ color: 'var(--admin-text-muted)' }}>সম্পন্ন সেবা</span>
              </div>
            </div>
          </div>

          <div style={{ height: 260, width: '100%' }}>
            {analyticsLoading ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>
                লোড হচ্ছে ট্রেন্ড ডেটা...
              </div>
            ) : combinedTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B875" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#00B875" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--admin-border)" vertical={false} opacity={0.6} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--admin-text-muted)' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<MetricTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="Appointments"
                    name="মোট বুকিং"
                    stroke="#00B875"
                    strokeWidth={2}
                    fill="url(#primaryAreaGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Completed"
                    name="সম্পন্ন সেবা"
                    stroke="#10B981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>
                কোনো ট্রেন্ড রেকর্ড নেই
              </div>
            )}
          </div>
        </div>

        {/* Right: Inbound Requests & Approvals Pipeline (Admin Only) */}
        {isAdmin && (() => {
          const inbound = stats?.inbound_requests || {
            counts: { doctors: 0, hospitals: 0, tickets: 0, reports: 0, total: 0 },
            doctors: [],
            hospitals: [],
            tickets: [],
            reports: []
          }

          const inboundTabs = [
            { key: 'doctors', label: 'ডাক্তার', count: inbound.counts?.doctors || 0, viewAll: '/admin/doctors?is_active=0' },
            { key: 'hospitals', label: 'হাসপাতাল', count: inbound.counts?.hospitals || 0, viewAll: '/admin/hospitals?is_active=0' },
            { key: 'tickets', label: 'সাপোর্ট টিকিট', count: inbound.counts?.tickets || 0, viewAll: '/admin/services' },
            { key: 'reports', label: 'রিভিউ বিরোধ', count: inbound.counts?.reports || 0, viewAll: '/admin/reviews/reports' },
          ]

          const activeInboundList = inbound[inboundTab] || []

          return (
            <div style={{
              background: 'var(--admin-card-bg)',
              border: '1px solid var(--admin-border)',
              borderRadius: 14,
              padding: '18px 20px',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>
                    আগত আবেদন ও টিকিট কিউ
                  </span>
                  {inbound.counts?.total > 0 ? (
                    <span style={{
                      fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                      background: '#EF4444', color: '#FFFFFF'
                    }}>
                      {inbound.counts.total}টি অপেক্ষমান
                    </span>
                  ) : (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                      background: 'rgba(0, 184, 117, 0.1)', color: '#00B875'
                    }}>
                      সব সম্পন্ন ✓
                    </span>
                  )}
                </div>
                <Link
                  to={inboundTabs.find(t => t.key === inboundTab)?.viewAll || '/admin'}
                  style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-primary)', textDecoration: 'none' }}
                >
                  সবগুলো দেখুন →
                </Link>
              </div>

              {/* Pipeline Category Sub-tabs */}
              <div style={{
                display: 'flex', gap: 4, background: 'var(--admin-bg)', padding: 3,
                borderRadius: 8, border: '1px solid var(--admin-border)', marginBottom: 12
              }}>
                {inboundTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setInboundTab(tab.key)}
                    style={{
                      flex: 1, border: 'none', padding: '6px 4px', borderRadius: 6,
                      fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: '0.15s',
                      background: inboundTab === tab.key ? 'var(--admin-card-bg)' : 'transparent',
                      color: inboundTab === tab.key ? 'var(--admin-text)' : 'var(--admin-text-muted)',
                      boxShadow: inboundTab === tab.key ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                    }}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 8,
                        background: inboundTab === tab.key ? '#EF4444' : 'rgba(239, 68, 68, 0.2)',
                        color: inboundTab === tab.key ? '#FFFFFF' : '#EF4444'
                      }}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Request Items List */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeInboundList.length > 0 ? (
                  activeInboundList.map(item => (
                    <div key={item.id} style={{
                      padding: '10px 12px', borderRadius: 8,
                      background: 'var(--admin-bg)',
                      border: '1px solid var(--admin-border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      gap: 10
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{
                          fontSize: 12, fontWeight: 700, color: 'var(--admin-text)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {item.title}
                        </div>
                        <div style={{
                          fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {item.subtitle} · <span style={{ color: 'var(--admin-text-muted)' }}>{item.time}</span>
                        </div>
                      </div>
                      <Link
                        to={item.action_url}
                        style={{
                          padding: '5px 10px', borderRadius: 6,
                          background: 'var(--admin-card-bg)',
                          border: '1px solid var(--admin-border)',
                          color: 'var(--admin-text)', textDecoration: 'none',
                          fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 3,
                          transition: '0.15s'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--admin-primary)'; e.currentTarget.style.color = 'var(--admin-primary)' }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text)' }}
                      >
                        <span>{inboundTab === 'tickets' ? 'সমাধান' : inboundTab === 'reports' ? 'মডারেশন' : 'যাচাই'}</span>
                        <ChevronRight size={11} />
                      </Link>
                    </div>
                  ))
                ) : (
                  <div style={{
                    height: '100%', minHeight: 180,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    padding: 16, textAlign: 'center',
                    background: 'var(--admin-bg)', borderRadius: 8, border: '1px dashed var(--admin-border)'
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'rgba(0, 184, 117, 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
                      color: '#00B875'
                    }}>
                      <ShieldCheck size={20} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
                      ইনবক্স একদম ক্লিয়ার
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>
                      এই ক্যাটাগরিতে কোনো পেন্ডিং আবেদন বা টিকিট নেই।
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}
      </div>

      {/* 4. LIVE TRANSACTION & RECENT ACTIVITY LEDGER (STRIPE-STYLE TABLE) */}
      {isAdmin && (
        <div style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 14,
          overflow: 'hidden',
          marginBottom: 20
        }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--admin-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'var(--admin-card-bg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text)' }}>
                রিয়েল-টাইম অপারেশন লেজার (Live Bookings Ledger)
              </span>
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                background: 'var(--admin-bg)', color: 'var(--admin-text-muted)',
                border: '1px solid var(--admin-border)'
              }}>
                সর্বশেষ ৬টি লেনদেন
              </span>
            </div>
            <Link
              to="/admin/appointments"
              style={{
                fontSize: 12, fontWeight: 700, color: 'var(--admin-primary)',
                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <span>সকল অ্যাপয়েন্টমেন্ট</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--admin-bg)', borderBottom: '1px solid var(--admin-border)' }}>
                  <th style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>রোগী</th>
                  <th style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>চিকিৎসক ও প্রতিষ্ঠান</th>
                  <th style={{ padding: '10px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>পরামর্শ ফি</th>
                  <th style={{ padding: '10px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>পেমেন্ট</th>
                  <th style={{ padding: '10px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>স্ট্যাটাস</th>
                  <th style={{ padding: '10px 18px', textAlign: 'right', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>সময়কাল</th>
                  <th style={{ padding: '10px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--admin-text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.4px' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recent_activities && stats.recent_activities.length > 0 ? (
                  stats.recent_activities.map((act) => (
                    <tr
                      key={act.id}
                      style={{
                        borderBottom: '1px solid var(--admin-border)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-bg)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--admin-text)' }}>
                        {act.patient_name}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--admin-text)' }}>{act.doctor_name}</div>
                        {act.hospital_name && (
                          <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>{act.hospital_name}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 800, color: 'var(--admin-text)', fontVariantNumeric: 'tabular-nums' }}>
                        ৳{act.amount}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                          background: act.payment_status === 'Paid' ? 'rgba(0, 184, 117, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                          color: act.payment_status === 'Paid' ? '#00B875' : '#D97706',
                          textTransform: 'uppercase'
                        }}>
                          {act.payment_status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: 'var(--admin-bg)', color: 'var(--admin-text)', border: '1px solid var(--admin-border)',
                          textTransform: 'capitalize'
                        }}>
                          {act.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'right', fontSize: 12, color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {act.time}
                      </td>
                      <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                        <Link
                          to={`/admin/appointments/view/${act.id}`}
                          style={{
                            fontSize: 11, fontWeight: 700, color: 'var(--admin-primary)',
                            textDecoration: 'none', padding: '4px 8px', borderRadius: 4
                          }}
                        >
                          দেখুন
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: 32, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 12 }}>
                      কোনো সাম্প্রতিক ট্রানজ্যাকশন নেই
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TOP PERFORMING SPECIALTIES & HEALTHCARE FOOTPRINT (COMPACT 2-COLUMN BOTTOM) */}
      {isAdmin && stats?.top_specialties && stats.top_specialties.length > 0 && (
        <div style={{
          background: 'var(--admin-card-bg)',
          border: '1px solid var(--admin-border)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 20
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text)' }}>
              জনপ্রিয় স্পেশালিটি ও ডাক্তার কভারেজ (Specialty Coverage)
            </span>
            <Link to="/admin/specialties" style={{ fontSize: 11, fontWeight: 700, color: 'var(--admin-primary)', textDecoration: 'none' }}>
              সকল স্পেশালিটি দেখুন →
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
            {stats.top_specialties.map((spec, i) => (
              <div key={spec.id} style={{
                background: 'var(--admin-bg)',
                border: '1px solid var(--admin-border)',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)' }}>{spec.name}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--admin-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {spec.doctors_count} জন
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  )
}
