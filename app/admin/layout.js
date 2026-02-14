'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, DollarSign, LogOut, LayoutDashboard, Settings, TrendingUp, BarChart3, MessageCircle } from 'lucide-react';

export default function AdminLayout({ children }) {
  const pathname = usePathname();

  const menuItems = [
    { href: '/order-dashboard', label: 'میز کار', icon: LayoutDashboard },
    { href: '/admin/support', label: 'پشتیبانی آنلاین', icon: MessageCircle },
    { href: '/admin/analytics', label: 'تحلیل و آمار', icon: BarChart3 },
    { href: '/admin/users', label: 'مدیریت کاربران', icon: Users },
    { href: '/admin/finance', label: 'امور مالی', icon: DollarSign },
    { href: '/admin/marketing', label: 'کمپین و تخفیف', icon: TrendingUp },
    { href: '/admin/settings', label: 'تنظیمات', icon: Settings },
    { href: '/supervisor', label: 'پنل سوپروایزر', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-xl font-black text-gray-800">پنل مدیریت</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                    isActive 
                    ? 'bg-blue-50 text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button 
            onClick={() => {
              fetch('/api/logout', { method: 'POST' }).then(() => window.location.href = '/login');
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 w-full transition font-bold"
          >
            <LogOut className="w-5 h-5" />
            خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:mr-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
