"use client";
import React, { useState, useEffect } from 'react';
import HistoryTable from '@/components/dashboard/HistoryTable';

export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });

  const loadOrders = async () => {
    setLoading(true);
    try {
      // استفاده از پارامتر status=all برای دیدن تمام دیتای ایمپورت شده
      const res = await fetch(`/api/orders?status=all&page=${page}&limit=50`);
      const result = await res.json();
      
      if (result.success) {
        setOrders(result.data);
        setPagination(result.pagination);
      }
    } catch (err) {
      console.error("خطا در دریافت تاریخچه:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📋 لیست جامع سفارشات</h1>
            <p className="text-sm text-gray-500 mt-1">آرشیو تمام سفارش‌های ایمپورت شده از ووکامرس</p>
          </div>
          <button 
            onClick={() => loadOrders()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition"
          >
            بروزرسانی لیست
          </button>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-20 shadow-sm border border-gray-100 flex flex-col items-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
             <p className="text-gray-500">در حال لود کردن آرشیو...</p>
          </div>
        ) : (
          <>
            {/* استفاده از کامپوننتی که قبلاً اصلاح کردیم */}
            <HistoryTable orders={orders} showActions={false} />

            {/* کنترل صفحه‌بندی (Pagination) */}
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-gray-50 transition"
              >
                قبلی
              </button>
              
              <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                صفحه {page} از {pagination.totalPages}
              </div>

              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
                className="bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-40 hover:bg-gray-50 transition"
              >
                بعدی
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}