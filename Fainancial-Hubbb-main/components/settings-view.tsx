'use client'

import { Save, Bell, Lock, Globe } from 'lucide-react'

export default function SettingsView() {
  return (
    <main className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">الإعدادات</h1>
        <p className="text-muted-foreground">إدارة إعدادات التطبيق والحساب</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Account Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock size={24} className="text-accent" />
            <h2 className="text-xl font-bold text-foreground">إعدادات الحساب</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">اسم المستخدم</label>
              <input 
                type="text"
                placeholder="أدخل اسمك"
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">البريد الإلكتروني</label>
              <input 
                type="email"
                placeholder="أدخل بريدك الإلكتروني"
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">كلمة المرور</label>
              <input 
                type="password"
                placeholder="أدخل كلمة المرور الجديدة"
                className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Bell size={24} className="text-accent" />
            <h2 className="text-xl font-bold text-foreground">إعدادات الإشعارات</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">تنبيهات البريد الإلكتروني</p>
                <p className="text-sm text-muted-foreground">استقبل تنبيهات عبر البريد الإلكتروني</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">إشعارات النظام</p>
                <p className="text-sm text-muted-foreground">استقبل إشعارات من النظام</p>
              </div>
              <input type="checkbox" defaultChecked className="w-5 h-5" />
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div>
                <p className="font-medium text-foreground">تنبيهات التقارير</p>
                <p className="text-sm text-muted-foreground">تنبيهات عند توفر تقارير جديدة</p>
              </div>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe size={24} className="text-accent" />
            <h2 className="text-xl font-bold text-foreground">الإعدادات العامة</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">اللغة</label>
              <select className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent">
                <option>العربية</option>
                <option>الإنجليزية</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">المنطقة الزمنية</label>
              <select className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-accent">
                <option>UTC+3</option>
                <option>UTC+2</option>
              </select>
            </div>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-medium">
          <Save size={18} />
          حفظ الإعدادات
        </button>
      </div>
    </main>
  )
}
