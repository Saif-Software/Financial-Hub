'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, Lock, Bell, Shield, Edit3, Camera, CheckCircle } from 'lucide-react'

export default function ProfileView() {
  const [name, setName] = useState('أحمد يحيى')
  const [email, setEmail] = useState('ahmed.yahya@financialhub.com')
  const [phone, setPhone] = useState('+20 100 123 4567')
  const [location, setLocation] = useState('القاهرة، مصر')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <>
      <style>{`
        .pv-wrap{padding:28px 32px 60px;background:#f5f7fa;min-height:100vh;direction:rtl;font-family:'Cairo','Segoe UI',Tahoma,sans-serif}
        @media(max-width:768px){.pv-wrap{padding:16px 14px 60px}}

        /* Page header */
        .pv-page-title{font-size:1.7rem;font-weight:800;color:#0f1b2d;margin-bottom:4px}
        .pv-page-sub{font-size:.875rem;color:#64748b;margin-bottom:28px}

        /* Grid */
        .pv-grid{display:grid;grid-template-columns:280px 1fr;gap:20px;align-items:start}
        @media(max-width:900px){.pv-grid{grid-template-columns:1fr}}

        /* Card */
        .pv-card{background:#fff;border:1px solid #e2e8f0;border-radius:18px;box-shadow:0 2px 14px rgba(15,27,45,.06);overflow:hidden}

        /* Avatar card */
        .pv-avatar-card{padding:32px 24px;text-align:center}
        .pv-avatar-wrap{position:relative;display:inline-block;margin-bottom:16px}
        .pv-avatar{width:96px;height:96px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:2rem;font-weight:800;color:#fff;box-shadow:0 6px 20px rgba(37,99,235,.3);margin:0 auto}
        .pv-avatar-edit{position:absolute;bottom:4px;left:4px;width:28px;height:28px;border-radius:50%;background:#fff;border:2px solid #e2e8f0;display:flex;align-items:center;justify-content:center;cursor:pointer;color:#64748b;transition:all .15s}
        .pv-avatar-edit:hover{background:#2563eb;color:#fff;border-color:#2563eb}
        .pv-avatar-name{font-size:1.1rem;font-weight:800;color:#0f1b2d;margin-bottom:4px}
        .pv-avatar-role{font-size:.82rem;color:#64748b;margin-bottom:16px}
        .pv-avatar-badge{display:inline-flex;align-items:center;gap:6px;padding:5px 14px;background:#dcfce7;color:#166534;border-radius:20px;font-size:.78rem;font-weight:700}

        /* Stats row */
        .pv-stats{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#f1f5f9;border:1px solid #f1f5f9;border-radius:0 0 18px 18px;overflow:hidden}
        .pv-stat{padding:14px 16px;background:#fff;text-align:center}
        .pv-stat-val{font-size:1.25rem;font-weight:800;color:#0f1b2d}
        .pv-stat-lbl{font-size:.72rem;color:#94a3b8;font-weight:500;margin-top:1px}

        /* Form card */
        .pv-form-card .pv-card-hd{padding:20px 24px 16px;border-bottom:1px solid #f1f5f9}
        @media(max-width:640px){.pv-form-card .pv-card-hd{padding:16px 16px 14px}}
        .pv-card-title{font-size:1rem;font-weight:700;color:#0f1b2d}
        .pv-card-sub{font-size:.78rem;color:#94a3b8;margin-top:1px}
        .pv-form-body{padding:20px 24px}
        @media(max-width:640px){.pv-form-body{padding:16px}}
        .pv-field{margin-bottom:18px}
        .pv-label{display:block;font-size:.82rem;font-weight:700;color:#374151;margin-bottom:7px}
        .pv-input-wrap{position:relative}
        .pv-input-ico{position:absolute;right:13px;top:50%;transform:translateY(-50%);color:#94a3b8;pointer-events:none}
        .pv-input{width:100%;padding:10px 38px 10px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font-family:inherit;font-size:.875rem;color:#1e293b;background:#fff;outline:none;direction:rtl;transition:border-color .15s,box-shadow .15s;box-sizing:border-box}
        .pv-input:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.12)}
        .pv-input::placeholder{color:#94a3b8}
        .pv-fields-row{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        @media(max-width:640px){.pv-fields-row{grid-template-columns:1fr}}

        /* Save button */
        .pv-save-btn{display:inline-flex;align-items:center;gap:7px;padding:10px 24px;background:#2563eb;color:#fff;border:none;border-radius:10px;font-family:inherit;font-size:.875rem;font-weight:700;cursor:pointer;transition:all .17s ease;box-shadow:0 2px 8px rgba(37,99,235,.28)}
        .pv-save-btn:hover{background:#1d4ed8;transform:translateY(-1px)}
        .pv-save-btn.saved{background:#16a34a;box-shadow:0 2px 8px rgba(22,163,74,.28)}
        .pv-form-footer{padding:0 24px 20px;display:flex;justify-content:flex-end}
        @media(max-width:640px){.pv-form-footer{padding:0 16px 16px}}

        /* Quick settings */
        .pv-settings-list{padding:8px 0}
        .pv-setting-item{display:flex;align-items:center;justify-content:space-between;padding:14px 24px;border-bottom:1px solid #f8fafc;transition:background .13s}
        .pv-setting-item:last-child{border-bottom:none}
        .pv-setting-item:hover{background:#f8fafd}
        @media(max-width:640px){.pv-setting-item{padding:14px 16px}}
        .pv-setting-l{display:flex;align-items:center;gap:12px}
        .pv-setting-ico{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .pv-setting-name{font-size:.875rem;font-weight:600;color:#1e293b}
        .pv-setting-desc{font-size:.75rem;color:#94a3b8;margin-top:1px}
        .pv-toggle{position:relative;width:42px;height:24px;cursor:pointer}
        .pv-toggle input{opacity:0;width:0;height:0}
        .pv-toggle-slider{position:absolute;inset:0;background:#cbd5e1;border-radius:24px;transition:background .2s}
        .pv-toggle input:checked + .pv-toggle-slider{background:#2563eb}
        .pv-toggle-slider::before{content:'';position:absolute;width:18px;height:18px;border-radius:50%;background:#fff;top:3px;right:3px;transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.2)}
        .pv-toggle input:checked + .pv-toggle-slider::before{transform:translateX(-18px)}
      `}</style>

      <div className="pv-wrap">
        <h1 className="pv-page-title">الملف الشخصي</h1>
        <p className="pv-page-sub">إدارة معلوماتك الشخصية وإعدادات الحساب</p>

        <div className="pv-grid">
          {/* ── Left: Avatar Card ── */}
          <div>
            <div className="pv-card pv-avatar-card" style={{ borderRadius: '18px 18px 0 0' }}>
              <div className="pv-avatar-wrap">
                <div className="pv-avatar">أح</div>
                <div className="pv-avatar-edit"><Camera size={13} /></div>
              </div>
              <div className="pv-avatar-name">{name}</div>
              <div className="pv-avatar-role">مدير النظام</div>
              <div className="pv-avatar-badge"><CheckCircle size={13} /> حساب موثق</div>
            </div>
            <div className="pv-stats">
              <div className="pv-stat">
                <div className="pv-stat-val">24</div>
                <div className="pv-stat-lbl">تقرير منشأ</div>
              </div>
              <div className="pv-stat">
                <div className="pv-stat-val">18</div>
                <div className="pv-stat-lbl">تقرير معتمد</div>
              </div>
            </div>

            {/* Quick Settings */}
            <div className="pv-card" style={{ marginTop: 18 }}>
              <div className="pv-card-hd">
                <div className="pv-card-title">إعدادات سريعة</div>
              </div>
              <div className="pv-settings-list">
                {[
                  { icon: <Bell size={16} color="#f59e0b" />, bg: '#fffbeb', name: 'الإشعارات', desc: 'تلقي تنبيهات فورية', defaultOn: true },
                  { icon: <Shield size={16} color="#2563eb" />, bg: '#eff6ff', name: 'المصادقة الثنائية', desc: 'تأمين إضافي للحساب', defaultOn: false },
                  { icon: <Lock size={16} color="#8b5cf6" />, bg: '#f5f3ff', name: 'قفل الجلسة', desc: 'قفل تلقائي بعد الخمول', defaultOn: true },
                ].map((s, i) => (
                  <div key={i} className="pv-setting-item">
                    <div className="pv-setting-l">
                      <div className="pv-setting-ico" style={{ background: s.bg }}>{s.icon}</div>
                      <div>
                        <div className="pv-setting-name">{s.name}</div>
                        <div className="pv-setting-desc">{s.desc}</div>
                      </div>
                    </div>
                    <label className="pv-toggle">
                      <input type="checkbox" defaultChecked={s.defaultOn} />
                      <span className="pv-toggle-slider" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right: Form ── */}
          <div className="pv-card pv-form-card">
            <div className="pv-card-hd">
              <div className="pv-card-title">المعلومات الشخصية</div>
              <div className="pv-card-sub">تحديث بياناتك وكلمة المرور</div>
            </div>
            <div className="pv-form-body">
              <div className="pv-fields-row">
                <div className="pv-field">
                  <label className="pv-label">الاسم الكامل</label>
                  <div className="pv-input-wrap">
                    <User size={15} className="pv-input-ico" />
                    <input className="pv-input" value={name} onChange={e => setName(e.target.value)} placeholder="الاسم الكامل" />
                  </div>
                </div>
                <div className="pv-field">
                  <label className="pv-label">البريد الإلكتروني</label>
                  <div className="pv-input-wrap">
                    <Mail size={15} className="pv-input-ico" />
                    <input className="pv-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" />
                  </div>
                </div>
              </div>
              <div className="pv-fields-row">
                <div className="pv-field">
                  <label className="pv-label">رقم الهاتف</label>
                  <div className="pv-input-wrap">
                    <Phone size={15} className="pv-input-ico" />
                    <input className="pv-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 1XX XXX XXXX" />
                  </div>
                </div>
                <div className="pv-field">
                  <label className="pv-label">الموقع</label>
                  <div className="pv-input-wrap">
                    <MapPin size={15} className="pv-input-ico" />
                    <input className="pv-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="المدينة، الدولة" />
                  </div>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f1f5f9', margin: '8px 0 20px' }} />
              <div className="pv-card-title" style={{ marginBottom: 16 }}>تغيير كلمة المرور</div>

              <div className="pv-fields-row">
                <div className="pv-field">
                  <label className="pv-label">كلمة المرور الحالية</label>
                  <div className="pv-input-wrap">
                    <Lock size={15} className="pv-input-ico" />
                    <input className="pv-input" type="password" placeholder="••••••••" />
                  </div>
                </div>
                <div className="pv-field">
                  <label className="pv-label">كلمة المرور الجديدة</label>
                  <div className="pv-input-wrap">
                    <Lock size={15} className="pv-input-ico" />
                    <input className="pv-input" type="password" placeholder="••••••••" />
                  </div>
                </div>
              </div>
              <div className="pv-field">
                <label className="pv-label">تأكيد كلمة المرور</label>
                <div className="pv-input-wrap">
                  <Lock size={15} className="pv-input-ico" />
                  <input className="pv-input" type="password" placeholder="••••••••" />
                </div>
              </div>
            </div>

            <div className="pv-form-footer">
              <button className={`pv-save-btn${saved ? ' saved' : ''}`} onClick={handleSave}>
                {saved ? <><CheckCircle size={15} /> تم الحفظ</> : <><Edit3 size={15} /> حفظ التغييرات</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
