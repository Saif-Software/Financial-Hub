'use client'

import { FileText, Download, Trash2, Plus } from 'lucide-react'

export default function DocumentsView() {
  const documents = [
    { id: 1, name: 'الفاتورة رقم 001', type: 'PDF', date: '2024-02-15', size: '2.4 MB' },
    { id: 2, name: 'التقرير الشهري فبراير', type: 'Excel', date: '2024-02-14', size: '1.8 MB' },
    { id: 3, name: 'بيان المخزون', type: 'Excel', date: '2024-02-13', size: '3.2 MB' },
    { id: 4, name: 'العقود والاتفاقيات', type: 'Word', date: '2024-02-12', size: '1.5 MB' },
    { id: 5, name: 'سجل المستخدمين', type: 'PDF', date: '2024-02-11', size: '0.8 MB' },
  ]

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'PDF':
        return 'bg-red-100 text-red-700'
      case 'Excel':
        return 'bg-green-100 text-green-700'
      case 'Word':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <main className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">المستندات</h1>
            <p className="text-muted-foreground">إدارة الملفات والمستندات المهمة</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-accent-foreground hover:opacity-90 transition-opacity font-medium">
            <Plus size={16} />
            رفع مستند
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-card rounded-lg border border-border p-6 flex items-start gap-4">
            <div className="p-3 bg-secondary rounded-lg">
              <FileText size={32} className="text-accent" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{doc.name}</h3>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-medium px-2 py-1 rounded ${getTypeColor(doc.type)}`}>
                  {doc.type}
                </span>
                <span className="text-xs text-muted-foreground">{doc.size}</span>
                <span className="text-xs text-muted-foreground">{doc.date}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-secondary hover:bg-secondary/70 rounded text-sm font-medium transition-colors">
                  <Download size={14} />
                  تحميل
                </button>
                <button className="px-3 py-2 hover:bg-red-100 rounded text-sm transition-colors">
                  <Trash2 size={16} className="text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
