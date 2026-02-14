"use client";
import { useState, useEffect } from 'react';
import { differenceInSeconds, parseISO } from 'date-fns';
import { Clock } from 'lucide-react';

// حتماً باید export default باشد
export default function OrderCard({ order }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const createdTime = parseISO(order.date_created_gmt + 'Z'); 
      const targetTime = new Date(createdTime.getTime() + 30 * 60000); 
      const now = new Date();
      const diff = differenceInSeconds(targetTime, now);

      setTimeLeft(diff > 0 ? diff : 0);
      setIsUrgent(diff < 600); 
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [order.date_created_gmt]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const productName = order.line_items?.[0]?.name || "محصول نامشخص";
  const total = parseInt(order.total).toLocaleString();

  const statusLabels = {
    'processing': 'در حال انجام',
    'completed': 'تکمیل شده',
    'refunded': 'مسترد شده',
    'cancelled': 'لغو شده',
    'failed': 'ناموفق',
    'on-hold': 'در انتظار پرداخت',
    'pending': 'در انتظار پرداخت',
    'waiting': 'آماده انجام',
    'refund-req': 'درخواست استرداد',
    'wrong-info': 'اطلاعات اشتباه',
    'wrong_info': 'اطلاعات اشتباه',
    'need-verification': 'نیاز به احراز',
    'verification': 'نیاز به احراز',
    'awaiting-refund': 'در انتظار استرداد'
  };
  const statusLabel = statusLabels[order.status] || order.status;

  return (
    <div className={`p-4 rounded-xl border-2 shadow-sm mb-3 transition-all ${
      isUrgent && timeLeft > 0 
        ? 'bg-red-50 border-red-500 animate-pulse' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
            <h3 className="font-bold text-gray-800 text-sm">{productName}</h3>
            <div className="flex flex-col gap-1 mt-1">
                <span className="text-xs text-gray-500">#{order.wp_order_id || order.id} | {statusLabel}</span>
                
                {/* User Info & Badges */}
                <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-gray-700">
                        {order.user?.first_name || order.billing?.first_name || 'کاربر'}
                    </span>
                    
                    {/* Verification Badge */}
                    {order.user?.is_verified ? (
                        <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            ✓ احراز شده
                        </span>
                    ) : (
                        <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                            ! تایید نشده
                        </span>
                    )}

                    {/* Order Count Badge */}
                    {order.user?.orders_count === 1 ? (
                        <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md">
                            اول
                        </span>
                    ) : (order.user?.orders_count > 1) ? (
                        <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md">
                            {order.user.orders_count}مین
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
        <span className="font-bold text-green-600 text-sm">{total} تومان</span>
      </div>

      <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg">
        <div className="flex items-center gap-1 text-gray-600">
          <Clock size={16} />
          <span className="text-xs">زمان باقی‌مانده:</span>
        </div>
        <span className={`font-mono font-bold text-lg ${
          isUrgent ? 'text-red-600' : 'text-blue-600'
        }`}>
          {timeLeft > 0 ? formatTime(timeLeft) : 'منقضی'}
        </span>
      </div>
    </div>
  );
}