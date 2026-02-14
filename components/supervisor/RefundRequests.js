'use client';
import { useState, useEffect } from 'react';
import useSupervisorStore from '@/store/useSupervisorStore';
import { useOrderStore } from '@/store/useOrderStore'; // For updateOrderStatus

// کامپوننت تایمر معکوس ۴۸ ساعته
function RefundTimer({ updatedAt }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  
  useEffect(() => {
    if (!updatedAt) return;
    
    const deadline = new Date(updatedAt).getTime() + (48 * 60 * 60 * 1000);
    
    const update = () => {
      const now = Date.now();
      const diff = deadline - now;
      
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setIsExpired(true);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };
    
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [updatedAt]);
  
  return (
    <div className={`flex flex-col items-center ${isExpired ? 'text-red-800' : 'text-red-600'}`}>
        <span className="text-xs font-bold font-mono bg-red-100 px-2 py-1 rounded-md border border-red-200">
            {timeLeft}
        </span>
        <span className="text-[9px] mt-1 text-red-400">تا پایان مهلت ۴۸ ساعته</span>
    </div>
  );
}

export default function RefundRequests() {
  const { allOrders, forceReleaseSlot } = useSupervisorStore();
  const { updateOrderStatus } = useOrderStore();
  const [processingId, setProcessingId] = useState(null);

  const refundRequests = allOrders?.filter(o => o.status === 'refund-req') || [];

  const handleApprove = async (order) => {
    if(!confirm("آیا مبلغ به حساب مشتری واریز شده است؟ با تایید این گزینه وضعیت سفارش به 'مسترد شده' تغییر می‌کند.")) return;
    
    setProcessingId(order.id);
    await updateOrderStatus(order.id, 'refunded', 'استرداد وجه توسط سوپروایزر تایید شد.');
    setProcessingId(null);
  };

  const handleReject = async (order) => {
    if(!confirm("آیا درخواست استرداد رد شود و سفارش به جریان بیفتد؟")) return;
    
    setProcessingId(order.id);
    // استفاده از forceReleaseSlot برای اینکه سفارش از حالت رزرو خارج شده و به صف برگردد
    await forceReleaseSlot(order.id);
    setProcessingId(null);
  };

  // استخراج شماره کارت از متادیتا
  const getCardNumber = (order) => {
    const snapshot = order.snapshot_data || {};
    const meta = snapshot.meta_data || [];
    // جستجو در کلیدهای مختلف که ممکن است شماره کارت باشد
    const cardMeta = meta.find(m => 
        m.key === '_card_number' || 
        m.key === 'card_number' || 
        m.key === '_billing_card_number' ||
        (m.key && m.key.includes('card') && m.key.includes('number'))
    );
    return cardMeta ? cardMeta.value : '---';
  };

  if (refundRequests.length === 0) return null;

  return (
    <div className="mb-8 bg-red-50 border border-red-100 rounded-3xl overflow-hidden">
      <div className="p-4 bg-red-100/50 border-b border-red-100 flex justify-between items-center">
        <h3 className="font-bold text-red-800 flex items-center gap-2">
          <span>💸</span>
          درخواست‌های استرداد وجه (مهلت ۴۸ ساعت)
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">{refundRequests.length}</span>
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="text-red-700 bg-red-50/50">
            <tr>
              <th className="p-4">#</th>
              <th className="p-4">محصول / مشتری</th>
              <th className="p-4">اطلاعات پرداخت</th>
              <th className="p-4">مبلغ</th>
              <th className="p-4 text-center">مهلت باقی‌مانده</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-red-100">
            {refundRequests.map(order => (
              <tr key={order.id} className="bg-white hover:bg-red-50/30 transition">
                <td className="p-4 font-mono font-bold text-gray-600">#{order.wp_order_id}</td>
                
                {/* محصول و مشتری */}
                <td className="p-4">
                    <div className="font-bold text-gray-800 text-sm mb-1">{order.order_title || '---'}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>👤 {order.user?.first_name} {order.user?.last_name}</span>
                        <span className="font-mono bg-gray-100 px-1 rounded">{order.user?.phone_number}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-1">
                        درخواست توسط: {order.operator_name || '---'}
                    </div>
                </td>

                {/* اطلاعات پرداخت (شماره کارت) */}
                <td className="p-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-gray-500">شماره کارت:</span>
                        <span className="font-mono font-bold text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200 w-fit select-all">
                            {getCardNumber(order)}
                        </span>
                        <span className="text-[10px] text-gray-400">{order.payment_method}</span>
                    </div>
                </td>

                <td className="p-4 font-bold text-emerald-600">
                    {parseInt(order.final_payable).toLocaleString()} ت
                </td>

                {/* تایمر */}
                <td className="p-4 text-center">
                    <RefundTimer updatedAt={order.updated_at} />
                </td>

                <td className="p-4 flex justify-center gap-2 items-center">
                    <button 
                        onClick={() => handleApprove(order)}
                        disabled={processingId === order.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                    >
                        {processingId === order.id ? '...' : '✅ واریز شد'}
                    </button>
                    <button 
                        onClick={() => handleReject(order)}
                        disabled={processingId === order.id}
                        className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50"
                    >
                        رد درخواست
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
