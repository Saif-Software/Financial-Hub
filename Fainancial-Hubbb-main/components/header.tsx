'use client'

import { useState, useEffect } from 'react'
import { Bell, User, Square, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

export default function Header() {
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'تم تحديث التقرير الشهري', time: 'منذ 5 دقائق', read: false },
    { id: 2, text: 'مصروفات جديدة تنتظر الموافقة', time: 'منذ 15 دقيقة', read: false },
    { id: 3, text: 'نظام الصيانة مجدول غداً', time: 'منذ ساعة', read: true },
  ])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ))
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  const clearNotifications = () => {
    setNotifications([])
    setShowNotifications(false)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }
  return (
    <header className="border-b border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 sticky top-0 z-40 transition-colors">
      <div className="flex items-center justify-between px-8 py-4">
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Square size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-12 right-0 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 dark:text-white">الإشعارات</h3>
                    <div className="flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          تحديد الكل كمقروء
                        </button>
                      )}
                      <button 
                        onClick={clearNotifications}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        مسح الكل
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      لا توجد إشعارات
                    </div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id}
                        onClick={() => markAsRead(notification.id)}
                        className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 ${
                            !notification.read ? 'bg-blue-500' : 'bg-gray-300'
                          }`} />
                          <div className="flex-1">
                            <p className={`text-sm ${
                              !notification.read 
                                ? 'font-semibold text-gray-900 dark:text-white' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.text}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon size={20} className="text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
        </div>

        <div className="flex-1"></div>
      </div>
    </header>
  )
}
