"use client";
import { useOrderStore } from "@/store/useOrderStore";

export default function HistoryTable({ orders, showActions }) {
  const { returnToDesk } = useOrderStore();

  const getStatusBadge = (status) => {
    const styles = {
      'completed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'wc-wrong-info': 'bg-orange-100 text-orange-700 border-orange-200',
      'wc-awaiting-auth': 'bg-purple-100 text-purple-700 border-purple-200',
      'processing': 'bg-blue-100 text-blue-700 border-blue-200',
      'waiting': 'bg-indigo-100 text-indigo-700 border-indigo-200', // ✅ اضافه شد
      'on-hold': 'bg-gray-100 text-gray-700 border-gray-200',
      'pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'refunded': 'bg-gray-100 text-gray-700 border-gray-200', // ✅ اضافه شد
    };
    
    const labels = {
      'completed': 'تکمیل شده',
      'wc-wrong-info': 'اطلاعات اشتباه',
      'wc-awaiting-auth': 'نیاز به احراز',
      'processing': 'در حال انجام',
      'waiting': 'آماده انجام', // ✅ اضافه شد
      'on-hold': 'در انتظار',
      'pending': 'منتظر پرداخت/بررسی',
      'refunded': 'مسترد شده', // ✅ اضافه شد
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-bold border ${styles[status] || 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (!orders || orders.length === 0) {
    return <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">هیچ موردی یافت نشد.</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-500 border-b">
            <tr>
              <th className="p-4 font-bold">#</th>
              <th className="p-4 font-bold">محصول</th>
              <th className="p-4 font-bold">شماره تماس</th>
              <th className="p-4 font-bold">تاریخ ثبت</th>
              <th className="p-4 font-bold">زمان تکمیل</th>
              <th className="p-4 font-bold text-center">اپراتور</th>
              <th className="p-4 font-bold">وضعیت</th>
              <th className="p-4 font-bold text-left">مبلغ نهایی</th>
              {showActions && <th className="p-4 text-center font-bold">عملیات</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition group">
                {/* شماره سفارش */}
                <td className="p-4 font-mono font-bold text-gray-600 bg-gray-50/50 w-24 text-center">
                  #{order.wp_order_id}
                </td>
                
                {/* محصول */}
                <td className="p-4">
                    <div className="font-bold text-gray-800 text-sm">{order.order_title}</div>
                    <div className="text-[10px] text-gray-400 mt-1 uppercase">{order.payment_method}</div>
                </td>

                {/* مشتری */}
                <td className="p-4">
                    <div className="text-sm font-bold text-gray-700 font-mono dir-ltr text-right">
                      {order.user?.phone_number}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {order.user?.first_name || ''} {order.user?.last_name || ''}
                    </div>
                </td>

                {/* تاریخ ثبت */}
                <td className="p-4 text-gray-500 text-xs font-mono">
                   {new Date(order.order_date).toLocaleDateString('fa-IR')}
                   <span className="block text-[10px] text-gray-400 mt-1">
                       {new Date(order.order_date).toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'})}
                   </span>
                </td>

                {/* ✅ زمان تکمیل */}
                <td className="p-4 text-xs font-mono">
                   {order.completed_at ? (
                       <>
                           <span className="text-emerald-600 font-bold">
                               {new Date(order.completed_at).toLocaleDateString('fa-IR')}
                           </span>
                           <span className="block text-[10px] text-gray-400 mt-1">
                               {new Date(order.completed_at).toLocaleTimeString('fa-IR', {hour:'2-digit', minute:'2-digit'})}
                           </span>
                       </>
                   ) : (
                       <span className="text-gray-300 italic">تکمیل نشده</span>
                   )}
                </td>

                {/* ✅ اپراتور */}
                <td className="p-4 text-center">
                  {order.updated_by_name ? (
                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-[11px] font-bold border border-blue-100">
                      {order.updated_by_name}
                    </span>
                  ) : (
                    <span className="text-gray-300 text-[11px]">سیستمی</span>
                  )}
                </td>

                <td className="p-4">
                  {(() => {
                    let displayStatus = order.status;
                    if (order.status === 'processing' && !order.operator_name) {
                        displayStatus = 'waiting';
                    }
                    return getStatusBadge(displayStatus);
                  })()}
                </td>

                {/* مبلغ نهایی */}
                <td className="p-4 font-bold text-emerald-600 text-left">
                  {parseInt(order.final_payable).toLocaleString()} <span className="text-[10px] font-normal text-gray-400 italic">ت</span>
                </td>
                
                {showActions && (
                  <td className="p-4 text-center">
                    <button 
                        onClick={() => returnToDesk(order)}
                        className="bg-white hover:bg-blue-50 text-blue-600 border border-blue-200 hover:border-blue-400 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 mx-auto whitespace-nowrap transform active:scale-95"
                    >
                        ↩ برگشت به میز
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}