
"use client";
import { useState, useEffect } from 'react';
import { Pin, Search, Edit, RefreshCw, Filter, User, Package, Clock, CheckCircle, AlertTriangle, XCircle, HelpCircle, DollarSign, Tag, PlayCircle } from 'lucide-react';
import EditOrderModal from './EditOrderModal';
import StatusChangeModal from './StatusChangeModal';
import StatsHUD from './StatsHUD';

const TABS = [
  { id: 'all', label: 'همه سفارش‌ها' },
  { id: 'waiting', label: 'آماده انجام (Waiting)' }, // ✅ اضافه شد
  { id: 'pending', label: 'در انتظار پرداخت (Pending)' },
  { id: 'processing', label: 'در حال انجام (Processing)' },
  { id: 'wrong-info', label: 'اطلاعات اشتباه' },
  { id: 'need-verification', label: 'نیاز به احراز' },
  { id: 'refund-req', label: 'درخواست استرداد' },
  { id: 'refunded', label: 'مسترد شده' }, // ✅ اضافه شد
  { id: 'completed', label: 'تکمیل شده' },
  { id: 'cancelled', label: 'لغو شده' },
];

const STATUS_BADGES = {
  'waiting': { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Ready', icon: Clock },
  'pending': { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Pending', icon: Clock },
  'processing': { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Processing', icon: RefreshCw },
  'completed': { bg: 'bg-green-50', text: 'text-green-600', label: 'Completed', icon: CheckCircle },
  'wrong-info': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Wrong Info', icon: AlertTriangle },
  'wrong_info': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Wrong Info', icon: AlertTriangle },
  'wc-wrong-info': { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Wrong Info', icon: AlertTriangle },
  'need-verification': { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Verification', icon: HelpCircle },
  'verification': { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Verification', icon: HelpCircle },
  'wc-awaiting-auth': { bg: 'bg-purple-50', text: 'text-purple-600', label: 'Verification', icon: HelpCircle },
  'refund-req': { bg: 'bg-red-50', text: 'text-red-600', label: 'Refund Req', icon: XCircle },
  'awaiting-refund': { bg: 'bg-red-50', text: 'text-red-600', label: 'Refund Req', icon: XCircle },
  'wc-awaiting-refund': { bg: 'bg-red-50', text: 'text-red-600', label: 'Refund Req', icon: XCircle },
  'refunded': { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Refunded', icon: DollarSign },
  'cancelled': { bg: 'bg-gray-200', text: 'text-gray-500', label: 'Cancelled', icon: XCircle },
};

export default function CommandCenter() {
  const [activeTab, setActiveTab] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingOrder, setEditingOrder] = useState(null);
  const [statusModalOrder, setStatusModalOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: activeTab,
        page: page.toString(),
        limit: '50',
        search,
      });

      // Only apply date filter if NOT searching
      if (!search) {
        params.append('fromYesterday', 'true');
      }

      const res = await fetch(`/api/supervisor/orders?${params}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeTab, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleMoveToWaiting = async (order) => {
    if (!confirm("آیا از پرداخت این سفارش توسط مشتری مطمئن هستید؟\n(این سفارش به صف انتظار منتقل خواهد شد)")) return;

    try {
      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            orderId: order.id, 
            status: 'waiting', 
            note: 'انتقال دستی به صف انتظار توسط سوپروایزر (تایید پرداخت)' 
        })
      });
      
      if (res.ok) {
        fetchOrders(); // Refresh list
      } else {
        alert("خطا در انتقال سفارش");
      }
    } catch (e) {
      console.error(e);
      alert("خطای شبکه");
    }
  };

  const togglePin = async (order) => {
    const newPinnedState = !order.is_pinned;
    // Optimistic update
    setOrders(orders.map(o => o.id === order.id ? { ...o, is_pinned: newPinnedState } : o));

    try {
      const res = await fetch('/api/admin/pin-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, isPinned: newPinnedState })
      });
      
      if (!res.ok) throw new Error('Failed to pin');
      
    } catch (error) {
      console.error("Pin failed", error);
      // Revert
      setOrders(orders.map(o => o.id === order.id ? { ...o, is_pinned: !newPinnedState } : o));
      alert("خطا در پین کردن سفارش");
    }
  };

  const handleStatusChange = async (orderId, newStatus, note) => {
    try {
      // Note: Using wp_order_id if available, or id. The API usually expects wp_order_id for WooCommerce sync.
      // We need to find the order to get its wp_order_id
      const order = orders.find(o => o.id === orderId);
      const targetId = order?.wp_order_id || orderId;

      const res = await fetch('/api/update-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: targetId, status: newStatus, note })
      });
      
      if (res.ok) {
        setStatusModalOrder(null);
        fetchOrders();
      } else {
        alert("خطا در تغییر وضعیت");
      }
    } catch (error) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleSaveEdit = async (orderId, updates) => {
    try {
      const res = await fetch('/api/admin/edit-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, ...updates })
      });
      if (res.ok) {
        setEditingOrder(null);
        fetchOrders();
      } else {
        alert("خطا در ذخیره اطلاعات");
      }
    } catch (error) {
      alert("خطا در ارتباط با سرور");
    }
  };

  const handleSyncCompleted = async () => {
    if (!confirm("آیا می‌خواهید ۵۰ سفارش آخر تکمیل شده را با سایت همگام‌سازی کنید؟")) return;
    
    try {
      const res = await fetch('/api/supervisor/sync-completed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const failedDetails = data.report.details.filter(d => d.error).map(d => `#${d.id}: ${d.error}`).join('\n');
        const successDetails = data.report.details.filter(d => d.status === 'synced').map(d => `#${d.id}`).join(', ');
        
        let msg = `✅ همگام‌سازی انجام شد.\nتعداد کل: ${data.report.total}\nموفق: ${data.report.success}\nنادیده گرفته شده (قبلاً سینک): ${data.report.skipped || 0}\nناموفق: ${data.report.failed}`;
        if (successDetails) msg += `\n\nسفارشات موفق:\n${successDetails.substring(0, 200)}...`;
        if (failedDetails) msg += `\n\nخطاها:\n${failedDetails}`;
        
        alert(msg);
      } else {
        alert("❌ خطا در همگام‌سازی");
      }
    } catch (e) {
      alert("❌ خطای شبکه");
    }
  };

  const formatPrice = (amount) => parseInt(amount || 0).toLocaleString();

  return (
    <div className="space-y-6">
      {/* HUD */}
      <StatsHUD />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden min-h-[600px]">
        {/* Header & Toolbar */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
              <span className="text-2xl">🎮</span> مرکز فرماندهی عملیات
            </h2>
            <button 
              onClick={handleSyncCompleted}
              className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 transition flex items-center gap-1 font-bold"
              title="همگام‌سازی وضعیت تکمیل شده‌ها با سایت"
            >
              <RefreshCw size={14} />
              سینک تکمیل‌شده‌ها
            </button>
          </div>
          
          <form onSubmit={handleSearch} className="flex w-full md:w-auto gap-2">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="جستجو (شماره سفارش، نام، موبایل...)" 
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm text-black placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 transition">
              <Search className="w-5 h-5" />
            </button>
            <button type="button" onClick={fetchOrders} className="bg-white border border-gray-200 text-gray-600 px-4 rounded-xl hover:bg-gray-50 transition" title="بروزرسانی">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto pb-2 gap-2 no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={`whitespace-nowrap px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="p-4 w-10 text-center">📌</th>
              <th className="p-4">شماره سفارش</th>
              <th className="p-4">عنوان سفارش</th>
              <th className="p-4">کاربر (موبایل)</th>
              <th className="p-4">مبلغ (تومان)</th>
              <th className="p-4 text-center">وضعیت</th>
              <th className="p-4">زمان دریافت</th>
              <th className="p-4">آخرین تغییر</th>
              <th className="p-4">اپراتور</th>
              <th className="p-4 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="10" className="p-10 text-center text-gray-400">در حال بارگذاری...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="10" className="p-10 text-center text-gray-400">هیچ سفارشی یافت نشد.</td></tr>
            ) : (
              orders.map(order => {
                // ✅ اصلاح نمایش: اگر processing است اما اپراتور ندارد، waiting نشان بده
                let displayStatus = order.status;
                if (order.status === 'processing' && !order.operator_name) {
                    displayStatus = 'waiting';
                }

                const statusConfig = STATUS_BADGES[displayStatus] || STATUS_BADGES['pending'];
                const StatusIcon = statusConfig.icon;
                
                // بررسی سفارش‌های گیر کرده (Stuck Orders)
                // اگر وضعیت processing باشد و بیش از ۳۰ دقیقه گذشته باشد
                let isStuck = false;
                if (order.status === 'processing' && order.assigned_at) {
                  const assignedTime = new Date(order.assigned_at).getTime();
                  const now = Date.now();
                  const diffMinutes = (now - assignedTime) / (1000 * 60);
                  if (diffMinutes > 30) isStuck = true;
                }

                return (
                  <tr 
                    key={order.id} 
                    className={`group hover:bg-gray-50 transition-colors 
                      ${order.is_pinned ? 'bg-amber-50 hover:bg-amber-100' : ''}
                      ${isStuck ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''}
                    `}
                  >
                    {/* Pin */}
                    <td className="p-4 text-center">
                      {isStuck && (
                        <div className="mb-1 flex justify-center" title="بیش از ۳۰ دقیقه در حال انجام">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 animate-pulse" />
                        </div>
                      )}
                      {(order.status === 'processing' || order.status === 'waiting') && (
                        <button 
                          onClick={() => togglePin(order)}
                          className={`p-2 rounded-full transition-all ${
                            order.is_pinned 
                              ? 'text-amber-500 bg-amber-100 hover:bg-amber-200' 
                              : 'text-gray-300 hover:text-amber-400 hover:bg-gray-100'
                          }`}
                          title={order.is_pinned ? "برداشتن پین" : "پین کردن به بالا"}
                        >
                          <Pin className={`w-4 h-4 ${order.is_pinned ? 'fill-current' : ''}`} />
                        </button>
                      )}
                    </td>

                    {/* Order ID */}
                    <td className="p-4">
                      <span className="font-mono font-bold text-gray-700 text-sm">#{order.wp_order_id || order.number || order.id}</span>
                    </td>

                    {/* Title */}
                    <td className="p-4">
                      <span className="font-bold text-gray-800 text-sm block max-w-[200px] truncate" title={order.order_title || order.line_items?.[0]?.name}>
                        {order.order_title || order.line_items?.[0]?.name || '---'}
                      </span>
                    </td>

                    {/* User */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm text-gray-700 dir-ltr">
                          {order.user?.phone_number || '---'}
                        </span>
                      </div>
                    </td>

                    {/* Price */}
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-green-600 text-sm">
                          {formatPrice(order.final_payable)}
                        </span>
                        {order.total_amount_gross !== order.final_payable && (
                           <span className="text-xs text-gray-400 line-through decoration-red-300">
                             {formatPrice(order.total_amount_gross)}
                           </span>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-1">
                          {order.coupon_code && (
                            <span className="text-[10px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded border border-pink-100 flex items-center gap-1" title="کد تخفیف">
                              <Tag className="w-3 h-3" /> {order.coupon_code}
                            </span>
                          )}
                          {order.affiliate_code && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 flex items-center gap-1" title="کد معرف">
                              <User className="w-3 h-3" /> {order.affiliate_code}
                            </span>
                          )}
                          {order.loyalty_redeemed > 0 && (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100 flex items-center gap-1" title="امتیاز باشگاه">
                              💎 {order.loyalty_redeemed}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4 text-center">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border ${statusConfig.bg} ${statusConfig.text} border-transparent`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        <span>{statusConfig.label}</span>
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="p-4 text-xs text-gray-500 font-mono text-center">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-700">
                          {new Date(order.created_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {new Date(order.created_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-gray-500 font-mono text-center">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-700">
                          {new Date(order.updated_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span className="text-[10px] opacity-70">
                          {new Date(order.updated_at).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </td>

                    {/* Operator */}
                    <td className="p-4 text-center">
                      {order.operator_name ? (
                        <span className="inline-block px-3 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 shadow-sm">
                          {order.operator_name}
                        </span>
                      ) : (
                        <span className="text-gray-300 text-xs">---</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {(order.status === 'pending' || order.status === 'on-hold') && (
                          <button 
                            onClick={() => handleMoveToWaiting(order)}
                            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-indigo-100 flex items-center gap-1"
                          >
                            <PlayCircle className="w-3 h-3" />
                            تایید پرداخت
                          </button>
                        )}
                        {!['completed', 'pending', 'cancelled'].includes(order.status) && (
                          <button 
                            onClick={() => setStatusModalOrder(order)}
                            className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs font-bold transition border border-blue-100"
                          >
                            تغییر وضعیت
                          </button>
                        )}
                        {order.status === 'wrong-info' && (
                          <button 
                            onClick={() => setEditingOrder(order)}
                            className="text-gray-400 hover:text-blue-600 hover:bg-gray-100 p-1.5 rounded-lg transition"
                            title="ویرایش اطلاعات"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex justify-center gap-2">
        <button 
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-3 py-1 rounded border disabled:opacity-50 text-sm"
        >
          قبلی
        </button>
        <span className="px-3 py-1 text-sm text-gray-600">
          صفحه {page} از {totalPages}
        </span>
        <button 
          disabled={page === totalPages}
          onClick={() => setPage(p => p + 1)}
          className="px-3 py-1 rounded border disabled:opacity-50 text-sm"
        >
          بعدی
        </button>
      </div>

      {/* Modals */}
      {editingOrder && (
        <EditOrderModal 
          order={editingOrder} 
          onClose={() => setEditingOrder(null)} 
          onSave={handleSaveEdit}
        />
      )}
      
      {statusModalOrder && (
        <StatusChangeModal
          order={statusModalOrder}
          onClose={() => setStatusModalOrder(null)}
          onSave={handleStatusChange}
        />
      )}
      </div>
    </div>
  );
}
