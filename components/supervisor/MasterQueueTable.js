'use client';
import { useState } from 'react';
import { 
  Search, Filter, MoreVertical, 
  ArrowUpRight, Clock, ShieldCheck, 
  AlertCircle, RotateCcw, Pin, PlayCircle,
  ArrowUpDown
} from 'lucide-react';
import useSupervisorStore from '@/store/useSupervisorStore';

export default function MasterQueueTable() {
  const { allOrders, approveKYC, returnToQueue, toggleOrderFlag, isLoading, moveToWaiting } = useSupervisorStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleMoveToWaiting = async (orderId) => {
    if (confirm("آیا از پرداخت این سفارش توسط مشتری مطمئن هستید؟\n(این سفارش به صف انتظار منتقل خواهد شد)")) {
        await moveToWaiting(orderId);
    }
  };

  const handleSort = (field) => {
    const newOrder = (sortBy === field && sortOrder === 'desc') ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
  };

  // تابع کمکی برای نمایش وضعیت‌ها با استایل دیتابیس جدید
  const getStatusStyle = (status) => {
    const map = {
      'processing': { text: 'در حال انجام', color: 'bg-blue-100 text-blue-700' },
      'waiting': { text: 'آماده انجام', color: 'bg-indigo-100 text-indigo-700' }, // ✅ اضافه شد
      'wc-awaiting-auth': { text: 'نیاز به احراز', color: 'bg-purple-100 text-purple-700' },
      'need-verification': { text: 'نیاز به احراز', color: 'bg-purple-100 text-purple-700' },
      'pending': { text: 'در انتظار پرداخت', color: 'bg-orange-100 text-orange-700' },
      'wrong_info': { text: 'اطلاعات اشتباه', color: 'bg-red-100 text-red-700' },
      'wrong-info': { text: 'اطلاعات اشتباه', color: 'bg-red-100 text-red-700' },
      'refund-req': { text: 'در انتظار استرداد', color: 'bg-red-50 text-red-600' },
      'awaiting-refund': { text: 'در انتظار استرداد', color: 'bg-red-50 text-red-600' },
      'refunded': { text: 'مسترد شد', color: 'bg-gray-100 text-gray-700' }, // ✅ اضافه شد
      'on-hold': { text: 'در انتظار پرداخت', color: 'bg-gray-100 text-gray-600' },
    };
    return map[status] || { text: status, color: 'bg-gray-50' };
  };

  // فیلتر کردن سفارش‌ها در سمت کلاینت (برای سرعت بیشتر)
  const filteredOrders = allOrders?.filter(order => 
    order.wp_order_id?.toString().includes(searchTerm) || 
    order.user?.phone?.includes(searchTerm) ||
    order.order_title?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    let valA, valB;
    if (sortBy === 'order_id') {
        valA = Number(a.wp_order_id);
        valB = Number(b.wp_order_id);
    } else if (sortBy === 'updated') {
        valA = new Date(a.updated_at).getTime();
        valB = new Date(b.updated_at).getTime();
    } else { // order_date
        valA = new Date(a.order_date).getTime();
        valB = new Date(b.order_date).getTime();
    }

    if (sortOrder === 'asc') {
        return valA - valB;
    } else {
        return valB - valA;
    }
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse text-gray-400">در حال بارگذاری صف عملیات...</div>;

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Header / Actions */}
      <div className="p-5 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-50 p-2 rounded-xl">
             <ArrowUpRight className="text-indigo-600" size={20} />
          </div>
          <div>
            <h3 className="font-black text-gray-800">مدیریت عملیات زنده</h3>
            <p className="text-xs text-gray-400">نظارت بر تمامی سفارشات در جریان</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="جستجو (شماره سفارش، موبایل...)"
              className="bg-gray-50 border-none rounded-xl pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100">
            <Filter size={18} />
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-gray-50/50 text-gray-500 text-xs">
            <tr>
              <th className="p-4 font-bold cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('order_id')}>
                <div className="flex items-center gap-1">
                    سفارش
                    {sortBy === 'order_id' && <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                </div>
              </th>
              <th className="p-4 font-bold">مشتری</th>
              <th className="p-4 font-bold">مبلغ (تومان)</th>
              <th className="p-4 font-bold">وضعیت فعلی</th>
              <th className="p-4 font-bold cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('order_date')}>
                <div className="flex items-center gap-1">
                    زمان انتظار
                    {sortBy === 'order_date' && <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                </div>
              </th>
              <th className="p-4 font-bold text-center">عملیات سوپروایزر</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredOrders?.map((order) => {
              // Logic fix: If processing but no operator, show as waiting
              let displayStatus = order.status;
              if (order.status === 'processing' && !order.operator_name) {
                displayStatus = 'waiting';
              }
              const statusInfo = getStatusStyle(displayStatus);
              const waitTime = Math.floor((Date.now() - new Date(order.order_date).getTime()) / (1000 * 60));

              // Debug log
              // console.log(`Order ${order.wp_order_id}: status=${order.status}`);

              return (
                <tr key={order.id} className={`hover:bg-gray-50/80 transition-colors ${order.isPinned ? 'bg-amber-50/30' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleOrderFlag(order.id)} className={`${order.isPinned ? 'text-amber-500' : 'text-gray-300'} hover:text-amber-500 transition-colors`}>
                        <Pin size={14} fill={order.isPinned ? "currentColor" : "none"} />
                      </button>
                      <div>
                        <div className="font-mono font-bold text-gray-800 text-sm">#{order.wp_order_id}</div>
                        <div className="text-[10px] text-gray-400 truncate max-w-[150px]">{order.order_title}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-gray-700 flex items-center gap-1">
                        {order.user?.first_name || 'مشتری'} {order.user?.last_name || ''}
                        {order.user?.telegram_chat_id && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100" title="تلگرام متصل است">
                                ✈️
                            </span>
                        )}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">{order.user?.phone}</div>
                  </td>
                  <td className="p-4 text-sm font-black text-gray-600">
                    {Number(order.final_payable).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${statusInfo.color}`}>
                      {statusInfo.text}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className={`flex items-center gap-1 text-xs font-mono ${waitTime > 30 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                      <Clock size={12} />
                      {waitTime} دقیقه
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      {(order.status === 'pending' || order.status === 'on-hold') && (
                        <button 
                          onClick={() => handleMoveToWaiting(order.id)}
                          className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 flex items-center gap-1" title="انتقال به صف انتظار (تایید پرداخت)"
                        >
                          <PlayCircle size={16} />
                          <span className="text-[10px]">تایید</span>
                        </button>
                      )}
                      {order.status === 'wc-awaiting-auth' && (
                        <button 
                          onClick={() => approveKYC(order.id)}
                          className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100" title="تایید احراز هویت"
                        >
                          <ShieldCheck size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => returnToQueue(order.id)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="بازگشت به صف عمومی"
                      >
                        <RotateCcw size={16} />
                      </button>
                      <button className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}