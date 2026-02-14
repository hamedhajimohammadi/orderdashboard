'use client';
import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Zap, AlertTriangle, Hammer, History } from 'lucide-react';

// --- کامپوننت تایمر ثانیه‌شمار ---
const LiveTimer = ({ initialSeconds, isRunning }) => {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const format = (sec) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return <span>{format(seconds)}</span>;
};

// --- کامپوننت محاسبه فاصله زمانی (برای سفارش‌ها) ---
const DurationTimer = ({ startTime, type }) => {
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const start = new Date(startTime).getTime();
    const update = () => setDiff(Math.floor((Date.now() - start) / 1000));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const format = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // رنگ‌بندی بر اساس نوع (هشدار قرمز برای انتظار مشتری)
  let color = "text-gray-500";
  if (type === 'customer_wait') {
    if (diff > 1800) color = "text-red-600 animate-pulse font-bold"; // > 30 min
    else if (diff > 900) color = "text-orange-500 font-bold"; // > 15 min
  } else {
    color = "text-blue-600 font-bold"; // زمان ادمین
  }

  return <span className={`font-mono ${color}`}>{format(diff)}</span>;
};

export default function AdminMonitorCard({ admin }) {
  const isOnline = admin.is_online;
  const slots = [0, 1, 2, 3].map(i => admin.orders[i] || null);

  return (
    <div className={`
      relative rounded-3xl p-4 transition-all duration-300 border-2 overflow-hidden flex flex-col gap-4
      ${isOnline ? 'bg-white border-green-400 shadow-xl shadow-green-100' : 'bg-gray-50 border-gray-200 opacity-70 grayscale'}
    `}>
      
      {/* Header: Avatar, Name, Work Timer */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(admin.display_name)}&background=${isOnline ? '10b981' : '9ca3af'}&color=fff&bold=true`} 
              className="w-14 h-14 rounded-full border-4 border-white shadow-md object-cover"
              alt="Avatar"
            />
            {isOnline && <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-ping"></span>}
            <span className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          </div>
          
          <div>
            <h3 className="font-black text-gray-800 text-lg leading-tight flex items-center gap-1">
              {admin.display_name}
              {admin.completed_today > 50 && (
                <span title="عملکرد عالی: بیش از ۵۰ سفارش" className="text-lg animate-bounce">🔥</span>
              )}
            </h3>
            {/* تایمر کارکرد امروز */}
            <div className={`flex items-center gap-1.5 mt-1 text-xs font-mono font-bold ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
               <Clock size={14} />
               <LiveTimer initialSeconds={admin.calculated_worked_seconds} isRunning={isOnline} />
            </div>
          </div>
        </div>

        {/* بج تعداد انجام شده */}
        <div className="flex flex-col items-center bg-blue-50 border border-blue-100 rounded-2xl px-3 py-2 min-w-[60px]">
           <span className="text-[10px] text-blue-400 font-bold">انجام شده</span>
           <div className="flex items-center gap-1 text-blue-700">
              <CheckCircle size={14} />
              <span className="text-lg font-black leading-none">{admin.completed_today || 0}</span>
           </div>
        </div>
      </div>

      {/* Progress Line (Visual Indicator) */}
      {isOnline && (
        <div className="w-full bg-green-100 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-full animate-[progress_2s_ease-in-out_infinite] origin-left scale-x-50"></div>
        </div>
      )}

      {/* Slots Grid */}
      <div className="space-y-2">
        {slots.map((order, index) => (
          <div key={index} className={`
             relative flex items-center p-2 rounded-xl border transition-all min-h-[60px]
             ${order ? 'bg-white border-indigo-100 shadow-sm' : 'bg-gray-100/50 border-gray-200 border-dashed'}
          `}>
             {order ? (
               <div className="w-full">
                 <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-gray-700 truncate w-32" title={order.order_title}>
                      {order.order_title || "سفارش"}
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                      #{order.wp_order_id}
                    </span>
                 </div>
                 
                 {/* Dual Timer Row */}
                 <div className="flex items-center justify-between w-full mt-1">
                    <div className="flex items-center gap-2 text-[10px]">
                        {/* تایمر ادمین (مدت زمان در وضعیت Processing) */}
                        <div className="flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded text-blue-700" title="زمان فعالیت ادمین روی این سفارش">
                          <Hammer size={10} />
                          <DurationTimer startTime={order.assigned_at || order.updated_at} type="admin" />
                        </div>
                        
                        <span className="text-gray-300">/</span>

                        {/* تایمر مشتری (کل انتظار) */}
                        <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-gray-600" title="زمان کل انتظار مشتری">
                          <History size={10} />
                          <DurationTimer startTime={order.order_date} type="customer_wait" />
                        </div>
                    </div>

                    {/* دکمه حذف (Release) */}
                    <button 
                      onClick={async () => {
                        if(!confirm('آیا مطمئن هستید که می‌خواهید این سفارش را از میز کار ادمین حذف کنید؟')) return;
                        try {
                          const res = await fetch('/api/orders/release', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: order.id })
                          });
                          if(res.ok) {
                            // رفرش کردن صفحه یا آپدیت استیت (چون این کامپوننت از والد دیتا می‌گیرد، شاید بهتر باشد والد را رفرش کنیم)
                            // اما فعلاً یک ریلود ساده یا انتظار برای آپدیت بعدی لایو
                            alert('سفارش با موفقیت آزاد شد');
                          } else {
                            alert('خطا در آزاد کردن سفارش');
                          }
                        } catch(e) {
                          console.error(e);
                          alert('خطا در ارتباط با سرور');
                        }
                      }}
                      className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition"
                      title="حذف از میز کار (بازگشت به صف)"
                    >
                      <span className="text-[10px] font-bold">✕</span>
                    </button>
                 </div>
               </div>
             ) : (
               <div className="w-full text-center">
                 <span className="text-[10px] text-gray-300 select-none">اسلات خالی</span>
               </div>
             )}
          </div>
        ))}
      </div>

    </div>
  );
}