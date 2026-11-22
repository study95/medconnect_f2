import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  FileText, 
  Loader2,
  AlertCircle,
  ChevronRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import agentApi from '../../api/agentApi'
import { useAuth } from '../../context/AuthContext'
import PayoutRequestModal from '../../features/agent/components/PayoutRequestModal'

export default function AgentWalletPage() {
  const { user, isAdmin, isSuperAdmin } = useAuth()
  const isAgentSuspended = !isAdmin && !isSuperAdmin && (user?.agent?.status === 'suspended' || user?.agent?.status === 'inactive')
  const [loading, setLoading] = useState(true)
  const [statementData, setStatementData] = useState(null)
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)

  const fetchStatement = async () => {
    setLoading(true)
    try {
      const res = await agentApi.getWalletStatement()
      setStatementData(res.data)
    } catch (err) {
      console.error('Failed to load wallet statement:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatement()
  }, [])

  const summary = statementData?.summary || {
    settled_balance: 0.0,
    pending_payouts: 0.0,
    available_balance: 0.0,
    total_withdrawn: 0.0,
    lifetime_earnings: 0.0,
    currency: 'BDT',
  }

  const entries = statementData?.entries || []

  // Dynamic total lifetime earnings (total accrued partner commission)
  const totalLifetimeEarned = summary.lifetime_earnings !== undefined
    ? Number(summary.lifetime_earnings || 0)
    : (summary.total_earned !== undefined
      ? Number(summary.total_earned || 0)
      : (entries.length > 0
        ? entries.filter(e => e.direction === 'credit').reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
        : Number(summary.settled_balance || 0)))

  // Dynamic total withdrawn (settled debits sent to bank/bKash)
  const totalWithdrawn = summary.total_withdrawn !== undefined
    ? Number(summary.total_withdrawn || 0)
    : (entries.length > 0
      ? entries.filter(e => e.direction === 'debit').reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
      : 0)

  return (
    <div style={{ minHeight: '100%', background: '#F8FAFC' }}>
      <style>{`
        .wallet-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 20px 48px;
        }
        .wallet-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .wallet-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .wallet-header-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00B875 0%, #0284c7 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(0, 184, 117, 0.3);
          flex-shrink: 0;
        }
        .wallet-header-title {
          font-size: 24px;
          font-weight: 900;
          color: #0F172A;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .wallet-header-sub {
          font-size: 13px;
          color: #64748B;
          margin: 3px 0 0;
        }
        .wallet-header-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .wallet-refresh-btn {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          border: 1.5px solid #CBD5E1;
          background: #FFFFFF;
          color: #475569;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .wallet-payout-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 20px;
          border-radius: 10px;
          font-size: 13.5px;
          font-weight: 800;
          border: none;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wallet-kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }
        .wallet-kpi-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 22px 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .wallet-kpi-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .wallet-kpi-amount {
          font-size: 28px;
          font-weight: 900;
          color: #0F172A;
          letter-spacing: -0.03em;
        }
        .wallet-kpi-desc {
          font-size: 12px;
          color: #64748B;
          margin: 4px 0 0;
        }
        .wallet-ledger-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .wallet-ledger-header {
          padding: 18px 24px;
          border-bottom: 1px solid #E2E8F0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .wallet-desktop-table {
          display: block;
        }
        .wallet-mobile-cards {
          display: none;
        }
        .wallet-mobile-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 13px 14px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.03);
          transition: border-color 0.15s ease;
        }

        @media (max-width: 768px) {
          .wallet-container {
            padding: 14px 12px calc(80px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .wallet-header {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .wallet-header-icon {
            width: 40px !important;
            height: 40px !important;
            border-radius: 11px !important;
          }
          .wallet-header-icon svg {
            width: 20px !important;
            height: 20px !important;
          }
          .wallet-header-title {
            font-size: 18px !important;
          }
          .wallet-header-sub {
            font-size: 12px !important;
          }
          .wallet-header-actions {
            width: 100% !important;
            display: grid !important;
            grid-template-columns: 1fr 44px !important;
            gap: 8px !important;
          }
          .wallet-payout-btn {
            width: 100% !important;
            padding: 11px 16px !important;
            font-size: 13px !important;
            order: 1 !important;
          }
          .wallet-refresh-btn {
            width: 44px !important;
            height: 44px !important;
            order: 2 !important;
          }
          .wallet-kpi-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            margin-bottom: 16px !important;
          }
          .wallet-kpi-card {
            border-radius: 14px !important;
            padding: 12px 14px !important;
            min-height: 98px !important;
          }
          .wallet-kpi-top {
            margin-bottom: 6px !important;
          }
          .wallet-kpi-icon-wrap {
            width: 28px !important;
            height: 28px !important;
            border-radius: 8px !important;
          }
          .wallet-kpi-icon-wrap svg {
            width: 14px !important;
            height: 14px !important;
          }
          .wallet-kpi-title {
            font-size: 10.5px !important;
            line-height: 1.2 !important;
          }
          .wallet-kpi-amount {
            font-size: 17px !important;
            letter-spacing: -0.02em !important;
            line-height: 1.2 !important;
          }
          .wallet-kpi-desc {
            display: none !important;
          }
          .wallet-ledger-card {
            border-radius: 16px !important;
          }
          .wallet-ledger-header {
            padding: 12px 14px !important;
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .wallet-ledger-title {
            font-size: 14px !important;
          }
          .wallet-ledger-subtitle {
            font-size: 11px !important;
            line-height: 1.3 !important;
          }
          .wallet-badge-protected {
            font-size: 10px !important;
            padding: 2px 7px !important;
          }
          .wallet-desktop-table {
            display: none !important;
          }
          .wallet-mobile-cards {
            display: flex !important;
            flex-direction: column !important;
            gap: 10px !important;
            padding: 10px 10px 14px !important;
          }
        }
      `}</style>

      <div className="wallet-container">
        {/* Breadcrumb HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>Finance</span>
          <ChevronRight size={13} />
          <span style={{ color: '#00B875', fontWeight: 700 }}>Commission Wallet</span>
        </div>

        {/* Page Header */}
        <div className="wallet-header">
          <div className="wallet-header-left">
            <div className="wallet-header-icon">
              <Wallet size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 className="wallet-header-title">
                  এজেন্ট কমিশন ওয়ালেট
                </h1>
                <span style={{
                  fontSize: 11,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#475569',
                  background: '#F1F5F9',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #E2E8F0'
                }}>
                  {summary.account_number || 'ACC-AGT'}
                </span>
              </div>
              <p className="wallet-header-sub">
                অনবোর্ডিং রিওয়ার্ড পরিচালনা, ব্যাংক/বিকাশ পেআউট অনুরোধ এবং অডিট লেজার ট্র্যাক করুন।
              </p>
            </div>
          </div>

          <div className="wallet-header-actions">
            <button
              onClick={() => {
                if (isAgentSuspended) {
                  toast.error('অ্যাকাউন্ট স্থগিত (Suspended) থাকায় পেআউট রিকোয়েস্ট গ্রহণ করা সম্ভব নয়।')
                  return
                }
                setPayoutModalOpen(true)
              }}
              disabled={summary.available_balance < 500 || isAgentSuspended}
              title={isAgentSuspended ? 'অ্যাকাউন্ট স্থগিত থাকায় পেআউট বন্ধ রয়েছে' : ''}
              className="wallet-payout-btn"
              style={{
                background: (!isAgentSuspended && summary.available_balance >= 500)
                  ? 'linear-gradient(135deg, #00B875 0%, #009E64 100%)' 
                  : '#CBD5E1',
                color: '#FFFFFF',
                cursor: (!isAgentSuspended && summary.available_balance >= 500) ? 'pointer' : 'not-allowed',
                boxShadow: (!isAgentSuspended && summary.available_balance >= 500) ? '0 4px 12px rgba(0, 184, 117, 0.3)' : 'none',
              }}
            >
              <CreditCard size={16} strokeWidth={2.5} />
              <span>{isAgentSuspended ? 'পেআউট স্থগিত' : 'পেআউট রিকোয়েস্ট'}</span>
            </button>
            <button
              onClick={fetchStatement}
              title="Refresh Statement"
              className="wallet-refresh-btn"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="wallet-kpi-grid">
          {/* Card 1: Available Balance */}
          <div className="wallet-kpi-card" style={{
            border: '1.5px solid rgba(0, 184, 117, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 184, 117, 0.08)'
          }}>
            <div className="wallet-kpi-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="wallet-kpi-title" style={{ color: '#00B875' }}>
                উত্তোলনযোগ্য ব্যালেন্স
              </span>
              <div className="wallet-kpi-icon-wrap" style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0, 184, 117, 0.12)', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={19} />
              </div>
            </div>
            <div>
              <div className="wallet-kpi-amount">
                ৳{Number(summary.available_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="wallet-kpi-desc">
                চলমান পেআউট রিকোয়েস্ট বাদে অবশিষ্ট ব্যালেন্স
              </p>
            </div>
          </div>

          {/* Card 2: In-Flight Payouts */}
          <div className="wallet-kpi-card" style={{
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="wallet-kpi-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="wallet-kpi-title" style={{ color: '#D97706' }}>
                প্রক্রিয়াধীন পেআউট
              </span>
              <div className="wallet-kpi-icon-wrap" style={{ width: 38, height: 38, borderRadius: 10, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={19} />
              </div>
            </div>
            <div>
              <div className="wallet-kpi-amount">
                ৳{Number(summary.pending_payouts || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="wallet-kpi-desc">
                ফাইন্যান্স ও অ্যাকাউন্টস ডেস্কে পর্যালোচনায় রয়েছে
              </p>
            </div>
          </div>

          {/* Card 3: Total Withdrawn */}
          <div className="wallet-kpi-card" style={{
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="wallet-kpi-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="wallet-kpi-title" style={{ color: '#0284c7' }}>
                সফল উত্তোলন
              </span>
              <div className="wallet-kpi-icon-wrap" style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div>
              <div className="wallet-kpi-amount">
                ৳{Number(totalWithdrawn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="wallet-kpi-desc">
                বিকাশ বা ব্যাংকে সফলভাবে ক্যাশআউট হয়েছে
              </p>
            </div>
          </div>

          {/* Card 4: Total Lifetime Earnings */}
          <div className="wallet-kpi-card" style={{
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}>
            <div className="wallet-kpi-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span className="wallet-kpi-title" style={{ color: '#7C3AED' }}>
                সর্বমোট অর্জিত আয়
              </span>
              <div className="wallet-kpi-icon-wrap" style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={19} />
              </div>
            </div>
            <div>
              <div className="wallet-kpi-amount">
                ৳{Number(totalLifetimeEarned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="wallet-kpi-desc">
                অনুমোদিত পার্টনার হিসেবে মোট অর্জিত কমিশন
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Statement */}
        <div className="wallet-ledger-card">
          <div className="wallet-ledger-header">
            <div>
              <h3 className="wallet-ledger-title" style={{ fontWeight: 800, color: '#0F172A', margin: 0 }}>
                General Ledger Statement
              </h3>
              <p className="wallet-ledger-subtitle" style={{ color: '#64748B', margin: '2px 0 0' }}>
                Immutable double-entry audit records with verified transaction hashes.
              </p>
            </div>
            <span className="wallet-badge-protected" style={{
              fontWeight: 700,
              color: '#00B875',
              background: 'rgba(0, 184, 117, 0.1)',
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid rgba(0, 184, 117, 0.25)',
              whiteSpace: 'nowrap'
            }}>
              Double-Entry Protected
            </span>
          </div>

          {loading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', color: '#00B875' }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>Loading transaction ledger...</p>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <FileText size={44} style={{ color: '#CBD5E1', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#334155', margin: 0 }}>No Ledger Entries Yet</h3>
              <p style={{ fontSize: 13, color: '#64748B', margin: '6px 0 0' }}>
                Commissions will automatically post here once your submitted provider candidates are verified.
              </p>
            </div>
          ) : (
            <>
              {/* 1. Desktop Table (Screens >= 768px) */}
              <div className="wallet-desktop-table" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontSize: 11.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '14px 20px' }}>Posted Date</th>
                      <th style={{ padding: '14px 16px' }}>Transaction Ref</th>
                      <th style={{ padding: '14px 16px' }}>Description</th>
                      <th style={{ padding: '14px 16px', textAlign: 'right' }}>Debit (৳)</th>
                      <th style={{ padding: '14px 20px', textAlign: 'right' }}>Credit (৳)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const isCredit = entry.direction === 'credit'
                      return (
                        <tr key={entry.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.15s' }}>
                          <td style={{ padding: '16px 20px', color: '#64748B', fontSize: 12 }}>
                            {new Date(entry.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ padding: '16px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#0F172A', fontSize: 12 }}>
                            {entry.transaction?.transaction_ref || `TXN-${entry.transaction_id}`}
                          </td>
                          <td style={{ padding: '16px 16px', color: '#334155', fontWeight: 600 }}>
                            {entry.transaction?.description || 'Commission entry'}
                          </td>
                          <td style={{ padding: '16px 16px', textAlign: 'right', fontWeight: 700, color: '#EF4444' }}>
                            {!isCredit ? `- ৳${Number(entry.amount).toFixed(2)}` : '—'}
                          </td>
                          <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: '#00B875' }}>
                            {isCredit ? `+ ৳${Number(entry.amount).toFixed(2)}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* 2. Mobile Cards View (Screens < 768px) */}
              <div className="wallet-mobile-cards">
                {entries.map((entry) => {
                  const isCredit = entry.direction === 'credit'
                  const txRef = entry.transaction?.transaction_ref || `TXN-${entry.transaction_id}`
                  const formattedDate = new Date(entry.created_at).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })

                  return (
                    <div key={entry.id} className="wallet-mobile-card">
                      {/* Top row: Amount + Direction Icon & Date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: isCredit ? '#ECFDF5' : '#FEF2F2',
                            color: isCredit ? '#059669' : '#DC2626',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {isCredit ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}
                          </div>
                          <span style={{
                            fontSize: 16,
                            fontWeight: 900,
                            color: isCredit ? '#059669' : '#DC2626',
                            letterSpacing: '-0.02em'
                          }}>
                            {isCredit ? `+ ৳${Number(entry.amount).toFixed(2)}` : `- ৳${Number(entry.amount).toFixed(2)}`}
                          </span>
                        </div>

                        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>
                          {formattedDate}
                        </span>
                      </div>

                      {/* Middle row: Transaction Ref & Direction Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          fontFamily: 'monospace',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#1E293B',
                          background: '#F1F5F9',
                          padding: '2px 8px',
                          borderRadius: 6,
                          border: '1px solid #E2E8F0'
                        }}>
                          {txRef}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: isCredit ? 'rgba(5, 150, 105, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                          color: isCredit ? '#059669' : '#DC2626'
                        }}>
                          {isCredit ? 'Credit' : 'Debit'}
                        </span>
                      </div>

                      {/* Bottom: Description */}
                      <p style={{
                        margin: 0,
                        fontSize: 12,
                        color: '#475569',
                        fontWeight: 500,
                        lineHeight: 1.45
                      }}>
                        {entry.transaction?.description || 'Commission entry'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Payout Withdrawal Modal */}
        <PayoutRequestModal
          isOpen={payoutModalOpen}
          onClose={() => setPayoutModalOpen(false)}
          availableBalance={summary.available_balance}
          defaultPhone={user?.phone || user?.agent?.phone || ''}
          onSuccess={() => fetchStatement()}
        />
      </div>
    </div>
  )
}
