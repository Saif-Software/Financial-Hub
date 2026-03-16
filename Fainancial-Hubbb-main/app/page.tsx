'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'
import DashboardView from '@/components/dashboard-view'
import FinancialReportsView from '@/components/financial-reports-view'
import ProfileView from '@/components/profile-view'

export default function AppShell() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView onAddClick={() => setActiveTab('financial')} />
      case 'financial':
        return <FinancialReportsView />
      case 'profile':
        return <ProfileView />
      default:
        return <DashboardView onAddClick={() => setActiveTab('financial')} />
    }
  }

  return (
    <>
      <style>{`
        /* ── App Shell Responsive Layout ── */
        .app-layout {
          display: flex;
          min-height: 100vh;
          background: #f5f7fa;
          direction: rtl;
        }
        .app-main {
          flex: 1;
          overflow-y: auto;
          min-width: 0;
        }
        /* Mobile: add top padding for the hamburger button */
        @media (max-width: 768px) {
          .app-main {
            padding-top: 64px;
          }
        }
      `}</style>
      <div className="app-layout">
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="app-main">
          {renderView()}
        </div>
      </div>
    </>
  )
}
