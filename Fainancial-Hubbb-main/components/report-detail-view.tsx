'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ArrowRight, FileText, Tag, Calendar, User, Plus, Trash2, Paperclip, X, ChevronDown, Save, CheckCircle, Loader2, Edit2 } from 'lucide-react'
import { recordsApi, attachmentsApi, reportsApi, TransactionRecordDto, UpdateRecordPayload, UpdateReportPayload } from '@/lib/api'

interface ExpenseRow {
  id: number; date: string; amount: number; description: string
  tags: string[]; attachments: { id: number; filePath: string | null }[]; _dirty?: boolean
}

interface ReportDetailProps {
  report: { id: number; title: string; category: string; status: string; lastOperationDate: string; totalAmount: string }
  onBack: () => void
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  completed: { label: 'مكتمل',        bg: '#f0fdfa', color: '#0d9488', border: '#99f6e4' },
  approved:  { label: 'معتمد',        bg: '#f0fdf4', color: '#16a34a', border: '#86efac' },
  rejected:  { label: 'مرفوض',        bg: '#fff1f2', color: '#e11d48', border: '#fda4af' },
  review:    { label: 'قيد المراجعة', bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  deleted:   { label: 'محذوف',        bg: '#f9fafb', color: '#9ca3af', border: '#d1d5db' },
  draft:     { label: 'مسودّة',       bg: '#f8fafc', color: '#94a3b8', border: '#cbd5e1' },
}
const CATEGORIES = ['إشتراكات نت', 'مشتريات متنوعة', 'عهدة', 'انتقالات', 'رواتب', 'صيانة']
const SAMPLE_TAGS = ['فاتورة', 'إيصال', 'عقد', 'أخرى']

function mapRecord(r: TransactionRecordDto): ExpenseRow {
  return { id: r.id, date: r.transactionDate ?? '', amount: r.amount ?? 0, description: r.description ?? '', tags: [], attachments: r.attachments, _dirty: false }
}

export default function ReportDetailView({ report, onBack }: ReportDetailProps) {
  const [title, setTitle]           = useState(report.title)
  const [description, setDesc]      = useState('')
  const [category, setCategory]     = useState(report.category !== 'غير مصنف' ? report.category : '')
  const [catOpen, setCatOpen]       = useState(false)
  const [saved, setSaved]           = useState(false)
  const [saving, setSaving]         = useState(false)
  const [rows, setRows]             = useState<ExpenseRow[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [tagOpenId, setTagOpenId]   = useState<number | null>(null)

  const fileInputRef    = useRef<HTMLInputElement>(null)
  const pendingRecordId = useRef<number | null>(null)
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.draft
  const total = rows.reduce((s, r) => s + (r.amount || 0), 0)

  // ── جلب البنود ─────────────────────────────────
  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true); setError('')
        const records = await recordsApi.getAll(report.id)
        setRows(records.map(mapRecord))
      } catch (e: unknown) { setError(e instanceof Error ? e.message : 'فشل التحميل') }
      finally { setLoading(false) }
    })()
  }, [report.id])

  // ── إضافة بند ──────────────────────────────────
  const addRow = async () => {
    try {
      const created = await recordsApi.create(report.id, { transactionReportId: report.id, transactionDate: new Date().toISOString().split('T')[0], amount: 0, description: '' })
      setRows(prev => [...prev, mapRecord(created)])
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'فشل إضافة بند') }
  }

  // ── حذف بند ────────────────────────────────────
  const deleteRow = useCallback(async (id: number) => {
    try {
      await recordsApi.delete(report.id, id)
      setRows(prev => prev.filter(r => r.id !== id))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'فشل الحذف') }
  }, [report.id])

  // ── تعديل قيمة محلياً ──────────────────────────
  const updateRow = useCallback((id: number, field: keyof ExpenseRow, value: string | number) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value, _dirty: true } : r))
  }, [])

  // ── حفظ بند للـ API عند الخروج من الخانة ───────
  const saveRow = useCallback(async (row: ExpenseRow) => {
    if (!row._dirty) return
    const payload: UpdateRecordPayload = { transactionDate: row.date || undefined, amount: row.amount, description: row.description }
    try {
      const updated = await recordsApi.update(report.id, row.id, payload)
      setRows(prev => prev.map(r => r.id === row.id ? { ...mapRecord(updated), tags: r.tags, _dirty: false } : r))
    } catch (e) { console.error('save row', e) }
  }, [report.id])

  const addTag    = useCallback((id: number, tag: string) => { setRows(prev => prev.map(r => r.id === id && !r.tags.includes(tag) ? { ...r, tags: [...r.tags, tag] } : r)); setTagOpenId(null) }, [])
  const removeTag = useCallback((id: number, tag: string) => { setRows(prev => prev.map(r => r.id === id ? { ...r, tags: r.tags.filter(t => t !== tag) } : r)) }, [])

  // ── رفع مرفق ───────────────────────────────────
  const handleFileUpload = async (file: File) => {
    if (!pendingRecordId.current) return
    const rid = pendingRecordId.current
    try {
      const media = await attachmentsApi.upload(report.id, rid, file)
      setRows(prev => prev.map(r => r.id === rid ? { ...r, attachments: [...r.attachments, media] } : r))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'فشل رفع الملف') }
    finally { pendingRecordId.current = null }
  }

  // ── حذف مرفق ───────────────────────────────────
  const deleteAttachment = async (recordId: number, mediaId: number) => {
    try {
      await attachmentsApi.delete(mediaId)
      setRows(prev => prev.map(r => r.id === recordId ? { ...r, attachments: r.attachments.filter(a => a.id !== mediaId) } : r))
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'فشل حذف المرفق') }
  }

  // ── حفظ التقرير ────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(rows.filter(r => r._dirty).map(saveRow))
      const payload: UpdateReportPayload = { reportName: title, notes: description || undefined }
      await reportsApi.update(report.id, payload)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
    } catch (e: unknown) { alert(e instanceof Error ? e.message : 'فشل الحفظ') }
    finally { setSaving(false) }
  }

  return (
    <>
      <style>{`
        .rd-wrap{padding:24px 28px 60px;background:#f5f7fa;min-height:100vh;direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,sans-serif}
        @media(max-width:640px){.rd-wrap{padding:16px 12px 60px}}
        .rd-back{display:inline-flex;align-items:center;gap:8px;color:#64748b;font-size:.875rem;font-weight:600;cursor:pointer;border:none;background:none;padding:6px 10px 6px 0;border-radius:8px;transition:color .15s;margin-bottom:20px}
        .rd-back:hover{color:#2563eb}
        .rd-hcard{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 2px 14px rgba(15,27,45,.06);padding:24px 28px;margin-bottom:18px}
        .rd-htop{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:18px;flex-wrap:wrap}
        .rd-badge{display:inline-flex;align-items:center;padding:5px 14px;border-radius:20px;font-size:.8rem;font-weight:700;border:1.5px solid;white-space:nowrap}
        .rd-meta{display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .rd-meta-item{display:flex;align-items:center;gap:6px;font-size:.83rem;color:#64748b}
        .rd-meta-item svg{color:#94a3b8}
        .rd-meta-val{font-weight:600;color:#334155}
        .rd-divider{border:none;border-top:1px solid #f1f5f9;margin:18px 0}
        .rd-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:640px){.rd-grid{grid-template-columns:1fr}}
        .rd-fg{display:flex;flex-direction:column;gap:6px}
        .rd-fg.full{grid-column:1/-1}
        .rd-lbl{font-size:.8rem;font-weight:700;color:#94a3b8;letter-spacing:.04em;text-transform:uppercase}
        .rd-inp{padding:9px 13px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.9rem;color:#0f1b2d;outline:none;direction:rtl;transition:border-color .15s;background:#fff}
        .rd-inp:focus{border-color:#93c5fd;box-shadow:0 0 0 3px rgba(147,197,253,.2)}
        .rd-inp::placeholder{color:#cbd5e1}
        .rd-catw{position:relative}
        .rd-catb{width:100%;padding:9px 13px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.9rem;color:#0f1b2d;cursor:pointer;direction:rtl;display:flex;align-items:center;justify-content:space-between;background:#fff;transition:border-color .15s}
        .rd-catb:hover{border-color:#93c5fd}
        .rd-catdd{position:absolute;top:calc(100% + 4px);right:0;left:0;background:#fff;border:1px solid #e2e8f0;border-radius:12px;box-shadow:0 8px 24px rgba(15,27,45,.12);z-index:200;overflow:hidden}
        .rd-catop{padding:10px 14px;font-size:.875rem;color:#334155;cursor:pointer;transition:background .12s}
        .rd-catop:hover{background:#eff6ff;color:#1d4ed8}
        .rd-catop.act{background:#dbeafe;color:#1d4ed8;font-weight:600}
        .rd-srow{display:flex;justify-content:flex-start;margin-top:18px}
        .rd-sbtn{display:inline-flex;align-items:center;gap:7px;padding:9px 22px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;transition:all .17s;box-shadow:0 2px 8px rgba(37,99,235,.25)}
        .rd-sbtn:hover:not(:disabled){background:#1d4ed8;transform:translateY(-1px)}
        .rd-sbtn:disabled{background:#e2e8f0;color:#94a3b8;cursor:not-allowed;box-shadow:none}
        .rd-success{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;background:#dcfce7;color:#166534;border-radius:10px;font-size:.875rem;font-weight:600}
        .rd-tcard{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 2px 14px rgba(15,27,45,.06);overflow:hidden}
        .rd-thdr{display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid #f1f5f9}
        .rd-ttitle{font-size:1rem;font-weight:700;color:#0f1b2d;display:flex;align-items:center;gap:8px}
        .rd-addbtn{display:inline-flex;align-items:center;gap:6px;padding:7px 16px;background:#eff6ff;color:#2563eb;border:none;border-radius:9px;font-family:inherit;font-size:.83rem;font-weight:700;cursor:pointer;transition:all .15s}
        .rd-addbtn:hover{background:#dbeafe}
        .rd-twrap{overflow-x:auto}
        .rd-table{width:100%;border-collapse:collapse;min-width:700px}
        .rd-thead th{padding:10px 14px;font-size:.76rem;font-weight:700;color:#94a3b8;text-align:right;border-bottom:1px solid #f1f5f9;background:#fafafa;white-space:nowrap}
        .rd-tbody tr{border-bottom:1px solid #f8fafc;transition:background .12s}
        .rd-tbody tr:last-child{border-bottom:none}
        .rd-tbody tr:hover{background:#fafcff}
        .rd-tbody td{padding:8px 14px;vertical-align:middle}
        .rd-num{font-size:.8rem;color:#94a3b8;font-weight:600;text-align:center}
        .rd-ci{width:100%;border:1px solid transparent;border-radius:7px;padding:6px 10px;font-family:inherit;font-size:.85rem;color:#1e293b;background:transparent;outline:none;direction:rtl;transition:border-color .15s,background .15s}
        .rd-ci:focus{border-color:#93c5fd;background:#eff6ff}
        .rd-amt{width:90px;text-align:left;direction:ltr}
        .rd-amt-pos{color:#16a34a;font-weight:700}
        .rd-amt-zero{color:#94a3b8}
        .rd-tags{display:flex;flex-wrap:wrap;gap:4px;align-items:center}
        .rd-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;background:#eff6ff;color:#1d4ed8;border-radius:20px;font-size:.75rem;font-weight:600}
        .rd-tagx{display:inline-flex;cursor:pointer;color:#93c5fd}
        .rd-tagx:hover{color:#1d4ed8}
        .rd-tagadd{display:inline-flex;align-items:center;gap:3px;padding:3px 8px;background:transparent;border:1.5px dashed #cbd5e1;color:#94a3b8;border-radius:20px;font-size:.75rem;font-weight:600;cursor:pointer;transition:all .15s;position:relative}
        .rd-tagadd:hover{border-color:#2563eb;color:#2563eb}
        .rd-tagdd{position:absolute;top:calc(100% + 4px);right:0;background:#fff;border:1px solid #e2e8f0;border-radius:10px;box-shadow:0 6px 20px rgba(15,27,45,.1);z-index:100;overflow:hidden;min-width:110px}
        .rd-tagop{padding:8px 12px;font-size:.82rem;color:#334155;cursor:pointer;transition:background .12s}
        .rd-tagop:hover{background:#eff6ff;color:#1d4ed8}
        .rd-atts{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
        .rd-attlink{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:#f8fafc;color:#475569;border-radius:8px;font-size:.78rem;font-weight:500;text-decoration:none;border:1px solid #e2e8f0;transition:background .13s}
        .rd-attlink:hover{background:#eff6ff;color:#1d4ed8}
        .rd-attbtn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;background:transparent;border:1.5px dashed #cbd5e1;color:#94a3b8;border-radius:8px;font-size:.78rem;font-weight:600;cursor:pointer;transition:all .15s}
        .rd-attbtn:hover{border-color:#2563eb;color:#2563eb}
        .rd-delbtn{display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:7px;border:none;background:transparent;color:#ef4444;cursor:pointer;transition:background .13s}
        .rd-delbtn:hover{background:#fee2e2}
        .rd-footer{display:flex;align-items:center;justify-content:flex-end;padding:16px 22px;border-top:1px solid #f1f5f9;background:#fafafa;gap:16px}
        .rd-total-lbl{font-size:.85rem;font-weight:600;color:#64748b}
        .rd-total{font-size:1.15rem;font-weight:800;color:#0f1b2d}
        .rd-total.pos{color:#16a34a}
        .rd-err{background:#fee2e2;color:#991b1b;border-radius:12px;padding:12px 18px;margin-bottom:16px;font-size:.875rem}
        .rd-loading{display:flex;justify-content:center;padding:40px}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      <div className="rd-wrap">
        <button className="rd-back" onClick={onBack}><ArrowRight size={16} /> العودة للتقارير</button>

        {/* ── Header Card ── */}
        <div className="rd-hcard">
          <div className="rd-htop">
            <div>
              <h2 style={{fontSize:'1.3rem',fontWeight:800,color:'#0f1b2d',marginBottom:8}}>{report.title}</h2>
              <div className="rd-meta">
                <span className="rd-meta-item"><User size={13}/><span className="rd-meta-val">أحمد يحيى</span></span>
                <span className="rd-meta-item"><Calendar size={13}/><span className="rd-meta-val">{new Date().toLocaleDateString('ar-EG',{year:'numeric',month:'long',day:'numeric'})}</span></span>
              </div>
            </div>
            <span className="rd-badge" style={{background:cfg.bg,color:cfg.color,borderColor:cfg.border}}>{cfg.label}</span>
          </div>
          <hr className="rd-divider"/>
          <div className="rd-grid">
            <div className="rd-fg">
              <label className="rd-lbl">عنوان التقرير</label>
              <input className="rd-inp" value={title} onChange={e=>setTitle(e.target.value)} placeholder="عنوان التقرير"/>
            </div>
            <div className="rd-fg">
              <label className="rd-lbl">التصنيف</label>
              <div className="rd-catw">
                <button className="rd-catb" onClick={()=>setCatOpen(o=>!o)} type="button">
                  <span style={{color:category?'#0f1b2d':'#cbd5e1'}}>{category||'اختر تصنيفاً...'}</span>
                  <ChevronDown size={14} style={{flexShrink:0,transition:'transform .2s',transform:catOpen?'rotate(180deg)':'none'}}/>
                </button>
                {catOpen && <div className="rd-catdd">{CATEGORIES.map(c=><div key={c} className={`rd-catop${category===c?' act':''}`} onClick={()=>{setCategory(c);setCatOpen(false)}}>{c}</div>)}</div>}
              </div>
            </div>
            <div className="rd-fg full">
              <label className="rd-lbl">الوصف</label>
              <input className="rd-inp" value={description} onChange={e=>setDesc(e.target.value)} placeholder="وصف مختصر..."/>
            </div>
          </div>
          <div className="rd-srow">
            {saved
              ? <span className="rd-success"><CheckCircle size={15}/> تم الحفظ بنجاح</span>
              : <button className="rd-sbtn" onClick={handleSave} disabled={saving}>
                  {saving?<><Loader2 size={14} style={{animation:'spin 1s linear infinite'}}/> جاري الحفظ...</>:<><Save size={14}/> حفظ التغييرات</>}
                </button>
            }
          </div>
        </div>

        {error && <div className="rd-err">⚠️ {error}</div>}

        {/* ── جدول البنود ── */}
        <div className="rd-tcard">
          <div className="rd-thdr">
            <span className="rd-ttitle"><FileText size={17}/> بنود التقرير ({rows.length})</span>
            <button className="rd-addbtn" onClick={addRow}><Plus size={14} strokeWidth={2.5}/> إضافة بند</button>
          </div>

          <div className="rd-twrap">
            {loading ? (
              <div className="rd-loading"><Loader2 size={28} style={{animation:'spin 1s linear infinite',color:'#2563eb'}}/></div>
            ) : (
              <table className="rd-table">
                <thead className="rd-thead">
                  <tr>
                    <th style={{width:46,textAlign:'center'}}>#</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>البيان</th>
                    <th>الوسوم</th>
                    <th>المرفقات</th>
                    <th style={{width:44}}></th>
                  </tr>
                </thead>
                <tbody className="rd-tbody">
                  {rows.length === 0 ? (
                    <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'#94a3b8',fontSize:'.9rem'}}>لا توجد بنود — اضغط «إضافة بند» للبدء</td></tr>
                  ) : rows.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="rd-num">{idx+1}</td>
                      <td>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <Calendar size={13} style={{color:'#94a3b8',flexShrink:0}}/>
                          <input type="date" className="rd-ci" style={{direction:'ltr',width:130}} value={row.date} onChange={e=>updateRow(row.id,'date',e.target.value)} onBlur={()=>saveRow(row)}/>
                        </div>
                      </td>
                      <td>
                        <input type="number" className={`rd-ci rd-amt ${row.amount>0?'rd-amt-pos':'rd-amt-zero'}`} placeholder="0.00" value={row.amount||''} onChange={e=>updateRow(row.id,'amount',parseFloat(e.target.value)||0)} onBlur={()=>saveRow(row)}/>
                      </td>
                      <td>
                        <input type="text" className="rd-ci" style={{minWidth:160}} placeholder="أدخل البيان..." value={row.description} onChange={e=>updateRow(row.id,'description',e.target.value)} onBlur={()=>saveRow(row)}/>
                      </td>
                      <td>
                        <div className="rd-tags">
                          {row.tags.map(tag=>(
                            <span key={tag} className="rd-tag"><Tag size={10}/>{tag}<span className="rd-tagx" onClick={()=>removeTag(row.id,tag)}><X size={10}/></span></span>
                          ))}
                          <div className="rd-tagadd" onClick={()=>setTagOpenId(tagOpenId===row.id?null:row.id)}>
                            <Plus size={10}/> وسم
                            {tagOpenId===row.id && (
                              <div className="rd-tagdd">
                                {SAMPLE_TAGS.map(t=><div key={t} className="rd-tagop" onClick={e=>{e.stopPropagation();addTag(row.id,t)}}>{t}</div>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="rd-atts">
                          {row.attachments.map(att=>(
                            <div key={att.id} style={{display:'flex',alignItems:'center',gap:3}}>
                              <a href={attachmentsApi.fullUrl(att.filePath??'')} target="_blank" rel="noreferrer" className="rd-attlink">
                                <Paperclip size={11}/>{att.filePath?.split('/').pop()?.slice(37)||'مرفق'}
                              </a>
                              <button style={{border:'none',background:'none',cursor:'pointer',color:'#ef4444',padding:2}} onClick={()=>deleteAttachment(row.id,att.id)}><X size={11}/></button>
                            </div>
                          ))}
                          <button className="rd-attbtn" onClick={()=>{pendingRecordId.current=row.id;fileInputRef.current?.click()}}>
                            <Paperclip size={11}/> رفع
                          </button>
                        </div>
                      </td>
                      <td>
                        <button className="rd-delbtn" onClick={()=>deleteRow(row.id)}><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="rd-footer">
            <span className="rd-total-lbl">الإجمالي:</span>
            <span className={`rd-total${total>0?' pos':''}`}>£{total.toLocaleString('en-US',{minimumFractionDigits:2})}</span>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFileUpload(f);e.target.value=''}}/>
    </>
  )
}
