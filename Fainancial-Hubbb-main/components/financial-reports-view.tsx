'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, FileText, ChevronDown, User, Calendar, X, FileSpreadsheet, Loader2, Search } from 'lucide-react'
import ReportDetailView from './report-detail-view'
import { reportsApi, TransactionReportListItemDto, CreateReportPayload } from '@/lib/api'

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  completed: { label: 'مكتمل',        bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
  approved:  { label: 'معتمد',        bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
  rejected:  { label: 'مرفوض',        bg: '#fff1f2', color: '#e11d48', border: '#fda4af' },
  review:    { label: 'قيد المراجعة', bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  deleted:   { label: 'محذوف',        bg: '#f9fafb', color: '#9ca3af', border: '#d1d5db' },
  draft:     { label: 'مسودّة',       bg: '#f8fafc', color: '#94a3b8', border: '#cbd5e1' },
}

// ── التصنيفات مع الـ ID المطابق للـ DB ──
const CATEGORIES = [
  { id: 1, name: 'إشتراكات نت' },
  { id: 2, name: 'مشتريات متنوعة' },
  { id: 3, name: 'عهدة' },
  { id: 4, name: 'انتقالات' },
  { id: 5, name: 'رواتب' },
  { id: 6, name: 'صيانة' },
]

// ── تحويل الأسماء الإنجليزية من الـ DB للعربية ──
const CATEGORY_NAME_MAP: Record<string, string> = {
  'Internet Subscriptions': 'إشتراكات نت',
  'Various Purchases':      'مشتريات متنوعة',
  'Custody':                'عهدة',
  'Transfers':              'انتقالات',
  'Salaries':               'رواتب',
  'Maintenance':            'صيانة',
}

function formatAmount(n: number) {
  return `£${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

interface ReportRow {
  id: number; title: string; category: string; status: string
  lastOperationDate: string; totalAmount: string; rawAmount: number
}

function mapDto(dto: TransactionReportListItemDto): ReportRow {
  const catAr = CATEGORY_NAME_MAP[dto.categoryName ?? ''] ?? dto.categoryName ?? 'غير مصنف'
  return {
    id: dto.id,
    title: dto.reportName ?? '(بدون عنوان)',
    category: catAr,
    status: 'draft',
    lastOperationDate: dto.lastTransactionDate ?? '—',
    totalAmount: formatAmount(dto.totalAmount),
    rawAmount: dto.totalAmount,
  }
}

export default function FinancialReportsView() {
  const [reports, setReports]               = useState<ReportRow[]>([])
  const [filtered, setFiltered]             = useState<ReportRow[]>([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [selectedReport, setSelectedReport] = useState<ReportRow | null>(null)
  const [showModal, setShowModal]           = useState(false)
  const [submitting, setSubmitting]         = useState(false)

  // فلاتر
  const [searchText, setSearchText]         = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStatus, setFilterStatus]     = useState('')

  // Modal
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc]   = useState('')
  const [newCat, setNewCat]     = useState('')
  const [formErr, setFormErr]   = useState('')
  const [catOpen, setCatOpen]   = useState(false)
  const catRef = useRef<HTMLDivElement>(null)

  // ── Fetch ──────────────────────────────────────
  const fetchReports = async () => {
    try {
      setLoading(true); setError('')
      const data = await reportsApi.getAll()
      const rows = data.map(mapDto)
      setReports(rows); setFiltered(rows)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'فشل تحميل التقارير')
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchReports() }, [])

  // ── فلترة ─────────────────────────────────────
  useEffect(() => {
    let r = [...reports]
    if (searchText.trim()) r = r.filter(x => x.title.includes(searchText) || x.category.includes(searchText))
    if (filterCategory) r = r.filter(x => x.category === filterCategory)
    if (filterStatus)   r = r.filter(x => x.status === filterStatus)
    setFiltered(r)
  }, [searchText, filterCategory, filterStatus, reports])

  // ── Delete ─────────────────────────────────────
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('هل تريد حذف هذا التقرير؟')) return
    try {
      await reportsApi.delete(id)
      setReports(prev => prev.filter(r => r.id !== id))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'فشل الحذف') }
  }

  // ── Create ─────────────────────────────────────
  const handleCreate = async () => {
    if (!newTitle.trim()) { setFormErr('عنوان التقرير مطلوب'); return }
    try {
      setSubmitting(true); setFormErr('')
      const payload: CreateReportPayload = {
        reportName: newTitle.trim(),
        notes: newDesc.trim() || undefined,
        creatorAccountId: 1,
        categoryId: CATEGORIES.find(c => c.name === newCat)?.id ?? undefined,
      }
      const created = await reportsApi.create(payload)
      const row = mapDto({ ...created, lastTransactionDate: null })
      setReports(prev => [row, ...prev])
      closeModal()
      setSelectedReport(row)
    } catch (e: unknown) { setFormErr(e instanceof Error ? e.message : 'فشل الإنشاء') }
    finally { setSubmitting(false) }
  }

  const closeModal = () => {
    setShowModal(false)
    setNewTitle(''); setNewDesc(''); setNewCat(''); setFormErr(''); setCatOpen(false)
  }

  // ── Export ─────────────────────────────────────
  const handleExport = () => {
    const csv = [
      ['م', 'العنوان', 'تاريخ آخر عملية', 'الفئة', 'إجمالي المبلغ'],
      ...filtered.map((r, i) => [i+1, r.title, r.lastOperationDate, r.category, r.totalAmount])
    ].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\uFEFF'+csv], { type: 'text/csv' }))
    a.download = `reports_${Date.now()}.csv`; a.click()
  }

  if (selectedReport) {
    return <ReportDetailView report={selectedReport} onBack={() => { setSelectedReport(null); fetchReports() }} />
  }

  const hasFilters = searchText || filterCategory || filterStatus

  return (
    <>
      <style>{`
        .frh-wrap{padding:28px 32px 60px;background:#f5f7fa;min-height:100vh;direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,sans-serif}
        @media(max-width:640px){.frh-wrap{padding:18px 14px 60px}}
        .frh-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;margin-bottom:20px}
        .frh-title{font-size:1.6rem;font-weight:800;color:#0f1b2d;letter-spacing:-.02em}
        .frh-actions{display:flex;gap:10px;flex-wrap:wrap}
        .frh-btn-create{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;transition:all .17s;box-shadow:0 2px 10px rgba(37,99,235,.28)}
        .frh-btn-create:hover{background:#1d4ed8;transform:translateY(-1px)}
        .frh-btn-export{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;background:#fff;color:#16a34a;border:1.5px solid #bbf7d0;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;transition:all .17s}
        .frh-btn-export:hover{background:#f0fdf4}
        .frh-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;align-items:center}
        .frh-search{display:flex;align-items:center;gap:8px;padding:8px 14px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;flex:1;min-width:180px}
        .frh-search:focus-within{border-color:#93c5fd}
        .frh-search input{border:none;outline:none;font-family:inherit;font-size:.875rem;color:#0f1b2d;background:transparent;width:100%;direction:rtl}
        .frh-search input::placeholder{color:#94a3b8}
        .frh-sel{padding:8px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.875rem;color:#334155;background:#fff;outline:none;cursor:pointer;direction:rtl}
        .frh-sel:focus{border-color:#93c5fd}
        .frh-reset{display:inline-flex;align-items:center;gap:6px;padding:8px 14px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;font-family:inherit;font-size:.84rem;font-weight:600;cursor:pointer}
        .frh-reset:hover{background:#e2e8f0}
        .frh-count{font-size:.82rem;color:#94a3b8;white-space:nowrap}
        .frh-error{background:#fee2e2;color:#991b1b;border-radius:12px;padding:12px 18px;margin-bottom:16px;font-size:.875rem;display:flex;justify-content:space-between;align-items:center}
        .frh-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 2px 14px rgba(15,27,45,.06);overflow:hidden}
        .frh-table-wrap{overflow-x:auto}
        .frh-table{width:100%;border-collapse:collapse;min-width:620px}
        .frh-thead th{padding:12px 18px;font-size:.78rem;font-weight:700;color:#94a3b8;text-align:right;border-bottom:1px solid #f1f5f9;background:#fafafa;white-space:nowrap}
        .frh-th-i{display:inline-flex;align-items:center;gap:5px}
        .frh-tbody tr{border-bottom:1px solid #f8fafc;transition:background .13s;cursor:pointer}
        .frh-tbody tr:last-child{border-bottom:none}
        .frh-tbody tr:hover{background:#f0f7ff}
        .frh-tbody td{padding:13px 18px;vertical-align:middle}
        .frh-td-title{font-size:.875rem;color:#0f1b2d;font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .frh-td-date,.frh-td-cat{font-size:.875rem;color:#334155;font-weight:500}
        .frh-td-cat{font-weight:600}
        .frh-td-amt{font-size:.9rem;color:#0f1b2d;font-weight:700}
        .frh-badge{display:inline-flex;align-items:center;padding:4px 14px;border-radius:20px;font-size:.8rem;font-weight:700;white-space:nowrap;border:1.5px solid}
        .frh-del{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:8px;border:none;background:transparent;color:#ef4444;cursor:pointer;transition:background .13s}
        .frh-del:hover{background:#fee2e2}
        .frh-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 20px;color:#94a3b8;gap:12px}
        .frh-empty-ico{width:56px;height:56px;border-radius:16px;background:#f1f5f9;display:flex;align-items:center;justify-content:center}
        .frh-empty p{font-size:.9rem;font-weight:600;margin:0}
        .frh-overlay{position:fixed;inset:0;background:rgba(10,20,40,.45);backdrop-filter:blur(3px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px;animation:fin .18s ease}
        @keyframes fin{from{opacity:0}to{opacity:1}}
        .frh-modal{background:#fff;border-radius:20px;box-shadow:0 20px 60px rgba(10,20,40,.2);width:100%;max-width:470px;padding:28px;direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,sans-serif;animation:fup .22s cubic-bezier(.4,0,.2,1)}
        @keyframes fup{from{transform:translateY(20px);opacity:0}to{transform:none;opacity:1}}
        .frh-mhd{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
        .frh-mhd-l{display:flex;align-items:center;gap:10px}
        .frh-mico{width:38px;height:38px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center}
        .frh-mtitle{font-size:1.15rem;font-weight:800;color:#0f1b2d}
        .frh-mclose{width:32px;height:32px;border-radius:8px;border:none;background:#f1f5f9;color:#64748b;display:flex;align-items:center;justify-content:center;cursor:pointer}
        .frh-mclose:hover{background:#e2e8f0}
        .frh-mmeta{display:flex;align-items:center;gap:6px;font-size:.82rem;color:#64748b;background:#f8fafc;border-radius:9px;padding:8px 14px;margin-bottom:20px}
        .frh-field{margin-bottom:16px}
        .frh-lbl{display:block;font-size:.82rem;font-weight:700;color:#334155;margin-bottom:6px}
        .frh-lbl span{color:#ef4444;margin-right:2px}
        .frh-inp,.frh-ta{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.9rem;color:#0f1b2d;outline:none;direction:rtl;transition:border-color .15s;box-sizing:border-box;background:#fff}
        .frh-inp:focus,.frh-ta:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.2)}
        .frh-inp.err{border-color:#fca5a5}
        .frh-inp::placeholder,.frh-ta::placeholder{color:#cbd5e1}
        .frh-ta{resize:none;min-height:72px}
        .frh-ferr{font-size:.8rem;color:#dc2626;margin-top:4px}
        .frh-catw{position:relative}
        .frh-catb{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;font-family:inherit;font-size:.9rem;color:#0f1b2d;cursor:pointer;direction:rtl;display:flex;align-items:center;justify-content:space-between;transition:border-color .15s}
        .frh-catb:hover{border-color:#93c5fd}
        .frh-catdd{position:absolute;top:calc(100% + 4px);right:0;left:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(15,27,45,.13);z-index:600;overflow:hidden}
        .frh-catop{padding:10px 14px;font-size:.875rem;color:#334155;cursor:pointer;direction:rtl;transition:background .12s}
        .frh-catop:hover{background:#eff6ff;color:#1d4ed8}
        .frh-catop.act{background:#dbeafe;color:#1d4ed8;font-weight:600}
        .frh-mact{display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:24px}
        .frh-btnc{padding:9px 20px;background:#f1f5f9;color:#64748b;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:600;cursor:pointer}
        .frh-btnc:hover{background:#e2e8f0}
        .frh-btns{padding:9px 24px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px;box-shadow:0 2px 8px rgba(37,99,235,.28)}
        .frh-btns:not(:disabled):hover{background:#1d4ed8;transform:translateY(-1px)}
        .frh-btns:disabled{background:#e2e8f0;color:#94a3b8;cursor:not-allowed;box-shadow:none}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="frh-wrap">
        <div className="frh-header">
          <h1 className="frh-title">سجل التقارير المالية</h1>
          <div className="frh-actions">
            <button className="frh-btn-export" onClick={handleExport}><FileSpreadsheet size={16} /> تصدير</button>
            <button className="frh-btn-create" onClick={() => setShowModal(true)}><Plus size={16} /> إنشاء تقرير</button>
          </div>
        </div>

        {/* ── فلاتر ── */}
        <div className="frh-filters">
          <div className="frh-search">
            <Search size={15} color="#94a3b8" />
            <input
              placeholder="ابحث بالعنوان أو الفئة..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
          <select className="frh-sel" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="">كل الفئات</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          <select className="frh-sel" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          {hasFilters && (
            <button className="frh-reset" onClick={() => { setSearchText(''); setFilterCategory(''); setFilterStatus('') }}>
              <X size={13} /> إعادة ضبط
            </button>
          )}
          {!loading && <span className="frh-count">{filtered.length} تقرير</span>}
        </div>

        {error && (
          <div className="frh-error">
            ⚠️ {error}
            <button onClick={fetchReports} style={{background:'none',border:'none',color:'#991b1b',cursor:'pointer',fontWeight:700}}>
              إعادة المحاولة
            </button>
          </div>
        )}

        {/* ── الجدول ── */}
        <div className="frh-card">
          <div className="frh-table-wrap">
            <table className="frh-table">
              <thead className="frh-thead">
                <tr>
                  <th style={{width:40}}></th>
                  <th><span className="frh-th-i">العنوان</span></th>
                  <th><span className="frh-th-i">تاريخ آخر عملية <ChevronDown size={12}/></span></th>
                  <th><span className="frh-th-i">الفئة <ChevronDown size={12}/></span></th>
                  <th><span className="frh-th-i">إجمالي المبلغ <ChevronDown size={12}/></span></th>
                  <th><span className="frh-th-i">الحالة</span></th>
                  <th style={{width:40}}></th>
                </tr>
              </thead>
              <tbody className="frh-tbody">
                {loading ? (
                  <tr><td colSpan={7}>
                    <div className="frh-empty">
                      <Loader2 size={32} style={{animation:'spin 1s linear infinite',color:'#2563eb'}}/>
                      <p>جاري التحميل...</p>
                    </div>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={7}>
                    <div className="frh-empty">
                      <div className="frh-empty-ico"><FileText size={26} color="#94a3b8"/></div>
                      <p>{hasFilters ? 'لا توجد نتائج' : 'لا توجد تقارير'}</p>
                    </div>
                  </td></tr>
                ) : filtered.map(r => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.draft
                  return (
                    <tr key={r.id} onClick={() => setSelectedReport(r)}>
                      <td>
                        <button className="frh-del" onClick={e => handleDelete(e, r.id)}>
                          <Trash2 size={15}/>
                        </button>
                      </td>
                      <td className="frh-td-title" title={r.title}>{r.title}</td>
                      <td className="frh-td-date">{r.lastOperationDate}</td>
                      <td className="frh-td-cat">{r.category}</td>
                      <td className="frh-td-amt">{r.totalAmount}</td>
                      <td>
                        <span className="frh-badge" style={{background:cfg.bg,color:cfg.color,borderColor:cfg.border}}>
                          {cfg.label}
                        </span>
                      </td>
                      <td></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ══ Modal إنشاء تقرير ══ */}
      {showModal && (
        <div className="frh-overlay" onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="frh-modal">
            <div className="frh-mhd">
              <div className="frh-mhd-l">
                <div className="frh-mico"><FileText size={18}/></div>
                <span className="frh-mtitle">إنشاء تقرير جديد</span>
              </div>
              <button className="frh-mclose" onClick={closeModal}><X size={16}/></button>
            </div>

            <div className="frh-mmeta">
              <User size={14}/><span>أحمد يحيى</span>
              <span style={{margin:'0 8px',color:'#cbd5e1'}}>|</span>
              <Calendar size={14}/>
              <span>{new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'numeric',day:'numeric'})}</span>
            </div>

            <div className="frh-field">
              <label className="frh-lbl">عنوان التقرير <span>*</span></label>
              <input
                className={`frh-inp${formErr ? ' err' : ''}`}
                placeholder="مثال: بيانات تسوية عهدة مبلغ"
                value={newTitle}
                onChange={e => { setNewTitle(e.target.value); setFormErr('') }}
                autoFocus
              />
              {formErr && <div className="frh-ferr">{formErr}</div>}
            </div>

            <div className="frh-field">
              <label className="frh-lbl">الوصف</label>
              <textarea
                className="frh-ta"
                placeholder="وصف مختصر عن التقرير..."
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>

            <div className="frh-field">
              <label className="frh-lbl">التصنيف (اختياري)</label>
              <div className="frh-catw" ref={catRef}>
                <button type="button" className="frh-catb" onClick={() => setCatOpen(o => !o)}>
                  <span style={{color: newCat ? '#0f1b2d' : '#cbd5e1'}}>
                    {newCat || 'اختر تصنيفاً...'}
                  </span>
                  <ChevronDown size={14} style={{flexShrink:0,transition:'transform .2s',transform:catOpen?'rotate(180deg)':'none'}}/>
                </button>
                {catOpen && (
                  <div className="frh-catdd">
                    {CATEGORIES.map(c => (
                      <div
                        key={c.id}
                        className={`frh-catop${newCat === c.name ? ' act' : ''}`}
                        onClick={() => { setNewCat(c.name); setCatOpen(false) }}
                      >
                        {c.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="frh-mact">
              <button className="frh-btnc" onClick={closeModal}>إلغاء</button>
              <button
                className="frh-btns"
                onClick={handleCreate}
                disabled={!newTitle.trim() || submitting}
              >
                {submitting
                  ? <><Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/> جاري الإنشاء...</>
                  : <><Plus size={15}/> إنشاء التقرير</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
