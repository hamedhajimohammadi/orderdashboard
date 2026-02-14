import React from 'react';
import { useOrderStore } from '@/store/useOrderStore';

// آیکون‌ها (می‌تونی از lucide-react استفاده کنی)
const CopyIcon = () => <span>📋</span>;

export default function ActiveSlot({ index }: { index: number }) {
  const { activeOrders, releaseOrder, completeOrder } = useOrderStore();
  const order = activeOrders[index]; // سفارش مربوط به این اسلات

  // حالت خالی: اسلات آماده کار
  if (!order) {
    return (
      <div className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
        <span className="text-2xl mb-2">⚡</span>
        <p className="font-medium">اسلات خالی {index + 1}</p>
        <span className="text-xs">آماده دریافت سفارش</span>
      </div>
    );
  }

  // حالت پر: نمایش اطلاعات حساس و اکشن‌ها
  return (
    <div className="h-48 bg-white border border-blue-200 shadow-md rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
      {/* نوار وضعیت بالا */}
      <div className="absolute top-0 left-0 w-1 bg-blue-500 h-full"></div>
      
      <div>
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-gray-800 text-sm">#{order.wp_order_id || order.number}</h3>
          <div className="flex flex-col items-end gap-1">
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
              {order.user?.first_name || order.billing?.first_name || 'کاربر'}
            </span>
            
            <div className="flex gap-1">
                {/* Verification Badge */}
                {order.user?.is_verified ? (
                    <span className="text-[10px] bg-green-100 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="هویت تایید شده">
                        <span className="text-xs">✓</span> احراز شده
                    </span>
                ) : (
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.5 rounded-md flex items-center gap-0.5" title="هویت تایید نشده">
                        <span className="text-xs">!</span> تایید نشده
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

        {/* دیتای حساس (MOCK) */}
        <div className="bg-gray-100 rounded p-2 mb-2 text-xs space-y-1">
            <div className="flex justify-between items-center">
                <span className="text-gray-500">User:</span>
                <div className="flex items-center gap-1 font-mono">
                    <span>user_game123</span>
                    <button className="hover:text-blue-600"><CopyIcon/></button>
                </div>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-gray-500">Pass:</span>
                <div className="flex items-center gap-1 font-mono">
                    <span>********</span>
                    <button className="hover:text-blue-600"><CopyIcon/></button>
                </div>
            </div>
        </div>
      </div>

      {/* دکمه‌های عملیات */}
      <div className="grid grid-cols-3 gap-2 mt-auto">
        <button 
          onClick={() => completeOrder(order.id)}
          className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs py-2 rounded-lg transition"
        >
          ✅ انجام
        </button>
        <button 
          className="bg-red-100 hover:bg-red-200 text-red-600 text-xs py-2 rounded-lg transition"
        >
          ❌ خطا
        </button>
        <button 
          onClick={() => releaseOrder(order.id)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs py-2 rounded-lg transition"
        >
          ↩️ رهاسازی
        </button>
      </div>
    </div>
  );
}
