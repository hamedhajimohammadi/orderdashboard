"use client";
import { useOrderStore } from "@/store/useOrderStore";
import { useState, useEffect } from "react";
import { ArrowUpDown } from 'lucide-react';

export default function OrdersTable() {
  const { allOrders, isSearching, pagination, fetchAllOrders } = useOrderStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState('order_date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchAllOrders();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAllOrders(searchTerm, 1, sortBy, sortOrder);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
        fetchAllOrders(searchTerm, newPage, sortBy, sortOrder);
    }
  };

  const handleSort = (field) => {
    const newOrder = (sortBy === field && sortOrder === 'desc') ? 'asc' : 'desc';
    setSortBy(field);
    setSortOrder(newOrder);
    fetchAllOrders(searchTerm, 1, field, newOrder);
  };

  const getStatusBadge = (status) => {
    const map = {
        completed: { text: 'تکمیل شده', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        processing: { text: 'در حال انجام', color: 'bg-blue-100 text-blue-700 border-blue-200' },
        waiting: { text: 'آماده انجام', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' }, // ✅ اضافه شد
        'on-hold': { text: 'در انتظار پرداخت', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        'pending': { text: 'در انتظار پرداخت', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
        'refund-req': { text: 'در انتظار استرداد', color: 'bg-red-100 text-red-700 border-red-200' },
        'awaiting-refund': { text: 'در انتظار استرداد', color: 'bg-red-100 text-red-700 border-red-200' },
        'refunded': { text: 'مسترد شد', color: 'bg-gray-100 text-gray-700 border-gray-200' }, // ✅ اضافه شد
        'failed': { text: 'ناموفق', color: 'bg-red-50 text-red-600 border-red-100' },
        'cancelled': { text: 'لغو شده', color: 'bg-gray-50 text-gray-500 border-gray-200' },
        'wrong-info': { text: 'اطلاعات اشتباه', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        'wrong_info': { text: 'اطلاعات اشتباه', color: 'bg-orange-100 text-orange-700 border-orange-200' },
        'need-verification': { text: 'نیاز به احراز', color: 'bg-purple-100 text-purple-700 border-purple-200' },
        'verification': { text: 'نیاز به احراز', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    };
    const current = map[status] || { text: status, color: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2 py-1 rounded-md text-xs font-bold border ${current.color}`}>{current.text}</span>;
  };

  return (
    <div className="flex flex-col gap-4">
        {/* Search Box */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
            <form onSubmit={handleSearch} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="جستجو در سفارشات (شماره سفارش، نام مشتری، نام اپراتور...)" 
                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition">
                    جستجو
                </button>
            </form>
        </div>

        {isSearching ? (
            <div className="text-center py-20 text-gray-400 animate-pulse bg-white rounded-2xl border border-gray-200">⏳ در حال دریافت لیست از دیتابیس...</div>
        ) : (!allOrders || allOrders.length === 0) ? (
            <div className="text-center py-20 text-gray-400 border-2 border-dashed rounded-xl bg-white">سفارشی یافت نشد.</div>
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="p-4 font-bold cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('order_id')}>
                                    <div className="flex items-center gap-1">
                                        # سفارش 
                                        {sortBy === 'order_id' && <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                                    </div>
                                </th>
                                <th className="p-4 font-bold">مشتری</th>
                                <th className="p-4 font-bold">محصول</th>
                                <th className="p-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('order_date')}>
                                    <div className="flex items-center justify-center gap-1">
                                        تاریخ ثبت
                                        {sortBy === 'order_date' && <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                                    </div>
                                </th>
                                <th className="p-4 font-bold text-center">آخرین وضعیت</th>
                                <th className="p-4 font-bold text-center">اپراتور (تغییر دهنده)</th>
                                <th className="p-4 font-bold text-center cursor-pointer hover:bg-gray-100 transition" onClick={() => handleSort('updated')}>
                                    <div className="flex items-center justify-center gap-1">
                                        تاریخ آخرین تغییر
                                        {sortBy === 'updated' && <ArrowUpDown size={14} className={sortOrder === 'asc' ? 'rotate-180' : ''} />}
                                    </div>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {allOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-blue-50/50 transition duration-150 group">
                                    <td className="p-4 font-bold text-gray-800 font-mono">#{order.wp_order_id}</td>
                                    
                                    <td className="p-4">
                                        <div className="font-bold text-gray-700 flex flex-col gap-1">
                                            <div className="flex items-center gap-1">
                                                {order.user?.first_name} {order.user?.last_name || ''}
                                                {order.user?.telegram_chat_id && (
                                                    <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full border border-blue-100" title="تلگرام متصل است">
                                                        ✈️
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Badges Row */}
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {/* Verification Badge */}
                                                {order.user?.is_verified ? (
                                                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md flex items-center gap-1" title="هویت تایید شده">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                                        احراز شده
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md flex items-center gap-1" title="هویت تایید نشده">
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                        تایید نشده
                                                    </span>
                                                )}

                                                {/* Order Count Badge */}
                                                {order.user?.orders_count === 1 ? (
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-md">
                                                        سفارش اول
                                                    </span>
                                                ) : (order.user?.orders_count > 1) ? (
                                                    <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-md">
                                                        {order.user.orders_count}مین سفارش
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-mono mt-1">{order.user?.phone_number || order.user?.phone}</div>
                                    </td>

                                    <td className="p-4 text-gray-600 font-bold">
                                        {order.order_title || "---"}
                                    </td>

                                    <td className="p-4 text-gray-500 text-xs font-mono text-center">
                                        {new Date(order.order_date).toLocaleDateString('fa-IR')}
                                        <br/>
                                        {new Date(order.order_date).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                                    </td>

                                    <td className="p-4 text-center">
                                      {(() => {
                                        let displayStatus = order.status;
                                        if (order.status === 'processing' && !order.operator_name) {
                                            displayStatus = 'waiting';
                                        }
                                        return getStatusBadge(displayStatus);
                                      })()}
                                    </td>
                                    
                                    <td className="p-4 text-center font-bold text-gray-700">
                                        {order.operator_name || <span className="text-gray-400 text-xs">نامشخص</span>}
                                    </td>

                                    <td className="p-4 text-gray-500 text-xs font-mono text-center">
                                        {new Date(order.updated_at).toLocaleDateString('fa-IR')}
                                        <br/>
                                        {new Date(order.updated_at).toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-6 p-6 border-t bg-gray-50">
                        <button 
                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                            disabled={pagination.currentPage === 1}
                            className="px-6 py-2 rounded-xl font-bold transition shadow-sm bg-white border border-gray-300 text-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-gray-700 disabled:hover:border-gray-300"
                        >
                            قبلی
                        </button>
                        
                        <span className="text-sm font-bold text-gray-600 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                            صفحه {pagination.currentPage} از {pagination.totalPages}
                        </span>

                        <button 
                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                            disabled={pagination.currentPage === pagination.totalPages}
                            className="px-6 py-2 rounded-xl font-bold transition shadow-sm bg-blue-600 text-white border border-blue-600 hover:bg-blue-700 hover:border-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            بعدی
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
  );
}
