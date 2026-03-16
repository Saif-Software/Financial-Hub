'use client'

import { Edit, Trash2, Eye } from 'lucide-react'

export default function DataGrid() {
  const items = [
    {
      id: '001',
      date: '2024-02-15',
      type: 'فاتورة مبيعات',
      amount: '5,200.00',
      status: 'مكتمل',
      customer: 'شركة العربية'
    },
    {
      id: '002',
      date: '2024-02-14',
      type: 'فاتورة شراء',
      amount: '3,100.00',
      status: 'معلق',
      customer: 'الموردين المتحدين'
    },
    {
      id: '003',
      date: '2024-02-13',
      type: 'فاتورة مبيعات',
      amount: '7,850.00',
      status: 'مكتمل',
      customer: 'شركة الخليج'
    },
    {
      id: '004',
      date: '2024-02-12',
      type: 'إيصال استرجاع',
      amount: '1,200.00',
      status: 'مرفوض',
      customer: 'متجر فروع'
    },
    {
      id: '005',
      date: '2024-02-11',
      type: 'فاتورة مبيعات',
      amount: '4,500.00',
      status: 'مكتمل',
      customer: 'السوق المركزي'
    },
    {
      id: '006',
      date: '2024-02-10',
      type: 'فاتورة شراء',
      amount: '2,800.00',
      status: 'معلق',
      customer: 'مصنع المحلاوي'
    },
    {
      id: '007',
      date: '2024-02-09',
      type: 'فاتورة مبيعات',
      amount: '6,300.00',
      status: 'مكتمل',
      customer: 'مركز التوزيع'
    },
    {
      id: '008',
      date: '2024-02-08',
      type: 'إيصال استرجاع',
      amount: '950.00',
      status: 'مكتمل',
      customer: 'العميل الدولي'
    }
  ]

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'مكتمل':
        return 'bg-green-100 text-green-800'
      case 'معلق':
        return 'bg-yellow-100 text-yellow-800'
      case 'مرفوض':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="grid grid-cols-8 gap-4 p-4 bg-secondary border-b border-border font-semibold text-sm text-foreground sticky top-0">
        <div>رقم</div>
        <div>التاريخ</div>
        <div>نوع المعاملة</div>
        <div>الحساب</div>
        <div>المبلغ</div>
        <div>الحالة</div>
        <div></div>
      </div>

      <div className="grid grid-cols-1 gap-0">
        {items.map((item, index) => (
          <div 
            key={index}
            className="grid grid-cols-8 gap-4 p-4 border-b border-border hover:bg-secondary/50 transition-colors items-center text-sm"
          >
            <div className="font-medium text-foreground">{item.id}</div>
            <div className="text-muted-foreground">{item.date}</div>
            <div className="text-foreground">{item.type}</div>
            <div className="text-foreground">{item.customer}</div>
            <div className="font-semibold text-foreground">{item.amount}₪</div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button className="p-2 hover:bg-primary/10 rounded transition-colors">
                <Eye size={16} className="text-primary" />
              </button>
              <button className="p-2 hover:bg-primary/10 rounded transition-colors">
                <Edit size={16} className="text-primary" />
              </button>
              <button className="p-2 hover:bg-red-100 rounded transition-colors">
                <Trash2 size={16} className="text-red-600" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
