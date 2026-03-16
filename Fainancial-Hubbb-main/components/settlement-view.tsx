'use client'

import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import '@/lib/ag-grid-setup'
import { Calendar, User, FileText, Paperclip, Trash2, Plus, Calculator, X, Loader2 } from 'lucide-react'
import { reportsApi, recordsApi, attachmentsApi, TransactionRecordDto, CreateReportPayload } from '@/lib/api'

/* ══════════════════════════════════════════
   صفحة "تسوية عهدة مبلغ"
   ── تعمل على تقرير موجود أو تنشئ تقرير جديد
══════════════════════════════════════════ */

interface SettlementViewProps {
  /** لو عندك report ID موجود مسبقاً مرّره هنا، وإلا هتنشئ تقرير جديد */
  reportId?: number
}

interface ExpenseRecord {
  id: number
  date: string
  amount: string
  description: string
  attachment: string
  attachmentMediaId?: number   // الـ ID في الـ DB عشان نحذفه
}

/* ── Cell Renderers ── */
function RowNumRenderer({ node }: ICellRendererParams) {
  return <span style={{ fontSize: '.8rem', color: '#94a3b8', fontWeight: 600 }}>{(node.rowIndex ?? 0) + 1}</span>
}

function DateCellRenderer({ data, context }: ICellRendererParams) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <Calendar size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
      <input
        type="date"
        style={{ border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: '.84rem', color: '#1e293b', background: 'transparent', direction: 'ltr' }}
        value={data.date}
        onChange={e => context.updateRow(data.id, 'date', e.target.value)}
        onBlur={() => context.saveRow(data)}
      />
    </div>
  )
}

function AmountCellRenderer({ data, context }: ICellRendererParams) {
  return (
    <input
      type="number" placeholder="0.00"
      style={{ width: '100%', border: '1px solid transparent', borderRadius: 7, padding: '6px 10px', fontFamily: 'inherit', fontSize: '.875rem', color: '#1e293b', background: 'transparent', outline: 'none', direction: 'ltr', textAlign: 'left' }}
      value={data.amount}
      onChange={e => context.updateRow(data.id, 'amount', e.target.value)}
      onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.background = '#eff6ff' }}
      onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent'; context.saveRow(data) }}
    />
  )
}

function DescCellRenderer({ data, context }: ICellRendererParams) {
  return (
    <input
      type="text" placeholder="أدخل البيان..."
      style={{ width: '100%', border: '1px solid transparent', borderRadius: 7, padding: '6px 10px', fontFamily: 'inherit', fontSize: '.875rem', color: '#1e293b', background: 'transparent', outline: 'none', direction: 'rtl' }}
      value={data.description}
      onChange={e => context.updateRow(data.id, 'description', e.target.value)}
      onFocus={e => { e.target.style.borderColor = '#93c5fd'; e.target.style.background = '#eff6ff' }}
      onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = 'transparent'; context.saveRow(data) }}
    />
  )
}

function AttachCellRenderer({ data, context }: ICellRendererParams) {
  if (data.attachment) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Paperclip size={13} style={{ color: '#94a3b8', flexShrink: 0 }} />
        <span style={{ fontSize: '.8rem', color: '#475569', fontWeight: 500 }}>{data.attachment}</span>
        <button
          onClick={() => context.removeAttachment(data.id, data.attachmentMediaId)}
          style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
        ><X size={12} /></button>
      </div>
    )
  }
  return (
    <button
      onClick={() => context.triggerUpload(data.id)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', border: '1px dashed #cbd5e1', borderRadius: 6, background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '.78rem', fontFamily: 'inherit', transition: 'all .15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.background = '#eff6ff' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' }}
    >
      <Paperclip size={12} /> إرفاق
    </button>
  )
}

function DeleteRowRenderer({ data, context }: ICellRendererParams) {
  return (
    <button
      onClick={() => context.deleteRow(data.id)} title="حذف الصف"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', transition: 'background .15s' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    ><Trash2 size={14} /></button>
  )
}

/* ── map API record → grid row ── */
function mapRecord(r: TransactionRecordDto): ExpenseRecord {
  const att = r.attachments[0]
  return {
    id: r.id,
    date: r.transactionDate ?? '',
    amount: String(r.amount ?? 0),
    description: r.description ?? '',
    attachment: att ? (att.filePath?.split('/').pop()?.slice(37) || 'مرفق') : '',
    attachmentMediaId: att?.id,
  }
}

export default function SettlementView({ reportId }: SettlementViewProps) {
  const gridRef             = useRef<AgGridReact>(null)
  const fileInputRef        = useRef<HTMLInputElement>(null)
  const pendingRowId        = useRef<number | null>(null)

  const [currentReportId, setCurrentReportId] = useState<number | null>(reportId ?? null)
  const [description, setDescription]         = useState('')
  const [category, setCategory]               = useState('custody')
  const [expenses, setExpenses]               = useState<ExpenseRecord[]>([])
  const [loading, setLoading]                 = useState(true)
  const [isSaving, setIsSaving]               = useState(false)
  const [msgText, setMsg]                     = useState('')

  const flash = (msg: string) => { setMsg(msg); setTimeout(() => setMsg(''), 3000) }

  // ── تهيئة: إنشاء تقرير جديد أو جلب موجود ──────
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        let rid = currentReportId

        if (!rid) {
          // إنشاء تقرير جديد من نوع "تسوية عهدة"
          const payload: CreateReportPayload = {
            reportName: 'تسوية عهدة مبلغ',
            creatorAccountId: 1,   // ← غيّره بعد إضافة Auth
          }
          const created = await reportsApi.create(payload)
          rid = created.id
          setCurrentReportId(rid)
        }

        const records = await recordsApi.getAll(rid)
        setExpenses(records.map(mapRecord))
      } catch (e: unknown) {
        flash(e instanceof Error ? e.message : 'فشل تحميل البيانات')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // ── إضافة صف ────────────────────────────────────
  const addRow = async () => {
    if (!currentReportId) return
    try {
      const created = await recordsApi.create(currentReportId, {
        transactionReportId: currentReportId,
        transactionDate: new Date().toISOString().split('T')[0],
        amount: 0,
        description: '',
      })
      setExpenses(prev => [...prev, mapRecord(created)])
      flash('تمت إضافة صف جديد')
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'فشل إضافة صف')
    }
  }

  // ── حذف صف ──────────────────────────────────────
  const deleteRow = useCallback(async (id: number) => {
    if (!currentReportId) return
    if (expenses.length <= 1) { flash('لا يمكن حذف جميع الصفوف'); return }
    try {
      await recordsApi.delete(currentReportId, id)
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'فشل الحذف')
    }
  }, [currentReportId, expenses.length])

  // ── تعديل قيمة محلياً ───────────────────────────
  const updateRow = useCallback((id: number, field: keyof ExpenseRecord, value: string) =>
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e)), [])

  // ── حفظ صف للـ API (onBlur) ─────────────────────
  const saveRow = useCallback(async (row: ExpenseRecord) => {
    if (!currentReportId) return
    try {
      await recordsApi.update(currentReportId, row.id, {
        transactionDate: row.date || undefined,
        amount: parseFloat(row.amount) || 0,
        description: row.description,
      })
    } catch (e) { console.error('save row', e) }
  }, [currentReportId])

  // ── رفع مرفق ────────────────────────────────────
  const triggerUpload = useCallback((id: number) => {
    pendingRowId.current = id
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !pendingRowId.current || !currentReportId) return
    const rowId = pendingRowId.current
    try {
      const media = await attachmentsApi.upload(currentReportId, rowId, file)
      setExpenses(prev => prev.map(r => r.id === rowId ? {
        ...r,
        attachment: file.name,
        attachmentMediaId: media.id,
      } : r))
      flash('تم رفع المرفق بنجاح')
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'فشل رفع الملف')
    } finally {
      pendingRowId.current = null
      e.target.value = ''
    }
  }

  // ── حذف مرفق ────────────────────────────────────
  const removeAttachment = useCallback(async (rowId: number, mediaId?: number) => {
    if (mediaId) {
      try { await attachmentsApi.delete(mediaId) } catch (e) { console.error(e) }
    }
    updateRow(rowId, 'attachment', '')
    setExpenses(prev => prev.map(r => r.id === rowId ? { ...r, attachmentMediaId: undefined } : r))
  }, [updateRow])

  // ── حفظ الكل ────────────────────────────────────
  const handleSave = async () => {
    if (!currentReportId) return
    setIsSaving(true)
    try {
      await reportsApi.update(currentReportId, { notes: description })
      await Promise.all(expenses.map(e => recordsApi.update(currentReportId, e.id, {
        transactionDate: e.date || undefined,
        amount: parseFloat(e.amount) || 0,
        description: e.description,
      })))
      flash('تم حفظ البيانات بنجاح!')
    } catch (e: unknown) {
      flash(e instanceof Error ? e.message : 'فشل الحفظ')
    } finally {
      setIsSaving(false)
    }
  }

  // ── تصدير CSV ───────────────────────────────────
  const handleExport = () => {
    const csv = [
      ['م', 'التاريخ', 'المبلغ', 'البيان', 'المرفقات'].join(','),
      ...expenses.map((e, i) => [i + 1, e.date, e.amount, e.description, e.attachment || ''].join(',')),
    ].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = Object.assign(document.createElement('a'), { href: url, download: `expenses_${Date.now()}.csv`, style: 'display:none' })
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
    flash('تم تصدير البيانات بنجاح')
  }

  const totalExpenses = expenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
  const gridContext   = useMemo(() => ({ deleteRow, updateRow, saveRow, triggerUpload, removeAttachment }), [deleteRow, updateRow, saveRow, triggerUpload, removeAttachment])

  const colDefs = useMemo<ColDef<ExpenseRecord>[]>(() => [
    { headerName: 'م', colId: 'rowNum', width: 56, cellRenderer: RowNumRenderer, sortable: false, filter: false, resizable: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }) },
    { headerName: 'التاريخ', field: 'date', width: 190, cellRenderer: DateCellRenderer, sortable: false, filter: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', padding: '2px 8px' }) },
    { headerName: 'المبلغ', field: 'amount', width: 120, cellRenderer: AmountCellRenderer, sortable: false, filter: false, cellStyle: () => ({ padding: '2px 4px' }) },
    { headerName: 'البيان', field: 'description', flex: 1, cellRenderer: DescCellRenderer, sortable: false, filter: false, cellStyle: () => ({ padding: '2px 4px' }) },
    { headerName: 'المرفقات', field: 'attachment', width: 160, cellRenderer: AttachCellRenderer, sortable: false, filter: false, resizable: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', padding: '4px 8px' }) },
    { headerName: '', colId: 'del', width: 52, cellRenderer: DeleteRowRenderer, sortable: false, filter: false, resizable: false, cellStyle: () => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }) },
  ], [])

  const defaultColDef = useMemo<ColDef>(() => ({ resizable: true }), [])
  const isOk  = msgText.includes('نجاح') || msgText.includes('جديد')
  const isErr = msgText.includes('خطأ') || msgText.includes('لا يمكن') || msgText.includes('فشل')

  return (
    <>
      <style>{`
        .sv-wrap{padding:28px 36px 60px;background:#f5f7fa;min-height:100vh;direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,sans-serif}
        @media(max-width:640px){.sv-wrap{padding:16px 14px 48px}}
        .sv-page-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px;flex-wrap:wrap;gap:12px}
        .sv-page-title{font-size:1.7rem;font-weight:800;color:#0f1b2d;letter-spacing:-.025em}
        @media(max-width:640px){.sv-page-title{font-size:1.3rem}}
        .sv-save-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 22px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:600;cursor:pointer;box-shadow:0 2px 10px rgba(37,99,235,.28);transition:all .18s ease}
        .sv-save-btn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px)}
        .sv-save-btn:disabled{opacity:.6;cursor:not-allowed}
        .sv-toast{margin-bottom:18px;padding:10px 16px;border-radius:10px;font-size:.875rem;font-weight:500;animation:svFade .22s ease}
        .sv-toast-ok{background:#dcfce7;color:#166534}
        .sv-toast-err{background:#fee2e2;color:#991b1b}
        .sv-toast-info{background:#dbeafe;color:#1e40af}
        @keyframes svFade{from{opacity:0;transform:translateY(-5px)}to{opacity:1;transform:none}}
        .sv-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 2px 12px rgba(15,27,45,.06);margin-bottom:18px;overflow:hidden}
        .sv-card-hd{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid #f1f5f9;flex-wrap:wrap;gap:10px}
        .sv-card-hd-l{display:flex;align-items:center;gap:10px}
        .sv-card-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .sv-card-title{font-size:1rem;font-weight:700;color:#0f1b2d}
        .sv-card-sub{font-size:.75rem;color:#94a3b8;margin-top:1px}
        .sv-status-badge{display:inline-flex;align-items:center;padding:5px 14px;border-radius:20px;font-size:.8rem;font-weight:700;background:#f1f5f9;color:#475569;border:1.5px solid #cbd5e1}
        .sv-body{padding:20px 22px}
        .sv-desc-input{width:100%;border:none;outline:none;font-family:inherit;font-size:.9rem;color:#334155;background:transparent;resize:none;min-height:36px;direction:rtl;margin-bottom:14px;padding-bottom:10px;border-bottom:1px dashed #e2e8f0;box-sizing:border-box}
        .sv-desc-input::placeholder{color:#94a3b8}
        .sv-meta-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f8fafc;flex-wrap:wrap}
        .sv-meta-row:last-child{border-bottom:none}
        .sv-meta-label{display:flex;align-items:center;gap:6px;font-size:.82rem;color:#64748b;font-weight:600;min-width:110px;flex-shrink:0}
        .sv-meta-label svg{color:#94a3b8}
        .sv-meta-val{font-size:.875rem;font-weight:600;color:#1e293b}
        .sv-cat-sel{padding:7px 12px;border:1px solid #e2e8f0;border-radius:9px;background:#f8fafc;font-family:inherit;font-size:.875rem;color:#1e293b;outline:none;transition:border-color .15s}
        .sv-cat-sel:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .sv-grid-card .ag-root-wrapper{border:none !important}
        .sv-grid-card .ag-header{background:#fafbfd !important;border-bottom:1px solid #f1f5f9 !important}
        .sv-grid-card .ag-header-cell{background:#fafbfd !important}
        .sv-grid-card .ag-header-cell-text{font-size:.78rem;font-weight:700;color:#94a3b8;letter-spacing:.02em;font-family:'Cairo','Segoe UI',Tahoma,sans-serif}
        .sv-grid-card .ag-row{border-bottom:1px solid #f8fafc !important;font-family:'Cairo','Segoe UI',Tahoma,sans-serif}
        .sv-grid-card .ag-row:hover{background:#fafbfd !important}
        .sv-grid-card .ag-cell{border:none !important}
        .sv-grid-footer{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-top:1px solid #f1f5f9;flex-wrap:wrap;gap:10px}
        .sv-add-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1.5px dashed #2563eb;border-radius:9px;background:transparent;color:#2563eb;cursor:pointer;font-family:inherit;font-size:.84rem;font-weight:600;transition:all .16s}
        .sv-add-btn:hover{background:#eff6ff;border-style:solid}
        .sv-export-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border:1.5px solid #16a34a;border-radius:9px;background:transparent;color:#16a34a;cursor:pointer;font-family:inherit;font-size:.84rem;font-weight:600;transition:all .16s}
        .sv-export-btn:hover{background:#f0fdf4}
        .sv-sum-body{padding:20px 22px;direction:rtl}
        .sv-sum-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        @media(max-width:700px){.sv-sum-cards{grid-template-columns:1fr 1fr}}
        .sv-sum-card{background:#f8fafc;border:1px solid #f1f5f9;border-radius:12px;padding:14px 16px}
        .sv-sum-lbl{font-size:.78rem;color:#94a3b8;font-weight:500;margin-bottom:4px}
        .sv-sum-val{font-size:1.2rem;font-weight:800;color:#0f1b2d;font-variant-numeric:tabular-nums}
        .sv-sum-val.blue{color:#2563eb}
        .sv-loading{display:flex;justify-content:center;padding:40px}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="sv-wrap">
        <div className="sv-page-header">
          <h1 className="sv-page-title">تسوية عهدة مبلغ</h1>
          <button className="sv-save-btn" onClick={handleSave} disabled={isSaving || loading}>
            {isSaving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> جاري الحفظ...</>
              : 'حفظ البيانات'
            }
          </button>
        </div>

        {msgText && (
          <div className={`sv-toast ${isErr ? 'sv-toast-err' : isOk ? 'sv-toast-ok' : 'sv-toast-info'}`}>
            {msgText}
          </div>
        )}

        {/* ── بيانات التقرير ── */}
        <div className="sv-card">
          <div className="sv-card-hd">
            <div className="sv-card-hd-l">
              <div className="sv-card-ico" style={{ background: '#eff6ff', color: '#2563eb' }}><FileText size={18} /></div>
              <div>
                <div className="sv-card-title">بيانات تسوية عهدة مبلغ</div>
              </div>
            </div>
            <span className="sv-status-badge">مسودة</span>
          </div>
          <div className="sv-body">
            <textarea
              className="sv-desc-input" rows={1}
              placeholder="أضف وصفاً مختصراً (اختياري)"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <div className="sv-meta-row">
              <span className="sv-meta-label">التصنيف</span>
              <select className="sv-cat-sel" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="internet">إشتراكات نت</option>
                <option value="misc">مشتريات متنوعة</option>
                <option value="custody">عهدة</option>
                <option value="other">أخرى</option>
              </select>
            </div>
            <div className="sv-meta-row">
              <span className="sv-meta-label"><User size={14} />أنشئ بواسطة</span>
              <span className="sv-meta-val">أحمد يحيى</span>
              <span className="sv-meta-label" style={{ marginRight: 'auto' }}><Calendar size={14} />تاريخ الإنشاء</span>
              <span className="sv-meta-val">{new Date().toLocaleDateString('ar-EG')}</span>
            </div>
          </div>
        </div>

        {/* ── جدول المصروفات ── */}
        <div className="sv-card">
          <div className="sv-card-hd">
            <div className="sv-card-hd-l">
              <div className="sv-card-ico" style={{ background: '#f0fdf4', color: '#16a34a' }}><Calculator size={18} /></div>
              <div>
                <div className="sv-card-title">سجل المصروفات</div>
                <div className="sv-card-sub">إضافة أو تعديل أو حذف المصروفات</div>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="sv-loading">
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', color: '#2563eb' }} />
            </div>
          ) : (
            <div className="sv-grid-card" style={{ width: '100%', direction: 'rtl' }}>
              <AgGridReact
                ref={gridRef}
                theme={themeQuartz}
                rowData={expenses}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                context={gridContext}
                domLayout="autoHeight"
                enableRtl={true}
                suppressRowClickSelection={true}
                animateRows={true}
                rowHeight={52}
                headerHeight={40}
              />
            </div>
          )}

          <div className="sv-grid-footer">
            <button className="sv-add-btn" onClick={addRow} disabled={loading}>
              <Plus size={15} /> إضافة صف
            </button>
            <button className="sv-export-btn" onClick={handleExport}>
              <FileText size={15} /> تصدير CSV
            </button>
          </div>
        </div>

        {/* ── ملخص ── */}
        <div className="sv-card">
          <div className="sv-card-hd">
            <div className="sv-card-hd-l">
              <div className="sv-card-ico" style={{ background: '#fef3c7', color: '#d97706' }}><Calculator size={18} /></div>
              <div>
                <div className="sv-card-title">ملخص</div>
                <div className="sv-card-sub">المجاميع المحسوبة تلقائياً</div>
              </div>
            </div>
          </div>
          <div className="sv-sum-body">
            <div className="sv-sum-cards">
              <div className="sv-sum-card">
                <div className="sv-sum-lbl">إجمالي المصروفات</div>
                <div className="sv-sum-val blue">£{totalExpenses.toFixed(2)}</div>
              </div>
              <div className="sv-sum-card">
                <div className="sv-sum-lbl">عدد البنود</div>
                <div className="sv-sum-val">{expenses.length}</div>
              </div>
              <div className="sv-sum-card">
                <div className="sv-sum-lbl">المتبقي</div>
                <div className="sv-sum-val">{(300 - totalExpenses).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input للمرفقات */}
      <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileChange} />
    </>
  )
}
