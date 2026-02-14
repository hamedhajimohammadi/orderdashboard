"use client";
import { useOrderStore } from "@/store/useOrderStore";
import OrderTimer from "./OrderTimer"; 

export default function ActiveSlot({ index, onFocus }) {
  const { activeOrders, releaseOrder } = useOrderStore();
  const order = activeOrders[index];

  // 1. حالت خالی
  if (!order) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl h-48 flex flex-col items-center justify-center text-gray-300 gap-3 hover:bg-gray-100 transition duration-300 select-none">
        <span className="text-4xl opacity-50 grayscale">⚡</span>
        <span className="text-sm font-bold">میز کار {index + 1}</span>
      </div>
    );
  }

  // ✅ استخراج هوشمند داده‌ها
  const snapshot = order.snapshot_data || {};
  
  // استخراج نام: اولویت با دیتای یوزر در دیتابیس، بعد اسنپ‌شات ووکامرس
  const fName = order.user?.first_name || snapshot.billing?.first_name || "";
  const lName = order.user?.last_name || snapshot.billing?.last_name || "";
  const phone = order.user?.phone_number || snapshot.billing?.phone || "";

  // ساخت نام نمایشی: اگر نام داشت که هیچ، وگرنه شماره تماس، وگرنه "کاربر سیستم"
  const displayName = (fName || lName) ? `${fName} ${lName}` : (phone || "کاربر سیستم");
  
  // آیتم‌ها و شماره سفارش
  const lineItems = snapshot.line_items || [];
  const orderNumber = snapshot.number || order.wp_order_id || order.id;
  
  // زمان سفارش
  const orderDate = order.assigned_at || order.order_date || snapshot.date_created;

  // اولویت نمایش نام محصول با فیلد تغییر یافته در دیتابیس (برای تست شما)
  const productName = order.order_title || lineItems[0]?.name || "محصول نامشخص";

  return (
    <div className={`p-4 rounded-3xl shadow-sm border flex flex-col justify-between h-48 relative overflow-hidden group hover:shadow-lg transition duration-300 ${
      order.is_pinned 
        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200' 
        : 'bg-white border-blue-100'
    }`}>
      
      {order.is_pinned && (
        <div className="absolute -left-8 top-3 bg-amber-400 text-white text-[10px] font-bold py-1 px-10 -rotate-45 shadow-sm z-10">
          ویژه
        </div>
      )}

      <div className="flex justify-between items-start">
        <div className="flex flex-col">
           <span className="font-black text-gray-800 text-lg tracking-tight">#{orderNumber}</span>
           {/* نمایش نام یا شماره تماس */}
           <div className="flex flex-col gap-1">
             <div className="flex items-center gap-1">
               <span className="font-mono text-[10px] text-gray-400 truncate max-w-[120px]" title={displayName}>
                 {displayName}
               </span>
               {order.user?.telegram_chat_id && (
                 <span className="text-[8px] bg-blue-50 text-blue-500 px-1 rounded border border-blue-100" title="تلگرام دارد">
                   ✈️
                 </span>
               )}
             </div>

             {/* Badges */}
             <div className="flex items-center gap-1">
                {/* Verification Badge */}
                {order.user?.is_verified ? (
                    <span className="text-[8px] bg-green-100 text-green-700 border border-green-200 px-1 py-0.5 rounded flex items-center gap-0.5" title="هویت تایید شده">
                        ✓ احراز شده
                    </span>
                ) : (
                    <span className="text-[8px] bg-red-50 text-red-600 border border-red-100 px-1 py-0.5 rounded flex items-center gap-0.5" title="هویت تایید نشده">
                        ! تایید نشده
                    </span>
                )}
             </div>
           </div>
        </div>
        
        <OrderTimer dateCreated={orderDate} />
      </div>

      <div className="flex-1 flex flex-col justify-center my-1">
        <h3 className="text-sm text-gray-700 font-bold leading-relaxed line-clamp-2" title={productName}>
          {productName}
        </h3>
        
        {lineItems.length > 1 && (
            <div className="mt-1">
                <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-md font-bold inline-block border border-purple-200">
                    +{lineItems.length - 1} آیتم دیگر
                </span>
            </div>
        )}
      </div>

      <div className="flex gap-2 items-center mt-auto">
        <button 
          onClick={() => onFocus(order)}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-md shadow-blue-200"
        >
          <span>🚀</span>
          <span>شروع کار</span>
        </button>
        
        <button 
          onClick={() => releaseOrder(order.id)}
          className="w-10 h-10 bg-gray-50 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-xl flex items-center justify-center transition border border-gray-100"
          title="انصراف (بازگشت به صف)"
        >
          ✕
        </button>
      </div>
    </div>
  );
}