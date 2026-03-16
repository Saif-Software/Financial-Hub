'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams, RowClickedEvent } from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import {
  FileSpreadsheet, Plus, Trash2,
  FileText, X, ChevronDown, User, Calendar
} from 'lucide-react'
import ReportDetailView from './report-detail-view'

/* ─── Types ─────────────────────────────────── */
interface ReportRecord {
  id: number
  title: string
  lastOperationDate: string
  category: string
  totalAmount: string
  status: 'approved' | 'review' | 'rejected' | 'completed' | 'draft' | 'deleted'
}

/* ─── Static data ────────────────────────────── */
const initialReports: ReportRecord[] = [
  { id: 1, title: 'تقرير إشتراكات الإنترنت', lastOperationDate: '1/15/2024', category: 'إشتراكات نت', totalAmount: '£4,750.00', status: 'approved' },
  { id: 2, title: 'تقرير مشتريات متنوعة يناير', lastOperationDate: '2/1/2024', category: 'مشتريات متنوعة', totalAmount: '£12,500.00', status: 'review' },
  { id: 3, title: 'بيانات تسوية عهدة مبلغ', lastOperationDate: '1/28/2024', category: 'عهدة', totalAmount: '£25,000.00', status: 'rejected' },
  { id: 4, title: 'تقرير انتقالات الموظفين', lastOperationDate: '12/1/2023', category: 'انتقالات', totalAmount: '£3,200.00', status: 'completed' },
  { id: 5, title: 'مسودة مشتريات فبراير', lastOperationDate: '2/5/2024', category: 'مشتريات متنوعة', totalAmount: '£980.00', status: 'draft' },
  { id: 6, title: 'تقرير الاشتراكات المحذوف', lastOperationDate: '2/10/2024', category: 'إشتراكات نت', totalAmount: '£1,500.00', status: 'deleted' },
]

const STATUS_CONFIG = {
  approved: { label: 'معتمد', bg: '#dcfce7', color: '#166534' },
  review: { label: 'قيد المراجعة', bg: '#fef9c3', color: '#854d0e' },
  rejected: { label: 'مرفوض', bg: '#fee2e2', color: '#991b1b' },
  completed: { label: 'مكتمل', bg: '#d1fae5', color: '#065f46' },
  draft: { label: 'مسودة', bg: '#f0fdf4', color: '#15803d' },
  deleted: { label: 'محذوف', bg: '#f3f4f6', color: '#6b7280' },
}

const CATEGORIES = ['إشتراكات نت', 'مشتريات متنوعة', 'عهدة', 'انتقالات', 'رواتب', 'صيانة']

/* ══════════════════════════════════════════════
   AG GRID CELL RENDERERS
══════════════════════════════════════════════ */
function StatusRenderer({ value }: ICellRendererParams) {
  const cfg = STATUS_CONFIG[value as keyof typeof STATUS_CONFIG]
  if (!cfg) return null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '3px 7px', borderRadius: 10,
      fontSize: '.77rem', fontWeight: 700, whiteSpace: 'nowrap',
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  )
}

function DeleteRenderer({ data, context }: ICellRendererParams) {
  return (
    <button
      onClick={() => context.onDelete(data.id)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: 30, height: 30, borderRadius: 7, border: 'none',
        background: 'transparent', color: '#ef4444', cursor: 'pointer',
        transition: 'background .15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      title="حذف"
    >
      <Trash2 size={14} />
    </button>
  )
}

/* ══════════════════════════════════════════════
   CREATE REPORT MODAL
══════════════════════════════════════════════ */
function CreateReportModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (title: string, description: string, category: string) => void
}) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [cat, setCat] = useState('')
  const [catOpen, setCatOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' })

  // Button is only enabled when the required title field has content
  const isFormValid = title.trim().length > 0

  const handleSubmit = async () => {
    if (!isFormValid) { setError('عنوان التقرير مطلوب'); return }
    setError(''); setLoading(true)
    await new Promise(r => setTimeout(r, 600))
    onCreate(title.trim(), desc.trim(), cat)
    setLoading(false); onClose()
  }

  return (
    <>
      <style>{`
        .crm-backdrop{position:fixed;inset:0;background:rgba(15,27,45,.5);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;direction:rtl;animation:crmIn .18s ease}
        @keyframes crmIn{from{opacity:0}to{opacity:1}}
        .crm-box{background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(15,27,45,.22);width:100%;max-width:460px;margin:16px;direction:rtl;animation:crmBox .22s cubic-bezier(.34,1.3,.64,1);overflow:hidden}
        @keyframes crmBox{from{opacity:0;transform:scale(.94) translateY(-10px)}to{opacity:1;transform:none}}
        .crm-hd{display:flex;align-items:center;justify-content:space-between;padding:20px 22px 16px;border-bottom:1px solid #f1f5f9}
        .crm-hd-l{display:flex;align-items:center;gap:10px}
        .crm-ico{width:36px;height:36px;border-radius:9px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center}
        .crm-hdtitle{font-size:1.05rem;font-weight:700;color:#0f1b2d}
        .crm-xbtn{width:30px;height:30px;border-radius:8px;border:none;background:transparent;color:#94a3b8;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
        .crm-xbtn:hover{background:#f1f5f9;color:#475569}
        .crm-meta{display:flex;align-items:center;gap:18px;padding:12px 22px;background:#f8fafc;border-bottom:1px solid #f1f5f9}
        .crm-meta-item{display:flex;align-items:center;gap:6px;font-size:.82rem;color:#64748b;font-weight:500}
        .crm-meta-item svg{color:#94a3b8;flex-shrink:0}
        .crm-meta-val{font-weight:600;color:#334155}
        .crm-body{padding:20px 22px}
        .crm-field{margin-bottom:16px}
        .crm-label{display:block;font-size:.825rem;font-weight:700;color:#374151;margin-bottom:6px}
        .crm-label .req{color:#ef4444;margin-right:2px}
        .crm-input{width:100%;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.875rem;color:#1e293b;background:#fff;outline:none;direction:rtl;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
        .crm-input::placeholder{color:#94a3b8}
        .crm-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .crm-input.err{border-color:#ef4444}
        .crm-textarea{resize:none;min-height:72px;line-height:1.55}
        .crm-cat-w{position:relative}
        .crm-cat-btn{width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;background:#fff;font-family:inherit;font-size:.875rem;color:#1e293b;cursor:pointer;transition:border-color .15s,box-shadow .15s;direction:rtl;text-align:right}
        .crm-cat-btn.open{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .crm-ph{color:#94a3b8}
        .crm-dd{position:absolute;top:calc(100% + 5px);right:0;left:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(15,27,45,.13);z-index:200;overflow:hidden}
        .crm-opt{padding:10px 14px;font-size:.875rem;color:#334155;cursor:pointer;transition:background .12s;direction:rtl;text-align:right}
        .crm-opt:hover{background:#eff6ff;color:#1d4ed8}
        .crm-opt.active{background:#dbeafe;color:#1d4ed8;font-weight:600}
        .crm-hint{font-size:.75rem;color:#94a3b8;margin-top:5px;direction:rtl}
        .crm-err{font-size:.78rem;color:#dc2626;margin-top:5px;direction:rtl}
        .crm-ft{display:flex;align-items:center;gap:12px;padding:16px 22px 20px;border-top:1px solid #f1f5f9;direction:rtl;flex-direction:row-reverse}
        .crm-submit{display:inline-flex;align-items:center;gap:7px;padding:10px 24px;background:#cbd5e1;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:700;cursor:not-allowed;transition:background .25s ease,box-shadow .25s ease,transform .17s ease;box-shadow:none}
        .crm-submit.active{background:#2563eb;cursor:pointer;box-shadow:0 2px 8px rgba(37,99,235,.28)}
        .crm-submit.active:hover{background:#1d4ed8;transform:translateY(-1px);box-shadow:0 4px 16px rgba(37,99,235,.38)}
        .crm-cancel{padding:10px 18px;background:transparent;border:none;color:#64748b;font-family:inherit;font-size:.875rem;font-weight:600;cursor:pointer;border-radius:10px;transition:background .15s,color .15s}
        .crm-cancel:hover{background:#f1f5f9;color:#334155}
        .crm-spin{width:14px;height:14px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>
      <div className="crm-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
        <div className="crm-box">
          <div className="crm-hd">
            <div className="crm-hd-l">
              <div className="crm-ico"><FileText size={18} /></div>
              <span className="crm-hdtitle">أنشئ تقريراً جديداً</span>
            </div>
            <button className="crm-xbtn" onClick={onClose}><X size={17} /></button>
          </div>
          <div className="crm-meta">
            <span className="crm-meta-item"><User size={14} /><span className="crm-meta-val">أحمد يحيى</span></span>
            <span className="crm-meta-item"><Calendar size={14} /><span className="crm-meta-val">{today}</span></span>
          </div>
          <div className="crm-body">
            <div className="crm-field">
              <label className="crm-label">عنوان التقرير<span className="req"> *</span></label>
              <input type="text" className={`crm-input${error ? ' err' : ''}`}
                placeholder="مثال: بيانات تسوية عهدة مبلغ"
                value={title} onChange={e => { setTitle(e.target.value); setError('') }} autoFocus />
              {error && <div className="crm-err">{error}</div>}
            </div>
            <div className="crm-field">
              <label className="crm-label">الوصف (اختياري)</label>
              <textarea className="crm-input crm-textarea"
                placeholder="وصف مختصر عن التقرير..."
                value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="crm-field">
              <label className="crm-label">التصنيف (اختياري)</label>
              <div className="crm-cat-w">
                <button className={`crm-cat-btn${catOpen ? ' open' : ''}`} onClick={() => setCatOpen(o => !o)} type="button">
                  {cat ? <span>{cat}</span> : <span className="crm-ph">اختر تصنيفاً...</span>}
                  <ChevronDown size={15} style={{ flexShrink: 0, transition: 'transform .2s', transform: catOpen ? 'rotate(180deg)' : 'none' }} />
                </button>
                {catOpen && (
                  <div className="crm-dd">
                    {CATEGORIES.map(c => (
                      <div key={c} className={`crm-opt${cat === c ? ' active' : ''}`}
                        onClick={() => { setCat(c); setCatOpen(false) }}>{c}</div>
                    ))}
                  </div>
                )}
              </div>
              <div className="crm-hint">يمكنك أيضاً تحديد التصنيف بعد إنشاء التقرير</div>
            </div>
          </div>
          <div className="crm-ft">
            <button
              className={`crm-submit${isFormValid && !loading ? ' active' : ''}`}
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              title={!isFormValid ? 'يرجى ملء عنوان التقرير أولاً' : undefined}
            >
              {loading ? <><div className="crm-spin" /> جاري الإنشاء...</> : <><Plus size={15} /> إنشاء التقرير</>}
            </button>
            <button className="crm-cancel" onClick={onClose}>إلغاء</button>
          </div>
        </div>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════
   REPORTS VIEW — AG Grid
══════════════════════════════════════════════ */
export default function ReportsView() {
  const gridRef = useRef<AgGridReact>(null)
  const [rowData, setRowData] = useState<ReportRecord[]>(initialReports)
  const [isExporting, setIsExporting] = useState(false)
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(null)

  const flash = (text: string) => { setMessage(text); setTimeout(() => setMessage(''), 3000) }

  const handleDelete = useCallback((id: number) => {
    setRowData(prev => prev.filter(r => r.id !== id))
    flash('تم حذف التقرير')
  }, [])

  const handleCreate = (title: string, _desc: string, category: string) => {
    const newR: ReportRecord = {
      id: Math.max(...rowData.map(r => r.id), 0) + 1,
      title,
      lastOperationDate: new Date().toLocaleDateString('en-US'),
      category: category || 'غير مصنف',
      totalAmount: '£0.00',
      status: 'draft',
    }
    setRowData(prev => [newR, ...prev])
    flash(`تم إنشاء التقرير "${title}" بنجاح ✓`)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows = rowData.map(r =>
        [r.lastOperationDate, r.category, r.totalAmount, STATUS_CONFIG[r.status].label].join(',')
      )
      const csv = [['تاريخ آخر عملية', 'الفئة', 'إجمالي المبلغ', 'الحالة'].join(','), ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `reports_${Date.now()}.csv`; a.style.display = 'none'
      document.body.appendChild(a); a.click(); document.body.removeChild(a)
      flash('تم تصدير التقارير بنجاح ✓')
    } catch { flash('حدث خطأ أثناء التصدير') }
    finally { setIsExporting(false) }
  }

  /* AG Grid column definitions */
  const colDefs = useMemo<ColDef<ReportRecord>[]>(() => [
    {
      headerName: '',
      field: 'id',
      width: 56,
      cellRenderer: DeleteRenderer,
      cellRendererParams: { context: { onDelete: handleDelete } },
      sortable: false, filter: false, resizable: false,
      headerCheckboxSelection: false,
      cellStyle: () => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }),
    },
    {
      headerName: 'تاريخ آخر عملية',
      field: 'lastOperationDate',
      flex: 1,
      sortable: true, filter: 'agTextColumnFilter',
      cellStyle: () => ({ color: '#64748b', fontSize: '.875rem', display: 'flex', alignItems: 'center' }),
    },
    {
      headerName: 'الفئة',
      field: 'category',
      flex: 1,
      sortable: true, filter: 'agTextColumnFilter',
      cellStyle: () => ({ fontWeight: '600', fontSize: '.875rem', display: 'flex', alignItems: 'center' }),
    },
    {
      headerName: 'إجمالي المبلغ',
      field: 'totalAmount',
      flex: 1,
      sortable: true,
      cellStyle: () => ({ fontWeight: '700', color: '#0f172a', direction: 'ltr', justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }),
    },
    {
      headerName: 'الحالة',
      field: 'status',
      flex: 1,
      sortable: true, filter: 'agTextColumnFilter',
      cellRenderer: StatusRenderer,
      cellStyle: () => ({ display: 'flex', alignItems: 'center' }),
    },
  ], [handleDelete])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    sortable: true,
    suppressMovable: false,
  }), [])

  const toastCls = message.includes('خطأ') ? 'rv-toast-err'
    : message.includes('حذف') ? 'rv-toast-del'
      : 'rv-toast-ok'

  /* ── Show detail view when a report is selected ── */
  if (selectedReport) {
    return (
      <ReportDetailView
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    )
  }

  return (
    <>
      <style>{`
        /* ── Page styles ── */
        .rv-wrap { padding: 32px 36px 48px; background: #f5f7fa; min-height: 100vh; direction: rtl; font-family: 'Cairo','Segoe UI',Tahoma,sans-serif; }
        @media(max-width:640px){ .rv-wrap { padding: 16px 14px 40px; } }
        @media(max-width:640px){ .rv-title { font-size: 1.4rem !important; } }
        .rv-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:28px; }
        .rv-title { font-size:1.9rem; font-weight:800; color:#0f1b2d; letter-spacing:-.025em; }
        .rv-btns { display:flex; gap:10px; flex-direction:row-reverse; flex-wrap:wrap; }
        .rv-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; font-family:inherit; font-size:.875rem; font-weight:600; cursor:pointer; transition:all .18s ease; white-space:nowrap; border:none; line-height:1; }
        .rv-btn:disabled { opacity:.6; cursor:not-allowed; }
        .rv-btn-blue { background:#2563eb; color:#fff; box-shadow:0 2px 10px rgba(37,99,235,.28); }
        .rv-btn-blue:not(:disabled):hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 4px 16px rgba(37,99,235,.38); }
        .rv-btn-green { background:#fff; color:#16a34a; border:1.5px solid #16a34a; }
        .rv-btn-green:not(:disabled):hover { background:#f0fdf4; transform:translateY(-1px); }
        .rv-toast { margin-bottom:16px; padding:10px 16px; border-radius:10px; font-size:.875rem; font-weight:500; animation:rvFade .22s ease; }
        .rv-toast-ok  { background:#dcfce7; color:#166534; }
        .rv-toast-err { background:#fee2e2; color:#991b1b; }
        .rv-toast-del { background:#fef9c3; color:#854d0e; }
        @keyframes rvFade { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:none} }

        /* ── AG Grid wrapper card ── */
        .rv-grid-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          box-shadow: 0 2px 14px rgba(15,27,45,.07);
          overflow: hidden;
        }

        /* ── AG Grid theme overrides ── */
        .rv-grid-card .ag-root-wrapper { border: none !important; border-radius: 0; }
        .rv-grid-card .ag-header { background: #fff !important; border-bottom: 1.5px solid #eef2f8 !important; }
        .rv-grid-card .ag-header-cell { background: #fff !important; }
        .rv-grid-card .ag-header-cell-text { font-size:.82rem; font-weight:700; color:#94a3b8; letter-spacing:.01em; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .rv-grid-card .ag-row { border-bottom: 1px solid #f1f5f9 !important; cursor: pointer; transition: background .14s; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .rv-grid-card .ag-row:hover { background: #f8fafd !important; }
        .rv-grid-card .ag-row-selected { background: #e8f0fe !important; }
        .rv-grid-card .ag-row-selected:hover { background: #dce7fd !important; }
        .rv-grid-card .ag-cell { border: none !important; font-size:.875rem; }
        .rv-grid-card .ag-sort-ascending-icon,
        .rv-grid-card .ag-sort-descending-icon { color: #2563eb; }
        .rv-grid-card .ag-paging-panel { border-top: 1px solid #f1f5f9; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; font-size:.82rem; color:#64748b; }
        .rv-grid-card .ag-checkbox-input-wrapper.ag-checked::after { color: #2563eb; }
      `}</style>

      {showModal && (
        <CreateReportModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreate}
        />
      )}

      <div className="rv-wrap">
        {/* Header */}
        <div className="rv-header">
          <h1 className="rv-title">سجل التقارير المالية</h1>
          <div className="rv-btns">
            <button className="rv-btn rv-btn-blue" onClick={() => setShowModal(true)}>
              <Plus size={16} strokeWidth={2.5} /> إنشاء تقرير
            </button>
            <button className="rv-btn rv-btn-green" onClick={handleExport} disabled={isExporting}>
              <FileSpreadsheet size={16} />
              {isExporting ? 'جاري التصدير…' : 'تصدير بصيغة إكسل'}
            </button>
          </div>
        </div>

        {message && <div className={`rv-toast ${toastCls}`}>{message}</div>}

        {/* AG Grid */}
        <div className="rv-grid-card">
          <div style={{ height: 450, width: '100%', direction: 'rtl' }}>
            <AgGridReact
              ref={gridRef}
              theme={themeQuartz}
              rowData={rowData}
              columnDefs={colDefs}
              defaultColDef={defaultColDef}
              rowSelection="multiple"
              suppressRowClickSelection={true}
              animateRows={true}
              pagination={true}
              paginationPageSize={10}
              enableRtl={true}
              context={{ onDelete: handleDelete }}
              onRowClicked={(e: RowClickedEvent<ReportRecord>) => {
                if (e.data) setSelectedReport(e.data)
              }}
              noRowsOverlayComponent={() => (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <FileSpreadsheet size={48} style={{ marginBottom: 12, opacity: .35 }} />
                  <p style={{ fontSize: '.9rem' }}>لا توجد تقارير</p>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </>
  )
}
