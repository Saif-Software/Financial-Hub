'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import {
  FileText, User, Calendar, Tag, ChevronDown,
  Trash2, Paperclip, Plus, Calculator, X, Save
} from 'lucide-react'

/* ─── Types ─────────────────────────────────── */
interface ExpenseRow {
  id: number
  date: string
  amount: string
  description: string
  attachments: string[]
}

/* ─── Static data ────────────────────────────── */
const INITIAL_ROWS: ExpenseRow[] = [
  { id: 1, date: '01/20/2024', amount: '300', description: 'شحن نت المدرسة 01252652642', attachments: ['مثال', 'مثال'] },
  { id: 2, date: '01/22/2024', amount: '', description: '', attachments: [] },
]

const CATEGORIES = ['إشتراكات نت', 'مشتريات متنوعة', 'عهدة', 'انتقالات', 'رواتب', 'صيانة']

const STATUS_CFG = {
  draft: { label: 'مسودة', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  approved: { label: 'معتمد', bg: '#dcfce7', color: '#166534', border: '#86efac' },
  submitted: { label: 'مُقدَّم', bg: '#dbeafe', color: '#1e40af', border: '#93c5fd' },
  rejected: { label: 'مرفوض', bg: '#fee2e2', color: '#991b1b', border: '#fca5a5' },
}

/* ══════════════════════════════════════════════
   AG Grid Cell Renderers for Expense Table
══════════════════════════════════════════════ */
function RowNumRenderer({ node }: ICellRendererParams) {
  return (
    <span style={{ fontSize: '.8rem', color: '#94a3b8', fontWeight: 600 }}>
      {(node.rowIndex ?? 0) + 1}
    </span>
  )
}

function DeleteRowRenderer({ data, context }: ICellRendererParams) {
  return (
    <button
      onClick={() => context.deleteRow(data.id)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      title="حذف الصف"
    >
      <Trash2 size={14} />
    </button>
  )
}

function DateCellRenderer({ data, context }: ICellRendererParams) {
  const parts = data.date ? data.date.split('/') : []
  const isoVal = parts.length === 3
    ? `${parts[2]}-${String(parts[0]).padStart(2, '0')}-${String(parts[1]).padStart(2, '0')}`
    : ''
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px' }}>
      <Calendar size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
      <input
        type="date"
        style={{ border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '.875rem', color: '#1e293b', background: 'transparent', direction: 'ltr' }}
        value={isoVal}
        onChange={e => {
          const p = e.target.value.split('-')
          context.updateRow(data.id, 'date', p.length === 3 ? `${p[1]}/${p[2]}/${p[0]}` : '')
        }}
      />
    </div>
  )
}

function AmountCellRenderer({ data, context }: ICellRendererParams) {
  return (
    <input
      type="number"
      placeholder="00.0"
      style={{ width: '100%', border: '1px solid transparent', borderRadius: 7, padding: '7px 10px', fontFamily: 'inherit', fontSize: '.875rem', color: '#1e293b', background: 'transparent', outline: 'none', direction: 'ltr', textAlign: 'left' }}
      value={data.amount}
      onChange={e => context.updateRow(data.id, 'amount', e.target.value)}
      onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.background = '#eff6ff' }}
      onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent' }}
    />
  )
}

function DescCellRenderer({ data, context }: ICellRendererParams) {
  return (
    <input
      type="text"
      placeholder="أدخل البيان..."
      style={{ width: '100%', border: '1px solid transparent', borderRadius: 7, padding: '7px 10px', fontFamily: 'inherit', fontSize: '.875rem', color: '#1e293b', background: 'transparent', outline: 'none', direction: 'rtl' }}
      value={data.description}
      onChange={e => context.updateRow(data.id, 'description', e.target.value)}
      onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.background = '#eff6ff' }}
      onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent' }}
    />
  )
}

function AttachCellRenderer({ data, context }: ICellRendererParams) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 5 }}>
      {(data.attachments as string[]).map((att: string, i: number) => (
        <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: '.75rem', color: '#475569', fontWeight: 500 }}>
          {att}
          <button
            onClick={() => context.removeAttachment(data.id, i)}
            style={{ cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', background: 'none', border: 'none', padding: 0 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
            onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
          ><X size={11} /></button>
        </span>
      ))}
      <button
        onClick={() => context.addAttachment(data.id)}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, border: '1px dashed #cbd5e1', background: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
        title="إضافة مرفق"
      ><Paperclip size={12} /></button>
    </div>
  )
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function ReportLogView() {
  const gridRef = useRef<AgGridReact>(null)
  const [title] = useState('بيانات تسوية عهدة مبلغ')
  const [status, setStatus] = useState<keyof typeof STATUS_CFG>('draft')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('إشتراكات نت')
  const [catOpen, setCatOpen] = useState(false)
  const [rows, setRows] = useState<ExpenseRow[]>(INITIAL_ROWS)
  const [saved, setSaved] = useState(false)
  const createdBy = 'أحمد يحيى'
  const createdDate = '١٥ يناير ٢٠٢٤'

  /* helpers */
  const nextId = () => Math.max(...rows.map(r => r.id), 0) + 1

  const addRow = () =>
    setRows(prev => [...prev, {
      id: nextId(),
      date: new Date().toLocaleDateString('en-CA').replace(/-/g, '/').slice(0, 10),
      amount: '', description: '', attachments: []
    }])

  const deleteRow = useCallback((id: number) =>
    setRows(prev => prev.filter(r => r.id !== id)), [])

  const updateRow = useCallback((id: number, field: keyof ExpenseRow, value: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)), [])

  const addAttachment = useCallback((id: number) => {
    const label = prompt('اسم المرفق:')
    if (label) setRows(prev => prev.map(r => r.id === id ? { ...r, attachments: [...r.attachments, label] } : r))
  }, [])

  const removeAttachment = useCallback((rowId: number, idx: number) =>
    setRows(prev => prev.map(r => r.id === rowId
      ? { ...r, attachments: r.attachments.filter((_, i) => i !== idx) }
      : r)), [])

  const totalAmount = rows.map(r => parseFloat(r.amount) || 0).reduce((a, b) => a + b, 0)
  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  const cfg = STATUS_CFG[status]

  /* AG Grid context (stable reference) */
  const gridContext = useMemo(() => ({
    deleteRow, updateRow, addAttachment, removeAttachment
  }), [deleteRow, updateRow, addAttachment, removeAttachment])

  /* AG Grid column defs */
  const expenseColDefs = useMemo<ColDef[]>(() => [
    { headerName: 'م', colId: 'rowNum', width: 54, cellRenderer: RowNumRenderer, sortable: false, filter: false, resizable: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px' }) },
    { headerName: '', colId: 'del', width: 54, cellRenderer: DeleteRowRenderer, sortable: false, filter: false, resizable: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }) },
    { headerName: 'التاريخ', field: 'date', width: 185, cellRenderer: DateCellRenderer, sortable: false, filter: false, cellStyle: () => ({ padding: '2px 4px' }) },
    { headerName: 'المبلغ', field: 'amount', width: 120, cellRenderer: AmountCellRenderer, sortable: false, filter: false, cellStyle: () => ({ padding: '2px 4px' }) },
    { headerName: 'البيان', field: 'description', flex: 1, cellRenderer: DescCellRenderer, sortable: false, filter: false, cellStyle: () => ({ padding: '2px 4px' }) },
    { headerName: 'المرفقات', field: 'attachments', width: 230, cellRenderer: AttachCellRenderer, sortable: false, filter: false, resizable: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', padding: '4px 8px' }) },
  ], [])

  return (
    <>
      <style>{`
        .slf-wrap { padding:28px 36px 48px; background:#f0f4f9; min-height:100vh; direction:rtl; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .slf-page-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; flex-wrap:wrap; gap:12px; }
        .slf-page-title { font-size:1.6rem; font-weight:800; color:#0f1b2d; letter-spacing:-.02em; }
        .slf-save-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 22px; background:#2563eb; color:#fff; border:none; border-radius:10px; font-family:inherit; font-size:.875rem; font-weight:600; cursor:pointer; box-shadow:0 2px 10px rgba(37,99,235,.28); transition:all .18s ease; }
        .slf-save-btn:hover { background:#1d4ed8; transform:translateY(-1px); }
        .slf-save-btn.saved { background:#16a34a; }
        .slf-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 2px 10px rgba(15,27,45,.06); margin-bottom:18px; overflow:visible; }
        .slf-card-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px 14px; border-bottom:1px solid #f1f5f9; gap:12px; flex-wrap:wrap; }
        .slf-card-header-left { display:flex; align-items:center; gap:10px; }
        .slf-card-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:#eff6ff; color:#2563eb; flex-shrink:0; }
        .slf-card-title { font-size:1.05rem; font-weight:700; color:#0f1b2d; }
        .slf-card-sub { font-size:.75rem; color:#94a3b8; margin-top:1px; }
        .slf-status-badge { display:inline-flex; align-items:center; padding:5px 14px; border-radius:20px; font-size:.8rem; font-weight:700; cursor:pointer; border:1.5px solid; transition:all .15s; user-select:none; }
        .slf-status-badge:hover { opacity:.85; }
        .slf-info-body { padding:20px 22px; }
        .slf-desc-input { width:100%; border:none; outline:none; font-family:inherit; font-size:.9rem; color:#334155; background:transparent; resize:none; min-height:38px; direction:rtl; margin-bottom:14px; padding-bottom:10px; border-bottom:1px dashed #e2e8f0; }
        .slf-desc-input::placeholder { color:#94a3b8; }
        .slf-field-row { display:flex; align-items:center; gap:10px; padding:11px 0; border-bottom:1px solid #f8fafc; direction:rtl; }
        .slf-field-row:last-child { border-bottom:none; }
        .slf-field-label { display:flex; align-items:center; gap:6px; font-size:.82rem; color:#64748b; font-weight:600; min-width:110px; flex-shrink:0; }
        .slf-field-label svg { color:#94a3b8; }
        .slf-cat-wrapper { position:relative; flex:1; }
        .slf-cat-btn { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:8px 12px; border:1px solid #e2e8f0; border-radius:9px; background:#f8fafc; cursor:pointer; font-family:inherit; font-size:.875rem; font-weight:600; color:#1e293b; width:100%; transition:border-color .15s; }
        .slf-cat-btn:hover { border-color:#93c5fd; background:#eff6ff; }
        .slf-cat-dropdown { position:absolute; top:calc(100% + 6px); right:0; min-width:200px; background:#fff; border:1px solid #e2e8f0; border-radius:12px; box-shadow:0 8px 24px rgba(15,27,45,.14); z-index:100; overflow:hidden; }
        .slf-cat-option { padding:10px 14px; font-size:.875rem; color:#334155; cursor:pointer; transition:background .12s; }
        .slf-cat-option:hover { background:#eff6ff; color:#1d4ed8; }
        .slf-cat-option.active { background:#dbeafe; color:#1d4ed8; font-weight:600; }
        .slf-meta-value { font-size:.875rem; font-weight:600; color:#1e293b; }

        /* AG Grid card */
        .slf-grid-card { overflow:hidden; border-radius:0 0 16px 16px; }
        .slf-add-row-wrap { display:flex; padding:12px 16px; border-top:1px solid #f1f5f9; direction:ltr; }
        .slf-add-row-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; border:1.5px dashed #2563eb; border-radius:9px; background:transparent; color:#2563eb; cursor:pointer; font-family:inherit; font-size:.84rem; font-weight:600; transition:all .16s; }
        .slf-add-row-btn:hover { background:#eff6ff; border-style:solid; }

        /* Grid theme overrides */
        .slf-exp-grid .ag-root-wrapper { border:none !important; }
        .slf-exp-grid .ag-header { background:#fafbfd !important; border-bottom:1px solid #f1f5f9 !important; }
        .slf-exp-grid .ag-header-cell { background:#fafbfd !important; }
        .slf-exp-grid .ag-header-cell-text { font-size:.78rem; font-weight:700; color:#94a3b8; letter-spacing:.02em; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .slf-exp-grid .ag-row { border-bottom:1px solid #f8fafc !important; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .slf-exp-grid .ag-row:last-child { border-bottom:none !important; }
        .slf-exp-grid .ag-row:hover { background:#fafbfd !important; }
        .slf-exp-grid .ag-cell { border:none !important; }

        /* Summary */
        .slf-summary-body { padding:20px 22px; direction:rtl; }
        .slf-sum-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f8fafc; font-size:.9rem; }
        .slf-sum-row:last-child { border-bottom:none; }
        .slf-sum-label { color:#64748b; font-weight:500; }
        .slf-sum-value { font-weight:700; color:#0f1b2d; font-variant-numeric:tabular-nums; }
        .slf-sum-total { font-size:1.05rem; padding-top:14px; margin-top:6px; border-top:2px solid #e2e8f0 !important; border-bottom:none !important; }
        .slf-sum-total .slf-sum-value { color:#2563eb; font-size:1.15rem; }

        .slf-toast { position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:#1e293b; color:#fff; padding:10px 20px; border-radius:10px; font-size:.875rem; font-weight:500; box-shadow:0 4px 16px rgba(0,0,0,.2); animation:toastIn .22s ease; z-index:999; direction:rtl; }
        @keyframes toastIn { from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)} }
      `}</style>

      <div className="slf-wrap">

        {/* Page header */}
        <div className="slf-page-header">
          <h1 className="slf-page-title">سجل التقارير المالية</h1>
          <button className={`slf-save-btn${saved ? ' saved' : ''}`} onClick={handleSave}>
            <Save size={16} />
            {saved ? 'تم الحفظ ✓' : 'حفظ التغييرات'}
          </button>
        </div>

        {/* ── Card 1: Report Info ── */}
        <div className="slf-card">
          <div className="slf-card-header">
            <div className="slf-card-header-left">
              <div className="slf-card-icon"><FileText size={18} /></div>
              <div><div className="slf-card-title">{title}</div></div>
            </div>
            <button
              className="slf-status-badge"
              style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
              onClick={() => {
                const order: (keyof typeof STATUS_CFG)[] = ['draft', 'submitted', 'approved', 'rejected']
                setStatus(order[(order.indexOf(status) + 1) % order.length])
              }}
              title="انقر للتغيير"
            >
              {cfg.label}
            </button>
          </div>
          <div className="slf-info-body">
            <textarea
              className="slf-desc-input" rows={1}
              placeholder="أضف وصفاً مختصراً (اختياري)"
              value={description} onChange={e => setDescription(e.target.value)}
            />
            <div className="slf-field-row">
              <span className="slf-field-label"><Tag size={14} />التصنيف</span>
              <div className="slf-cat-wrapper">
                <button className="slf-cat-btn" onClick={() => setCatOpen(o => !o)}>
                  <span>{category}</span>
                  <ChevronDown size={14} style={{ transform: catOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                </button>
                {catOpen && (
                  <div className="slf-cat-dropdown">
                    {CATEGORIES.map(c => (
                      <div key={c} className={`slf-cat-option${category === c ? ' active' : ''}`}
                        onClick={() => { setCategory(c); setCatOpen(false) }}>{c}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="slf-field-row" style={{ gap: 32 }}>
              <span className="slf-field-label"><User size={14} />أنشئ بواسطة</span>
              <span className="slf-meta-value">{createdBy}</span>
              <span className="slf-field-label" style={{ marginRight: 'auto' }}><Calendar size={14} />تاريخ الإنشاء</span>
              <span className="slf-meta-value">{createdDate}</span>
            </div>
          </div>
        </div>

        {/* ── Card 2: Expenses AG Grid ── */}
        <div className="slf-card">
          <div className="slf-card-header">
            <div className="slf-card-header-left">
              <div className="slf-card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                <Calculator size={18} />
              </div>
              <div>
                <div className="slf-card-title">سجل المصروفات</div>
                <div className="slf-card-sub">إضافة أو تعديل أو حذف المصروفات</div>
              </div>
            </div>
          </div>

          <div className="slf-grid-card">
            <div style={{ width: '100%', direction: 'rtl' }}>
              <AgGridReact
                ref={gridRef}
                theme={themeQuartz}
                rowData={rows}
                columnDefs={expenseColDefs}
                context={gridContext}
                domLayout="autoHeight"
                enableRtl={true}
                suppressRowClickSelection={true}
                rowHeight={52}
                headerHeight={40}
                animateRows={true}
              />
            </div>
            <div className="slf-add-row-wrap">
              <button className="slf-add-row-btn" onClick={addRow}>
                <Plus size={15} /> إضافة صف
              </button>
            </div>
          </div>
        </div>

        {/* ── Card 3: Summary ── */}
        <div className="slf-card">
          <div className="slf-card-header">
            <div className="slf-card-header-left">
              <div className="slf-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                <Calculator size={18} />
              </div>
              <div>
                <div className="slf-card-title">ملخص</div>
                <div className="slf-card-sub">المجاميع المحسوبة تلقائياً</div>
              </div>
            </div>
          </div>
          <div className="slf-summary-body">
            <div className="slf-sum-row">
              <span className="slf-sum-label">عدد الصفوف</span>
              <span className="slf-sum-value">{rows.length}</span>
            </div>
            <div className="slf-sum-row">
              <span className="slf-sum-label">صفوف مكتملة</span>
              <span className="slf-sum-value">{rows.filter(r => r.amount && r.description).length}</span>
            </div>
            <div className="slf-sum-row">
              <span className="slf-sum-label">إجمالي المرفقات</span>
              <span className="slf-sum-value">{rows.reduce((acc, r) => acc + r.attachments.length, 0)}</span>
            </div>
            <div className="slf-sum-row slf-sum-total">
              <span className="slf-sum-label" style={{ fontWeight: 700, color: '#0f1b2d' }}>إجمالي المبالغ</span>
              <span className="slf-sum-value">
                £{totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

      </div>

      {saved && <div className="slf-toast">تم حفظ التغييرات بنجاح ✓</div>}
    </>
  )
}
