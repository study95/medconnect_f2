// AdminBillingDashboardPage.jsx — Enterprise Billing & Revenue Analytics
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getBillingDashboard } from '../../../api/billingAdminApi'
import { useAuth } from '../../../context/AuthContext'
import {
  DollarSign, TrendingUp, Users, Calendar, AlertCircle,
  CheckCircle2, RefreshCw, ArrowUpRight, ArrowDownRight,
  ShieldAlert, CreditCard, Tag, FileText, ChevronRight,
  Layers, Settings, Sparkles, ArrowRight, Clock, Activity,
  PieChart as PieIcon, ShieldCheck
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts'
import '../../../styles/admin-billing-dashboard.css'

// Custom tooltip for Recharts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const formattedDate = new Date(label).toLocaleDateString('bn-BD', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const amount = Number(payload[0].value || 0).toLocaleString()

    return (
      <div
        style={{
          background: 'var(--admin-card-bg, #ffffff)',
          border: '1px solid var(--admin-border, #e2e8f0)',
          borderRadius: '12px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
          fontSize: '12px'
        }}
      >
        <div style={{ color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>{formattedDate}</div>
        <div style={{ fontWeight: 800, fontSize: '15px', color: '#00B875' }}>
          ৳ {amount}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>অনুমোদিত আদায়</div>
      </div>
    )
  }
  return null
}

export default function AdminBillingDashboardPage() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const loadData = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      setError(null)
      const res = await getBillingDashboard()
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'বিলিং মেট্রিক্স লোড করা সম্ভব হয়নি')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (!isAdmin) {
    return (
      <div className="admin-billing-container text-center py-5">
        <ShieldAlert size={40} className="mx-auto text-danger mb-3" />
        <h4 style={{ fontWeight: 800 }}>অ্যাডমিন অ্যাক্সেস সীমাবদ্ধ</h4>
        <p className="text-muted">আর্থিক রাজস্ব ও টেলিমেট্রি দেখার জন্য আপনার অ্যাডমিন অনুমতি নেই।</p>
      </div>
    )
  }

  // ─── SKELETON LOADER ───
  if (loading) {
    return (
      <div className="admin-billing-container space-y-4">
        <div className="abd-skeleton" style={{ height: '36px', width: '380px' }} />
        <div className="abd-skeleton" style={{ height: '52px', width: '100%', borderRadius: '12px' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="abd-skeleton" style={{ height: '140px', borderRadius: '16px' }} />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="abd-skeleton" style={{ height: '90px', borderRadius: '14px' }} />
          ))}
        </div>
        <div className="abd-skeleton" style={{ height: '320px', width: '100%', borderRadius: '16px' }} />
      </div>
    )
  }

  const kpis = data?.kpis || {}
  const topPlans = data?.top_plans || []
  const trend = data?.revenue_trend || []

  // Calculate 30-day total from trend
  const totalTrendRevenue = trend.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const averageDailyRevenue = trend.length > 0 ? Math.round(totalTrendRevenue / trend.length) : 0

  // Calculate doctor vs hospital ratio
  const totalEntityRevenue = (kpis.doctor_revenue || 0) + (kpis.hospital_revenue || 0)
  const doctorPercent = totalEntityRevenue > 0 ? Math.round((kpis.doctor_revenue / totalEntityRevenue) * 100) : 60
  const hospitalPercent = 100 - doctorPercent

  return (
    <div className="admin-billing-container abd-fade-in">
      {/* ─── 1. PAGE HEADER ─── */}
      <div className="abd-header">
        <div>
          <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '12px', fontWeight: 600 }}>
            <span>অ্যাডমিন কন্ট্রোল প্যানেল</span>
            <ChevronRight size={13} />
            <span style={{ color: 'var(--admin-primary, #00B875)' }}>বিলিং ও আর্থিক ব্যবস্থাপনা</span>
          </div>
          <h1 className="abd-title">
            <DollarSign size={24} style={{ color: '#00B875' }} />
            <span>রাজস্ব ও সাবস্ক্রিপশন বিশ্লেষণ</span>
          </h1>
          <p className="abd-subtitle">
            রিয়েল-টাইম রাজস্ব বিশ্লেষণ, এমআরআর (MRR) বিবরণ, গ্রাহক স্বাস্থ্য সূচক ও অফলাইন পেমেন্ট যাচাই কিউ।
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="abd-nav-link"
            style={{ cursor: 'pointer', background: 'transparent' }}
            title="মেট্রিক্স রিফ্রেশ করুন"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'আপডেট হচ্ছে...' : 'মেট্রিক্স আপডেট করুন'}</span>
          </button>
        </div>
      </div>

      {/* ─── 2. QUICK NAVIGATION BAR ─── */}
      <div className="abd-quick-nav">
        <Link to="/admin/billing/plans" className="abd-nav-link">
          <Layers size={14} />
          <span>প্ল্যান ও টিয়ার</span>
        </Link>
        <Link to="/admin/billing/subscribers" className="abd-nav-link">
          <Users size={14} />
          <span>গ্রাহক তালিকা</span>
        </Link>
        <Link to="/admin/billing/invoices" className="abd-nav-link">
          <FileText size={14} />
          <span>ইনভয়েস</span>
        </Link>
        <Link to="/admin/billing/transactions" className="abd-nav-link">
          <CreditCard size={14} />
          <span>ম্যানুয়াল লেনদেন</span>
          {kpis.pending_offline_payments > 0 && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '9999px',
                background: '#ef4444',
                color: '#ffffff'
              }}
            >
              {kpis.pending_offline_payments}
            </span>
          )}
        </Link>
        <Link to="/admin/billing/coupons" className="abd-nav-link">
          <Tag size={14} />
          <span>কুপন</span>
        </Link>
        <Link to="/admin/billing/settings" className="abd-nav-link">
          <Settings size={14} />
          <span>বিলিং সেটিংস</span>
        </Link>
      </div>

      {/* ─── ERROR TOAST ─── */}
      {error && (
        <div className="p-3 mb-4 rounded-3 d-flex align-items-center gap-2 text-danger bg-danger bg-opacity-10 border border-danger border-opacity-25" style={{ fontSize: '13.5px' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* ─── 3. ACTION ALERT: PENDING OFFLINE PAYMENTS ─── */}
      {kpis.pending_offline_payments > 0 && (
        <div className="abd-alert-banner abd-fade-in">
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#92400e' }}>
                {kpis.pending_offline_payments}টি ম্যানুয়াল পেমেন্ট যাচাইয়ের অপেক্ষায়
              </div>
              <div style={{ fontSize: '12.5px', color: '#b45309', marginTop: '2px' }}>
                ডাক্তার ও হাসপাতাল কর্তৃপক্ষ কর্তৃক জমাকৃত অফলাইন পেমেন্ট স্লিপ অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে।
              </div>
            </div>
          </div>

          <Link
            to="/admin/billing/transactions"
            className="abd-nav-link"
            style={{
              background: '#f59e0b',
              color: '#ffffff',
              borderColor: 'transparent',
              fontWeight: 800,
              padding: '8px 18px'
            }}
          >
            <span>পেমেন্ট পর্যালোচনা করুন</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* ─── 4. CORE FINANCIAL KPIS ─── */}
      <div className="abd-kpi-grid">
        {/* MRR */}
        <div className="abd-kpi-card accent-emerald">
          <div className="abd-kpi-header">
            <span className="abd-kpi-label">মাসিক পুনরাবৃত্ত রাজস্ব (MRR)</span>
            <div className="abd-kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="abd-kpi-val">
            ৳ {Number(kpis.mrr || 0).toLocaleString()}
          </div>
          <div className="abd-kpi-meta">
            বাৎসরিক রাজস্ব হার (ARR):{' '}
            <strong style={{ color: 'var(--admin-text, #0f172a)' }}>
              ৳ {Number(kpis.arr || 0).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Revenue This Month */}
        <div className="abd-kpi-card accent-blue">
          <div className="abd-kpi-header">
            <span className="abd-kpi-label">চলতি মাসের মোট আদায়</span>
            <div className="abd-kpi-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className="abd-kpi-val">
            ৳ {Number(kpis.revenue_this_month || 0).toLocaleString()}
          </div>
          <div className="abd-kpi-meta">
            আজকের আদায়:{' '}
            <strong style={{ color: '#10b981' }}>
              +৳ {Number(kpis.revenue_today || 0).toLocaleString()}
            </strong>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="abd-kpi-card accent-purple">
          <div className="abd-kpi-header">
            <span className="abd-kpi-label">সক্রিয় সাবস্ক্রিপশন</span>
            <div className="abd-kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
              <Users size={18} />
            </div>
          </div>
          <div className="abd-kpi-val">
            {kpis.total_active_subscribers || 0}
          </div>
          <div className="abd-kpi-meta">
            গড় আয়: ৳ {Number(kpis.arpu || 0).toLocaleString()} • লাইফটাইম ভ্যালু: ৳ {Number(kpis.lifetime_value || 0).toLocaleString()}
          </div>
        </div>

        {/* Collection Rate */}
        <div className="abd-kpi-card accent-amber">
          <div className="abd-kpi-header">
            <span className="abd-kpi-label">নেট আদায় হার</span>
            <div className="abd-kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
              <ShieldCheck size={18} />
            </div>
          </div>
          <div className="abd-kpi-val">
            {kpis.collection_rate || 100}%
          </div>
          <div className="abd-kpi-meta">
            রিফান্ড হার: <strong style={{ color: '#64748b' }}>{kpis.refund_rate || 0}%</strong>
          </div>
        </div>
      </div>

      {/* ─── 5. SECONDARY OPERATIONAL METRICS ─── */}
      <div className="abd-kpi-grid" style={{ marginBottom: '28px' }}>
        <div className="abd-card" style={{ padding: '16px 20px' }}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                অপেক্ষমাণ অফলাইন যাচাই
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>
                {kpis.pending_offline_payments || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="abd-card" style={{ padding: '16px 20px' }}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(249, 115, 22, 0.1)',
                color: '#f97316',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Calendar size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                মেয়াদোত্তীর্ণ হবে (৭ দিনে)
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>
                {kpis.expiring_soon || 0}
              </div>
            </div>
          </div>
        </div>

        <div className="abd-card" style={{ padding: '16px 20px' }}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(20, 184, 166, 0.1)',
                color: '#14b8a6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                ট্রায়াল কনভার্সন হার
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>
                {kpis.trial_conversion_rate || 0}%
              </div>
            </div>
          </div>
        </div>

        <div className="abd-card" style={{ padding: '16px 20px' }}>
          <div className="d-flex align-items-center gap-3">
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(168, 85, 247, 0.1)',
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Tag size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
                ব্যবহৃত কুপন
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800 }}>
                {kpis.total_coupons_used || 0}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. INTERACTIVE REVENUE AREA CHART & ENTITY BREAKDOWN ─── */}
      <div className="abd-panels-grid">
        {/* 30-Day Revenue Trend Chart */}
        <div className="abd-card">
          <div className="abd-card-header">
            <div>
              <h2 className="abd-card-title">গত ৩০ দিনের আদায় চিত্র</h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                গত ৩০ দিনের মোট অনুমোদিত রাজস্ব:{' '}
                <strong style={{ color: '#00B875' }}>৳ {totalTrendRevenue.toLocaleString()}</strong> • দৈনিক গড়:{' '}
                <strong>৳ {averageDailyRevenue.toLocaleString()}</strong>
              </div>
            </div>
          </div>

          <div style={{ width: '100%', height: 280, marginTop: 12 }}>
            {trend.length === 0 ? (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted" style={{ fontSize: '13px' }}>
                গত ৩০ দিনে কোনো লেনদেনের তথ্য পাওয়া যায়নি।
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00B875" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00B875" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(str) => {
                      const d = new Date(str)
                      return `${d.getDate()} ${d.toLocaleString('bn-BD', { month: 'short' })}`
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    tickFormatter={(val) => `৳${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#00B875"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Entity Revenue Split Card */}
        <div className="abd-card d-flex flex-column justify-content-between">
          <div>
            <div className="abd-card-header">
              <h2 className="abd-card-title">গ্রাহকভিত্তিক রাজস্ব বিভাজন</h2>
            </div>

            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 20px 0' }}>
              স্বতন্ত্র ডাক্তার ও প্রাতিষ্ঠানিক হাসপাতালের মধ্যে অনুমোদিত সাবস্ক্রিপশন আদায়ের অনুপাত।
            </p>

            <div className="space-y-4">
              {/* Doctor Split */}
              <div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>ডাক্তার প্র্যাকটিস</span>
                  <span style={{ fontWeight: 800 }}>৳ {Number(kpis.doctor_revenue || 0).toLocaleString()} ({doctorPercent}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${doctorPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                      borderRadius: '9999px'
                    }}
                  />
                </div>
              </div>

              {/* Hospital Split */}
              <div>
                <div className="d-flex justify-content-between mb-1" style={{ fontSize: '13px' }}>
                  <span style={{ fontWeight: 600 }}>প্রাতিষ্ঠানিক হাসপাতাল</span>
                  <span style={{ fontWeight: 800 }}>৳ {Number(kpis.hospital_revenue || 0).toLocaleString()} ({hospitalPercent}%)</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${hospitalPercent}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #00B875, #34d399)',
                      borderRadius: '9999px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(0, 184, 117, 0.05)',
              border: '1px solid rgba(0, 184, 117, 0.15)',
              marginTop: '20px'
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#00B875' }}>
              সর্বমোট রাজস্ব আদায়
            </div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--admin-text, #0f172a)', marginTop: '2px' }}>
              ৳ {totalEntityRevenue.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* ─── 7. TOP SELLING PLANS & RECENT REVENUE TABLE ─── */}
      <div className="abd-panels-grid">
        {/* Top Plans Leaderboard */}
        <div className="abd-card">
          <div className="abd-card-header">
            <h2 className="abd-card-title">সর্বাধিক বিক্রিত সাবস্ক্রিপশন প্ল্যান</h2>
            <Link to="/admin/billing/plans" style={{ fontSize: '12.5px', color: '#00B875', textDecoration: 'none', fontWeight: 700 }}>
              সকল প্ল্যান পরিচালনা করুন →
            </Link>
          </div>

          <div>
            {topPlans.length === 0 ? (
              <div className="py-5 text-center text-muted" style={{ fontSize: '13px' }}>
                এখনও কোনো সক্রিয় প্ল্যান সাবস্ক্রিপশন পাওয়া যায়নি।
              </div>
            ) : (
              topPlans.map((plan, index) => (
                <div key={plan.id} className="abd-plan-row">
                  <div className="d-flex align-items-center gap-3">
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: index === 0 ? '#fef3c7' : '#f1f5f9',
                        color: index === 0 ? '#b45309' : '#64748b',
                        fontSize: '11px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      #{index + 1}
                    </span>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13.5px' }}>{plan.name}</div>
                      <div className="d-flex align-items-center gap-2 mt-1">
                        <span
                          style={{
                            fontSize: '10.5px',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            padding: '2px 7px',
                            borderRadius: '5px',
                            background: 'rgba(148, 163, 184, 0.15)',
                            color: '#475569'
                          }}
                        >
                          {plan.tier}
                        </span>
                        <span className="text-muted" style={{ fontSize: '11px' }}>
                          ৳ {Number(plan.price || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-end">
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{plan.subscriptions_count || 0}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>গ্রাহক</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Daily Collections */}
        <div className="abd-card">
          <div className="abd-card-header">
            <h2 className="abd-card-title">সাম্প্রতিক দৈনিক আদায়</h2>
            <Link to="/admin/billing/invoices" style={{ fontSize: '12.5px', color: '#00B875', textDecoration: 'none', fontWeight: 700 }}>
              সকল ইনভয়েস →
            </Link>
          </div>

          <div className="table-responsive">
            <table className="abd-table">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th style={{ textAlign: 'right' }}>আদায়কৃত অর্থ</th>
                </tr>
              </thead>
              <tbody>
                {trend.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-muted">
                      সাম্প্রতিক কোনো আদায় নেই।
                    </td>
                  </tr>
                ) : (
                  trend.slice(-7).reverse().map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>
                        {new Date(item.date).toLocaleDateString('bn-BD', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#00B875' }}>
                        ৳ {Number(item.total).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
