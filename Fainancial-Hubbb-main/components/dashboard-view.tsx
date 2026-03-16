'use client'

import { useState, useEffect, useMemo } from 'react'
import { RefreshCw, Calendar, ChevronDown, Loader2, TrendingUp, FileText, DollarSign, FolderOpen } from 'lucide-react'
import { reportsApi, TransactionReportListItemDto } from '@/lib/api'

interface DashboardViewProps {
  onAddClick: () => void
}

// ── نفس الـ map الموجود في financial-reports-view ──
const CATEGORY_NAME_MAP: Record<string, string> = {
  'Internet Subscriptions': 'إشتراكات نت',
  'Various Purchases':      'مشتريات متنوعة',
  'Custody':                'عهدة',
  'Transfers':              'انتقالات',
  'Salaries':               'رواتب',
  'Maintenance':            'صيانة',
}

const CATEGORIES = [
  'إشتراكات نت',
  'مشتريات متنوعة',
  'عهدة',
  'انتقالات',
  'رواتب',
  'صيانة',
]

// تحويل اسم التصنيف للعربي
function toCatAr(name: string | null | undefined): string {
  if (!name) return 'غير مصنف'
  return CATEGORY_NAME_MAP[name] ?? name
}

export default function DashboardView({ onAddClick }: DashboardViewProps) {
  const [reports, setReports] = useState<TransactionReportListItemDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // فلاتر
  const [filterCategory, setFilterCategory] = useState('')
  const [fromDate, setFromDate]             = useState('')
  const [toDate, setToDate]                 = useState('')

  const fetchData = async () => {
    try {
      setLoading(true); setError('')
      const data = await reportsApi.getAll()
      setReports(data)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'فشل تحميل البيانات') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const handleReset = () => { setFilterCategory(''); setFromDate(''); setToDate('') }

  // ── تطبيق الفلاتر ─────────────────────────────
  const filtered = useMemo(() => {
    let r = [...reports]
    if (filterCategory) r = r.filter(x => toCatAr(x.categoryName) === filterCategory)
    if (fromDate) r = r.filter(x => {
      // نستخدم createdAt لو lastTransactionDate مش موجود
      const date = x.lastTransactionDate ?? x.createdAt?.split('T')[0]
      return date && date >= fromDate
    })
    if (toDate) r = r.filter(x => {
      const date = x.lastTransactionDate ?? x.createdAt?.split('T')[0]
      return date && date <= toDate
    })
    return r
  }, [reports, filterCategory, fromDate, toDate])

  // ── إحصائيات ──────────────────────────────────
  const totalAmount    = filtered.reduce((s, r) => s + (r.totalAmount ?? 0), 0)
  const totalReports   = filtered.length
  const custodyReports = filtered.filter(r => toCatAr(r.categoryName) === 'عهدة')
  const custodyAmount  = custodyReports.reduce((s, r) => s + (r.totalAmount ?? 0), 0)
  const avgAmount      = totalReports > 0 ? totalAmount / totalReports : 0

  const fmt = (n: number) => `£${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // أكثر فئة تكراراً
  const topCategory = useMemo(() => {
    const counts: Record<string, number> = {}
    filtered.forEach(r => {
      const name = toCatAr(r.categoryName)
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—'
  }, [filtered])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        .db-wrap{min-height:100vh;background:#f5f7fa;direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;padding:36px 40px 60px}
        @media(max-width:768px){.db-wrap{padding:20px 16px 60px}}
        .db-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px;flex-wrap:wrap;gap:14px}
        .db-header h1{font-size:1.75rem;font-weight:800;color:#1a1a2e;margin:0 0 4px}
        .db-header p{font-size:.85rem;color:#94a3b8;margin:0;font-weight:500}
        .db-refresh{display:inline-flex;align-items:center;gap:8px;padding:10px 20px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.9rem;font-weight:700;cursor:pointer;transition:all .18s;box-shadow:0 4px 14px rgba(37,99,235,.3);white-space:nowrap}
        .db-refresh:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px)}
        .db-refresh:disabled{opacity:.7;cursor:not-allowed}
        .db-error{background:#fee2e2;color:#991b1b;border-radius:12px;padding:12px 18px;margin-bottom:20px;font-size:.875rem}

        /* فلاتر */
        .db-filter{background:#fff;border:1px solid #e8edf4;border-radius:16px;padding:20px 24px;margin-bottom:24px;box-shadow:0 1px 6px rgba(15,27,45,.06)}
        .db-filter-grid{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:14px;align-items:end}
        @media(max-width:900px){.db-filter-grid{grid-template-columns:1fr 1fr}}
        @media(max-width:560px){.db-filter-grid{grid-template-columns:1fr}}
        .db-fg{display:flex;flex-direction:column;gap:6px}
        .db-flbl{font-size:.78rem;font-weight:700;color:#64748b;text-align:right}
        .db-fselw{position:relative}
        .db-fsel{width:100%;padding:9px 14px 9px 36px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.85rem;color:#334155;background:#f8fafc;appearance:none;cursor:pointer;transition:border-color .15s;text-align:right;direction:rtl}
        .db-fsel:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12);background:#fff}
        .db-fsel-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none}
        .db-datew{position:relative}
        .db-dateinp{width:100%;padding:9px 14px 9px 36px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.85rem;color:#334155;background:#f8fafc;cursor:pointer;transition:border-color .15s;box-sizing:border-box;direction:rtl}
        .db-dateinp:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12);background:#fff}
        .db-date-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none}
        .db-filter-reset{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:#f1f5f9;color:#475569;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.85rem;font-weight:700;cursor:pointer;transition:all .15s;white-space:nowrap;align-self:end}
        .db-filter-reset:hover{background:#e2e8f0;color:#1e293b}

        /* بطاقات الإحصائيات */
        .db-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
        @media(max-width:900px){.db-stats{grid-template-columns:1fr 1fr}}
        @media(max-width:500px){.db-stats{grid-template-columns:1fr}}
        .db-stat{background:#fff;border:1px solid #e8edf4;border-radius:14px;padding:20px 22px;box-shadow:0 1px 6px rgba(15,27,45,.06);transition:transform .18s,box-shadow .18s;display:flex;flex-direction:column;gap:8px}
        .db-stat:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(15,27,45,.1)}
        .db-stat-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:4px}
        .db-stat-val{font-size:1.5rem;font-weight:900;color:#1a1a2e;letter-spacing:-0.02em;line-height:1}
        .db-stat-lbl{font-size:.78rem;color:#94a3b8;font-weight:600}
        .db-skeleton{height:1.5rem;border-radius:8px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.5s infinite}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

        /* بطاقات الملخص */
        .db-summary{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        @media(max-width:640px){.db-summary{grid-template-columns:1fr}}
        .db-scard{background:#fff;border:1px solid #e8edf4;border-radius:16px;padding:24px 28px;box-shadow:0 1px 6px rgba(15,27,45,.06);transition:transform .18s,box-shadow .18s}
        .db-scard:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(15,27,45,.1)}
        .db-scard-title{font-size:.92rem;font-weight:800;color:#1a1a2e;margin-bottom:20px;text-align:right;border-bottom:1px solid #f1f5f9;padding-bottom:12px}
        .db-sstats{display:flex;gap:24px;justify-content:flex-end;flex-wrap:wrap}
        .db-sstat{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
        .db-sval{font-size:1.6rem;font-weight:900;color:#1a1a2e;letter-spacing:-0.02em;line-height:1}
        .db-ssub{font-size:.78rem;color:#94a3b8;font-weight:600;text-align:right}
        .db-sdiv{width:1px;background:#e8edf4;align-self:stretch}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="db-wrap">
        {/* Header */}
        <div className="db-header">
          <div>
            <h1>تحليل التقارير المالية</h1>
            <p>
              نظرة عامة على التقارير
              {filtered.length !== reports.length && ` — يعرض ${filtered.length} من ${reports.length}`}
            </p>
          </div>
          <button className="db-refresh" onClick={fetchData} disabled={loading}>
            {loading
              ? <Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/>
              : <RefreshCw size={15}/>
            }
            تحديث البيانات
          </button>
        </div>

        {error && <div className="db-error">⚠️ {error}</div>}

        {/* ── فلاتر ── */}
        <div className="db-filter">
          <div className="db-filter-grid">
            {/* فلتر التصنيف */}
            <div className="db-fg">
              <span className="db-flbl">التصنيف</span>
              <div className="db-fselw">
                <select className="db-fsel" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                  <option value="">جميع التصنيفات</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <span className="db-fsel-ico"><ChevronDown size={14}/></span>
              </div>
            </div>

            {/* من تاريخ */}
            <div className="db-fg">
              <span className="db-flbl">من تاريخ</span>
              <div className="db-datew">
                <input type="date" className="db-dateinp" value={fromDate} onChange={e => setFromDate(e.target.value)}/>
                <span className="db-date-ico"><Calendar size={14}/></span>
              </div>
            </div>

            {/* إلى تاريخ */}
            <div className="db-fg">
              <span className="db-flbl">إلى تاريخ</span>
              <div className="db-datew">
                <input type="date" className="db-dateinp" value={toDate} onChange={e => setToDate(e.target.value)}/>
                <span className="db-date-ico"><Calendar size={14}/></span>
              </div>
            </div>

            <button className="db-filter-reset" onClick={handleReset}>
              <RefreshCw size={13}/> إعادة ضبط
            </button>
          </div>
        </div>

        {/* ── بطاقات الإحصائيات ── */}
        <div className="db-stats">
          <div className="db-stat">
            <div className="db-stat-icon" style={{background:'#eff6ff',color:'#2563eb'}}><DollarSign size={20}/></div>
            {loading ? <div className="db-skeleton" style={{width:140}}/> : <span className="db-stat-val">{fmt(totalAmount)}</span>}
            <span className="db-stat-lbl">إجمالي المبالغ</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon" style={{background:'#f0fdf4',color:'#16a34a'}}><FileText size={20}/></div>
            {loading ? <div className="db-skeleton" style={{width:60}}/> : <span className="db-stat-val">{totalReports}</span>}
            <span className="db-stat-lbl">إجمالي التقارير</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon" style={{background:'#fef3c7',color:'#d97706'}}><TrendingUp size={20}/></div>
            {loading ? <div className="db-skeleton" style={{width:120}}/> : <span className="db-stat-val">{fmt(avgAmount)}</span>}
            <span className="db-stat-lbl">متوسط المبلغ لكل تقرير</span>
          </div>
          <div className="db-stat">
            <div className="db-stat-icon" style={{background:'#fdf2f8',color:'#a855f7'}}><FolderOpen size={20}/></div>
            {loading ? <div className="db-skeleton" style={{width:100}}/> : <span className="db-stat-val" style={{fontSize:'1.1rem'}}>{topCategory}</span>}
            <span className="db-stat-lbl">أكثر فئة تكراراً</span>
          </div>
        </div>

        {/* ── بطاقات الملخص ── */}
        <div className="db-summary">
          <div className="db-scard">
            <div className="db-scard-title">ملخص المصروفات</div>
            <div className="db-sstats">
              <div className="db-sstat">
                {loading ? <div className="db-skeleton" style={{width:160,height:32}}/> : <span className="db-sval">{fmt(totalAmount)}</span>}
                <span className="db-ssub">إجمالي المبلغ</span>
              </div>
              <div className="db-sdiv"/>
              <div className="db-sstat">
                {loading ? <div className="db-skeleton" style={{width:50,height:32}}/> : <span className="db-sval">{totalReports}</span>}
                <span className="db-ssub">إجمالي التقارير</span>
              </div>
            </div>
          </div>

          <div className="db-scard">
            <div className="db-scard-title">بيانات العهدة</div>
            <div className="db-sstats">
              <div className="db-sstat">
                {loading ? <div className="db-skeleton" style={{width:160,height:32}}/> : <span className="db-sval">{fmt(custodyAmount)}</span>}
                <span className="db-ssub">إجمالي المبلغ</span>
              </div>
              <div className="db-sdiv"/>
              <div className="db-sstat">
                {loading ? <div className="db-skeleton" style={{width:50,height:32}}/> : <span className="db-sval">{custodyReports.length}</span>}
                <span className="db-ssub">إجمالي تقارير العهدة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
