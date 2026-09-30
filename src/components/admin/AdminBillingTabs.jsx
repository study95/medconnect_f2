import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Grid,
  Layers,
  Sparkles,
  Users,
  FileText,
  CreditCard,
  Tag,
  Settings,
  Shield
} from 'lucide-react'
import './AdminBillingTabs.css'

export default function AdminBillingTabs({ pendingCount = 0 }) {
  const location = useLocation()
  const path = location.pathname

  const tabs = [
    {
      to: '/admin/billing/dashboard',
      label: 'রাজস্ব অ্যানালিটিক্স',
      icon: Grid,
      exact: true
    },
    {
      to: '/admin/billing/plans',
      label: 'প্ল্যান ও টিয়ার',
      icon: Layers
    },
    {
      to: '/admin/billing/matrix',
      label: 'ফিচার ম্যাট্রিক্স',
      icon: Sparkles
    },
    {
      to: '/admin/billing/subscribers',
      label: 'গ্রাহক তালিকা',
      icon: Users
    },
    {
      to: '/admin/billing/invoices',
      label: 'ইনভয়েস',
      icon: FileText
    },
    {
      to: '/admin/billing/transactions',
      label: 'ম্যানুয়াল লেনদেন',
      icon: CreditCard,
      badge: pendingCount > 0 ? pendingCount : null
    },
    {
      to: '/admin/billing/coupons',
      label: 'কুপন',
      icon: Tag
    },
    {
      to: '/admin/billing/settings',
      label: 'বিলিং সেটিংস',
      icon: Settings
    },
    {
      to: '/admin/billing/gateways',
      label: 'পেমেন্ট গেটওয়ে',
      icon: Shield
    }
  ]

  const isTabActive = (tab) => {
    if (tab.exact) {
      return path === tab.to
    }
    return path.startsWith(tab.to)
  }

  return (
    <nav className="abt-quick-nav" aria-label="Billing Navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = isTabActive(tab)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`abt-nav-link ${active ? 'active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={(e) => {
              if (active) {
                e.preventDefault()
              }
            }}
          >
            <Icon size={14} />
            <span>{tab.label}</span>
            {tab.badge && (
              <span className="abt-nav-badge">{tab.badge}</span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
