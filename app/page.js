"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useOrderStore } from "@/store/useOrderStore";
import ActiveSlot from "@/components/ActiveSlot";
import FocusModal from "@/components/FocusModal";
import OrdersTable from "@/components/OrdersTable";
import HistoryTable from "@/components/HistoryTable";
import DashboardHeader from "@/components/DashboardHeader";
import OrderTimer from "@/components/OrderTimer";

export default function Home() {
  const { 
    pendingOrders, activeOrders, fetchOrders, reserveOrder, 
    isLoading, fetchAllOrders, isOnline,
    fetchMyHistory, myHistoryOrders, fetchCurrentUser
  } = useOrderStore();
  
  const [focusedOrder, setFocusedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [queueSearch, setQueueSearch] = useState("");
  
  const prevPendingCount = useRef(0);

  // Helper for Persian digits
  const normalizeDigits = (str) => {
    if (!str) return "";
    return str.toString().replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  // لود اولیه و تنظیم اینتروال آپدیت
  useEffect(() => { 
      fetchCurrentUser(); // دریافت اطلاعات کاربر
      fetchOrders(); 
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
  }, []);

  // لود دیتا بر اساس تب فعال
  useEffect(() => {
    if (activeTab === 'my_history') {
        fetchMyHistory();
    }
  }, [activeTab]);

  // پخش صدا
  useEffect(() => {
      if (pendingOrders.length > prevPendingCount.current && prevPendingCount.current !== 0) {
          playAudio('/sounds/new-order.mp3');
      }
      prevPendingCount.current = pendingOrders.length;
  }, [pendingOrders]);

  const playAudio = (path) => {
      try {
          new Audio(path).play().catch(e => console.log("Audio blocked:", e));
      } catch (e) { console.error(e); }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (activeTab !== 'all_orders') setActiveTab('all_orders');
    fetchAllOrders(query);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans pb-20" dir="rtl">
      
      {focusedOrder && <FocusModal order={focusedOrder} onClose={() => setFocusedOrder(null)} />}

      {/* هدر */}
      <DashboardHeader onSearch={handleSearch} />

      {/* تب‌ها */}
      <div className="flex gap-4 mb-6 border-b border-gray-200 pb-1 overflow-x-auto">
            <button 
                onClick={() => setActiveTab("dashboard")}
                className={`pb-2 px-2 text-sm font-bold transition border-b-2 whitespace-nowrap ${activeTab === 'dashboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                💻 میز کار & صف انتظار
            </button>

            <button 
                onClick={() => setActiveTab("my_history")}
                className={`pb-2 px-2 text-sm font-bold transition border-b-2 whitespace-nowrap flex items-center gap-1 ${activeTab === 'my_history' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-orange-600'}`}
            >
                📂 سوابق و پیگیری‌های من
                <span className="bg-orange-100 text-orange-600 text-[10px] px-1.5 py-0.5 rounded-full">مهم</span>
            </button>

            <button 
                onClick={() => setActiveTab("all_orders")}
                className={`pb-2 px-2 text-sm font-bold transition border-b-2 whitespace-nowrap ${activeTab === 'all_orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
                📋 لیست جامع همه سفارشات
            </button>
      </div>

      {activeTab === "dashboard" && (
        <>
            {/* میز کار */}
            <section className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <h2 className="text-gray-400 text-xs font-bold mb-3 mr-1">میز کار شما (۴ عدد)</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[0, 1, 2, 3].map((i) => (
                    <ActiveSlot key={i} index={i} onFocus={setFocusedOrder} />
                ))}
                </div>
            </section>
            
            {/* صف انتظار */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
                    <h2 className="text-gray-700 font-bold flex items-center gap-2">
                        صف انتظار (Marketplace)
                        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs">{pendingOrders.length}</span>
                    </h2>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <input 
                            type="text" 
                            placeholder="🔍 جستجو در صف..." 
                            value={queueSearch}
                            onChange={(e) => setQueueSearch(e.target.value)}
                            className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs w-full md:w-48 focus:outline-none focus:border-blue-500"
                        />
                        <button onClick={fetchOrders} className="text-xs text-blue-500 hover:text-blue-700 font-bold whitespace-nowrap">🔄 بروزرسانی</button>
                    </div>
                </div>

                {isLoading && pendingOrders.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">در حال بارگذاری...</div>
                ) : (
                    <div className="space-y-3">
                        {pendingOrders
                        .filter(order => {
                            if (!queueSearch) return true;
                            const term = normalizeDigits(queueSearch);
                            const orderNum = normalizeDigits(order.number || order.wp_order_id || "");
                            const orderTitle = normalizeDigits(order.order_title || order.line_items?.[0]?.name || "");
                            return orderNum.includes(term) || orderTitle.includes(term);
                        })
                        .map((order) => {
                            // دریافت اطلاعات امن از اسنپ‌شات یا روت
                            const snapshot = order.snapshot_data || {};
                            const lineItems = snapshot.line_items || [];
                            const orderNumber = order.number || snapshot.number || order.wp_order_id;
                            const orderTotal = order.final_payable || snapshot.total || 0;

                            const isVIP = order.isFlagged || order.meta_data?.some(m => m.key === 'is_vip' && m.value === 'yes');
                            
                            return (
                                <div key={order.id} className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition group relative overflow-hidden
                                    ${isVIP ? 'border-amber-400 bg-amber-50/30' : 'border-gray-100'} 
                                    ${!isOnline ? 'opacity-60 grayscale-[0.8]' : ''}
                                `}>
                                    
                                    {/* نوار رنگی کنار کارت */}
                                    <div className={`absolute right-0 top-0 bottom-0 w-1 ${
                                        isVIP 
                                        ? 'bg-amber-400' 
                                        : (lineItems.length > 1 ? 'bg-purple-500' : 'bg-blue-500')
                                    }`}></div>

                                    <div className="flex items-center gap-4 w-full md:w-auto pr-3 flex-1">
                                        <span className={`font-mono font-bold text-xs px-2 py-1 rounded border whitespace-nowrap ${isVIP ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                            #{orderNumber} {isVIP && '⭐ VIP'}
                                        </span>
                                        
                                        <div className="flex flex-col gap-1 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-bold text-gray-800 text-sm md:text-base truncate leading-tight" title={lineItems[0]?.name || order.order_title}>
                                                    {lineItems[0]?.name || order.order_title || "محصول نامشخص"}
                                                </h3>
                                                
                                                {/* ✅ اصلاح شده: بدون ارور سینتکس */}
                                                {lineItems.length > 1 && (
                                                    <span className="text-[10px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-bold whitespace-nowrap border border-purple-200">
                                                        +{lineItems.length - 1} دیگر
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                    {parseInt(orderTotal).toLocaleString()} ت
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-row-reverse md:flex-row items-center gap-3 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0 pl-1">
                                        <OrderTimer dateCreated={order.date_created_gmt || order.date_created || order.order_date} />

                                        <button 
                                            onClick={() => reserveOrder(order.id)} 
                                            disabled={!isOnline}
                                            className={`px-6 py-2 rounded-xl text-sm font-bold transition shadow-md whitespace-nowrap flex items-center gap-2
                                                ${isOnline 
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200' 
                                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'}
                                            `}
                                        >
                                            <span>{isOnline ? 'انجام سفارش' : 'استراحت ⛔'}</span>
                                            {isOnline && <span className="text-lg">👈</span>}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </>
      )}

      {activeTab === "my_history" && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-gray-700 font-bold flex items-center gap-2">
                    سوابق و پیگیری‌های من
                    <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-xs">{myHistoryOrders?.length || 0}</span>
                </h2>
                <button onClick={fetchMyHistory} className="text-blue-500 text-sm hover:underline">🔄 بروزرسانی</button>
            </div>
            {isLoading ? (
                <div className="text-center py-10 text-gray-400">در حال دریافت سوابق...</div>
            ) : (
                <HistoryTable orders={myHistoryOrders} showActions={true} />
            )}
        </section>
      )}

      {activeTab === "all_orders" && (
        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <OrdersTable onOrderClick={setFocusedOrder} />
        </section>
      )}

    </div>
  );
}