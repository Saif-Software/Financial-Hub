import { TrendingUp, DollarSign, Users, FileText, Wallet, BarChart2 } from 'lucide-react'

export default function StatsCards() {
  const contractData = {
    totalAmount: '£300,500.00',
    totalReports: '38',
  }

  const expensesData = {
    totalAmount: '£284,500.00',
    totalExpenses: '142',
  }

  return (
    <div className="stats-grid">
      {/* Contract Data Card */}
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">بيانات العهدة</span>
        </div>
        <div className="stat-card-body">
          <div className="stat-item">
            <span className="stat-value">{contractData.totalAmount}</span>
            <span className="stat-label">إجمالي المبلغ</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value stat-value-count">{contractData.totalReports}</span>
            <span className="stat-label">إجمالي تقارير العهدة</span>
          </div>
        </div>
      </div>

      {/* Expenses Summary Card */}
      <div className="stat-card">
        <div className="stat-card-header">
          <span className="stat-card-title">ملخص المصروفات</span>
        </div>
        <div className="stat-card-body">
          <div className="stat-item">
            <span className="stat-value">{expensesData.totalAmount}</span>
            <span className="stat-label">إجمالي المبلغ</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-value stat-value-count">{expensesData.totalExpenses}</span>
            <span className="stat-label">إجمالي المصروفات</span>
          </div>
        </div>
      </div>

      {/* Additional metric cards */}
      <div className="stat-card stat-card-accent">
        <div className="stat-card-header">
          <span className="stat-card-title">إجمالي الإيرادات</span>
          <div className="stat-icon-wrap stat-icon-blue">
            <DollarSign size={20} className="text-white" />
          </div>
        </div>
        <div className="stat-card-solo">
          <span className="stat-value">£800,500.00</span>
          <span className="stat-badge stat-badge-up">+14% من الفترة السابقة</span>
        </div>
      </div>

      <div className="stat-card stat-card-accent">
        <div className="stat-card-header">
          <span className="stat-card-title">معدل النمو</span>
          <div className="stat-icon-wrap stat-icon-green">
            <TrendingUp size={20} className="text-white" />
          </div>
        </div>
        <div className="stat-card-solo">
          <span className="stat-value">28%</span>
          <span className="stat-badge stat-badge-up">+5% من الفترة السابقة</span>
        </div>
      </div>
    </div>
  )
}
