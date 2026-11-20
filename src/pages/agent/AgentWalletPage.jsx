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
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>
        {/* Breadcrumb HUD */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748B', marginBottom: 16 }}>
          <Link to="/agent" style={{ color: 'inherit', textDecoration: 'none' }}>Partner Desk</Link>
          <ChevronRight size={13} />
          <span>Finance</span>
          <ChevronRight size={13} />
          <span style={{ color: '#00B875', fontWeight: 700 }}>Commission Wallet</span>
        </div>

        {/* Page Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #00B875 0%, #0284c7 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(0, 184, 117, 0.3)'
            }}>
              <Wallet size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
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
              <p style={{ fontSize: 13, color: '#64748B', margin: '3px 0 0' }}>
                অনবোর্ডিং রিওয়ার্ড পরিচালনা, ব্যাংক/বিকাশ পেআউট অনুরোধ এবং অডিট লেজার ট্র্যাক করুন।
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={fetchStatement}
              title="Refresh Statement"
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                border: '1.5px solid #CBD5E1',
                background: '#FFFFFF',
                color: '#475569',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <RefreshCw size={16} />
            </button>
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
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                borderRadius: 10,
                background: (!isAgentSuspended && summary.available_balance >= 500)
                  ? 'linear-gradient(135deg, #00B875 0%, #009E64 100%)' 
                  : '#CBD5E1',
                color: '#FFFFFF',
                fontSize: 13.5,
                fontWeight: 800,
                border: 'none',
                cursor: (!isAgentSuspended && summary.available_balance >= 500) ? 'pointer' : 'not-allowed',
                boxShadow: (!isAgentSuspended && summary.available_balance >= 500) ? '0 4px 12px rgba(0, 184, 117, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <CreditCard size={16} strokeWidth={2.5} />
              <span>{isAgentSuspended ? 'পেআউট স্থগিত' : 'পেআউট রিকোয়েস্ট'}</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
          gap: 16,
          marginBottom: 24
        }}>
          {/* Card 1: Available Balance */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '22px 24px',
            border: '1.5px solid rgba(0, 184, 117, 0.3)',
            boxShadow: '0 4px 16px rgba(0, 184, 117, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#00B875', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                উত্তোলনযোগ্য ব্যালেন্স
              </span>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(0, 184, 117, 0.12)', color: '#00B875', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
                ৳{Number(summary.available_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                চলমান পেআউট রিকোয়েস্ট বাদে অবশিষ্ট ব্যালেন্স
              </p>
            </div>
          </div>

          {/* Card 2: In-Flight Payouts */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '22px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                প্রক্রিয়াধীন পেআউট
              </span>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFFBEB', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
                ৳{Number(summary.pending_payouts || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                ফাইন্যান্স ও অ্যাকাউন্টস ডেস্কে পর্যালোচনায় রয়েছে
              </p>
            </div>
          </div>

          {/* Card 3: Total Withdrawn */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '22px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                সফল উত্তোলন
              </span>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#EFF6FF', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
                ৳{Number(totalWithdrawn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                বিকাশ বা ব্যাংকে সফলভাবে ক্যাশআউট হয়েছে
              </p>
            </div>
          </div>

          {/* Card 4: Total Lifetime Earnings */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            padding: '22px 24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                সর্বমোট অর্জিত আয়
              </span>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: '#F5F3FF', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUp size={19} />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
                ৳{Number(totalLifetimeEarned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
                অনুমোদিত পার্টনার হিসেবে মোট অর্জিত কমিশন
              </p>
            </div>
          </div>
        </div>

        {/* Ledger Statement Table */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                General Ledger Statement
              </h3>
              <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>
                Immutable double-entry audit records with verified transaction hashes.
              </p>
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#00B875',
              background: 'rgba(0, 184, 117, 0.1)',
              padding: '4px 10px',
              borderRadius: 8,
              border: '1px solid rgba(0, 184, 117, 0.25)'
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
                Commissions will automatically post here once your submitted doctor candidates are BMDC-verified.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
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
