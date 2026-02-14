'use client';
import { useEffect, useState } from 'react'; // ۱. اضافه کردن useEffect
import AdminMonitorCard from '@/components/supervisor/AdminMonitorCard';
import CommandCenter from '@/components/supervisor/CommandCenter';
import ActivityStream from '@/components/supervisor/ActivityStream';
import useSupervisorStore from '@/store/useSupervisorStore';

export default function SupervisorPage() {
  // ۲. اضافه کردن تابع fetchLiveStatus از استور
  const { admins, fetchLiveStatus, isLoading } = useSupervisorStore();
  const [currentUser, setCurrentUser] = useState(null);

  // ۳. اجرای خودکار دریافت دیتا به محض لود شدن صفحه
  useEffect(() => {
    fetchLiveStatus();
    
    // دریافت اطلاعات کاربر جاری
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data.success) setCurrentUser(data.data);
      });

    // رفرش خودکار هر ۳۰ ثانیه برای مانیتورینگ زنده
    const interval = setInterval(() => {
      fetchLiveStatus();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchLiveStatus]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 p-4 md:p-6" dir="rtl">
      
      {/* Header */}
      <header className="mb-8 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">پنل مدیریت و نظارت</h1>
            {currentUser && (
              <span className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-bold border border-indigo-100">
                {currentUser.display_name || currentUser.username}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">مانیتورینگ زنده تیم و مدیریت صف سفارشات</p>
        </div>
        <div className="flex items-center gap-3">
           {currentUser?.role === 'ADMIN' && (
             <a 
               href="/admin/users"
               className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-900 transition font-bold shadow-lg shadow-gray-200 flex items-center gap-2"
             >
               <span>👥</span>
               <span>کاربران</span>
             </a>
           )}
           <a 
             href="/order-dashboard"
             className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition font-bold shadow-lg shadow-blue-100 flex items-center gap-2"
           >
             <span>🖥️</span>
             <span>میز کار</span>
           </a>
           {isLoading && <span className="text-xs text-indigo-500 animate-pulse">در حال بروزرسانی...</span>}
           <button 
             onClick={handleLogout}
             className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition font-bold shadow-lg shadow-red-100"
           >
             خروج
           </button>
        </div>
      </header>

      {/* Section A: Live Team Status */}
      <section className="mb-8">
        <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            وضعیت آنلاین تیم (Admins Live)
        </h2>
        
        {/* اگر ادمینی نبود پیام مناسب نشان دهد */}
        {admins.length === 0 && !isLoading ? (
          <div className="bg-white p-10 text-center rounded-2xl border border-dashed text-gray-400">
            هیچ ادمینی در دیتابیس یافت نشد.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {admins.map((admin) => (
              <AdminMonitorCard key={admin.id} admin={admin} />
            ))}
          </div>
        )}
      </section>

      {/* Section B: Command Center & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-10">
        <div className="lg:col-span-3">
          <CommandCenter />
        </div>
        <div className="lg:col-span-1">
          <ActivityStream />
        </div>
      </div>

    </div>
  );
}