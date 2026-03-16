'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import { AgGridReact } from 'ag-grid-react'
import type { ColDef, ICellRendererParams } from 'ag-grid-community'
import { themeQuartz } from 'ag-grid-community'
import '@/lib/ag-grid-setup'
import { Plus, Edit2, Trash2, Lock, Users } from 'lucide-react'

interface UserRecord {
  id: number
  name: string
  email: string
  role: string
  status: 'نشط' | 'غير نشط'
}

const INITIAL_USERS: UserRecord[] = [
  { id: 1, name: 'أحمد محمود',  email: 'ahmad@example.com',   role: 'مدير',   status: 'نشط' },
  { id: 2, name: 'فاطمة علي',   email: 'fatima@example.com',  role: 'محاسب',  status: 'نشط' },
  { id: 3, name: 'محمود خالد',  email: 'mahmoud@example.com', role: 'موظف',   status: 'نشط' },
  { id: 4, name: 'سارة محمد',   email: 'sarah@example.com',   role: 'محاسب',  status: 'غير نشط' },
  { id: 5, name: 'علي حسن',     email: 'ali@example.com',     role: 'موظف',   status: 'نشط' },
]

/* ── Cell Renderers ───────────────────────────── */
function StatusRenderer({ value }: ICellRendererParams) {
  const isActive = value === 'نشط'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: '.78rem',
      whiteSpace: 'nowrap',
      background: isActive ? '#dcfce7' : '#f3f4f6',
      color: isActive ? '#166534' : '#6b7280',
    }}>
      {value}
    </span>
  )
}

function ActionsRenderer({ data, context }: ICellRendererParams) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <button
        onClick={() => context.onEdit(data.id)}
        title="تعديل"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: '#2563eb', cursor: 'pointer', transition: 'background .15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Edit2 size={14} />
      </button>
      <button
        onClick={() => context.onLock(data.id)}
        title="قفل"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: '#d97706', cursor: 'pointer', transition: 'background .15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fef3c7')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Lock size={14} />
      </button>
      <button
        onClick={() => context.onDelete(data.id)}
        title="حذف"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', transition: 'background .15s' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

/* ── Main Component ───────────────────────────── */
export default function UsersView() {
  const gridRef = useRef<AgGridReact>(null)
  const [rowData, setRowData] = useState<UserRecord[]>(INITIAL_USERS)
  const [flash, setFlash] = useState('')

  const showFlash = (msg: string) => {
    setFlash(msg)
    setTimeout(() => setFlash(''), 3000)
  }

  const onDelete = useCallback((id: number) => {
    setRowData(prev => prev.filter(u => u.id !== id))
    showFlash('تم حذف المستخدم')
  }, [])

  const onEdit  = useCallback((_id: number) => showFlash('سيتم فتح نافذة التعديل قريباً'), [])
  const onLock  = useCallback((_id: number) => showFlash('تم قفل الحساب'), [])

  const gridContext = useMemo(() => ({ onDelete, onEdit, onLock }), [onDelete, onEdit, onLock])

  const colDefs = useMemo<ColDef<UserRecord>[]>(() => [
    {
      headerName: 'الاسم',
      field: 'name',
      flex: 1,
      minWidth: 130,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellStyle: () => ({ fontWeight: '700', color: '#0f1b2d', fontSize: '.875rem', display: 'flex', alignItems: 'center' }),
    },
    {
      headerName: 'البريد الإلكتروني',
      field: 'email',
      flex: 1.4,
      minWidth: 160,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellStyle: () => ({ color: '#64748b', fontSize: '.875rem', display: 'flex', alignItems: 'center', direction: 'ltr' }),
    },
    {
      headerName: 'الدور',
      field: 'role',
      flex: 0.8,
      minWidth: 100,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellStyle: () => ({ fontWeight: '600', fontSize: '.875rem', display: 'flex', alignItems: 'center' }),
    },
    {
      headerName: 'الحالة',
      field: 'status',
      flex: 0.8,
      minWidth: 110,
      sortable: true,
      filter: 'agTextColumnFilter',
      cellRenderer: StatusRenderer,
      cellStyle: () => ({ display: 'flex', alignItems: 'center' }),
    },
    {
      headerName: 'الإجراءات',
      colId: 'actions',
      width: 128,
      sortable: false,
      filter: false,
      resizable: false,
      cellRenderer: ActionsRenderer,
      cellStyle: () => ({ display: 'flex', alignItems: 'center', padding: '0 8px' }),
    },
  ], [])

  const defaultColDef = useMemo<ColDef>(() => ({
    resizable: true,
    suppressMovable: false,
  }), [])

  const isErr  = flash.includes('خطأ')

  return (
    <>
      <style>{`
        .uv-wrap { padding: 32px 36px 48px; background: #f5f7fa; min-height: 100vh; direction: rtl; font-family: 'Cairo','Segoe UI',Tahoma,sans-serif; }
        @media(max-width:640px){ .uv-wrap { padding: 16px 14px 40px; } }
        .uv-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; margin-bottom:28px; }
        .uv-title-group { display:flex; flex-direction:column; gap:2px; }
        .uv-title { font-size:1.9rem; font-weight:800; color:#0f1b2d; letter-spacing:-.025em; }
        @media(max-width:640px){ .uv-title { font-size:1.4rem; } }
        .uv-sub { font-size:.875rem; color:#64748b; }
        .uv-add-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 20px; border-radius:10px; border:none; font-family:inherit; font-size:.875rem; font-weight:600; cursor:pointer; background:#2563eb; color:#fff; box-shadow:0 2px 10px rgba(37,99,235,.28); transition:all .18s ease; white-space:nowrap; }
        .uv-add-btn:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 4px 16px rgba(37,99,235,.38); }
        .uv-toast { margin-bottom:16px; padding:10px 16px; border-radius:10px; font-size:.875rem; font-weight:500; animation:uvFadeIn .22s ease; }
        .uv-toast-ok  { background:#dcfce7; color:#166534; }
        .uv-toast-err { background:#fee2e2; color:#991b1b; }
        .uv-toast-info{ background:#dbeafe; color:#1e40af; }
        @keyframes uvFadeIn { from{opacity:0;transform:translateY(-5px)} to{opacity:1;transform:none} }
        .uv-grid-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; box-shadow:0 2px 14px rgba(15,27,45,.07); overflow:hidden; }
        .uv-grid-card .ag-root-wrapper { border:none !important; border-radius:0; }
        .uv-grid-card .ag-header { background:#fff !important; border-bottom:1.5px solid #eef2f8 !important; }
        .uv-grid-card .ag-header-cell { background:#fff !important; }
        .uv-grid-card .ag-header-cell-text { font-size:.82rem; font-weight:700; color:#94a3b8; letter-spacing:.01em; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .uv-grid-card .ag-row { border-bottom:1px solid #f1f5f9 !important; transition:background .14s; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; }
        .uv-grid-card .ag-row:hover { background:#f8fafd !important; }
        .uv-grid-card .ag-cell { border:none !important; font-size:.875rem; }
        .uv-grid-card .ag-paging-panel { border-top:1px solid #f1f5f9; font-family:'Cairo','Segoe UI',Tahoma,sans-serif; font-size:.82rem; color:#64748b; }
      `}</style>

      <div className="uv-wrap">
        {/* Header */}
        <div className="uv-header">
          <div className="uv-title-group">
            <h1 className="uv-title">إدارة المستخدمين</h1>
            <p className="uv-sub">إضافة وتعديل وحذف المستخدمين</p>
          </div>
          <button className="uv-add-btn" onClick={() => showFlash('سيتم فتح نافذة الإضافة قريباً')}>
            <Plus size={16} strokeWidth={2.5} />
            إضافة مستخدم
          </button>
        </div>

        {/* Toast */}
        {flash && (
          <div className={`uv-toast ${isErr ? 'uv-toast-err' : flash.includes('تم') && !flash.includes('قريباً') ? 'uv-toast-ok' : 'uv-toast-info'}`}>
            {flash}
          </div>
        )}

        {/* AG Grid */}
        <div className="uv-grid-card">
          <div style={{ width: '100%', direction: 'rtl' }}>
            <AgGridReact
              ref={gridRef}
              theme={themeQuartz}
              rowData={rowData}
              columnDefs={colDefs}
              defaultColDef={defaultColDef}
              domLayout="autoHeight"
              enableRtl={true}
              animateRows={true}
              context={gridContext}
              pagination={true}
              paginationPageSize={10}
              suppressRowClickSelection={true}
              rowHeight={54}
              headerHeight={44}
              noRowsOverlayComponent={() => (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                  <Users size={48} style={{ marginBottom: 12, opacity: .35 }} />
                  <p style={{ fontSize: '.9rem' }}>لا يوجد مستخدمون</p>
                </div>
              )}
            />
          </div>
        </div>
      </div>
    </>
  )
}
