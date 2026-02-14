"use client";
import { useState, useEffect } from "react";

export default function StatsModal({ onClose }) {
  const [range, setRange] = useState("today");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Custom Date State
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    if (range !== 'custom') {
        fetchStats();
    }
  }, [range]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      let url = `/api/my-stats?range=${range}`;
      
      // Calculate precise dates for standard ranges to handle timezone correctly
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (range === 'today') {
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
      } else if (range === 'yesterday') {
          start.setDate(start.getDate() - 1);
          start.setHours(0, 0, 0, 0);
          end.setDate(end.getDate() - 1);
          end.setHours(23, 59, 59, 999);
      } else if (range === 'custom') {
          if (!customStart || !customEnd) {
              setLoading(false);
              return;
          }
          start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
      }

      // Append explicit dates to URL
      if (range === 'today' || range === 'yesterday' || range === 'custom') {
          url += `&from=${start.toISOString()}&to=${end.toISOString()}`;
      }

      const res = await fetch(url);
      
      if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const text = await res.text();
      if (!text) {
          throw new Error("Empty response from server");
      }

      const data = JSON.parse(text);
      
      if (data.success) {
        setStats(data.data);
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error("Failed to fetch stats", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = () => {
      if (customStart && customEnd) {
          fetchStats();
      }
  };

  const formatTime = (seconds) => {
    if (!seconds) return "---";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h} ساعت و ${m} دقیقه`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm p-4" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
                📊 گزارش عملکرد من
            </h2>
            <button onClick={onClose} className="bg-gray-200 hover:bg-red-500 hover:text-white rounded-xl w-8 h-8 flex items-center justify-center transition">✕</button>
        </div>

        {/* Filters */}
        <div className="p-4 flex flex-col gap-3 bg-white border-b">
            <div className="flex gap-2 justify-center flex-wrap">
                {[
                    { id: 'today', label: 'امروز' },
                    { id: 'yesterday', label: 'دیروز' },
                    { id: 'week', label: '۷ روز اخیر' },
                    { id: 'month', label: '۳۰ روز اخیر' },
                    { id: 'custom', label: '📅 بازه دلخواه' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setRange(tab.id)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                            range === tab.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Custom Date Picker */}
            {range === 'custom' && (
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 animate-in slide-in-from-top-2">
                    <div className="flex flex-col gap-1 flex-1">
                        <span className="text-[10px] text-gray-500 font-bold">از تاریخ:</span>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <span className="text-[10px] text-gray-500 font-bold">تا تاریخ:</span>
                        <input 
                            type="date" 
                            className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={handleCustomSearch}
                        disabled={!customStart || !customEnd}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed h-full mt-4"
                    >
                        مشاهده
                    </button>
                </div>
            )}
        </div>

        {/* Content */}
        <div className="p-6 min-h-[300px]">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs">در حال محاسبه آمار...</span>
                </div>
            ) : stats ? (
                <div className="grid grid-cols-2 gap-4">
                    
                    {/* Card 1: Completed Orders */}
                    <div className="col-span-2 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-emerald-600 text-xs font-bold mb-1">سفارشات تکمیل شده</p>
                            <p className="text-3xl font-black text-emerald-800">{stats.totalOrders}</p>
                        </div>
                        <span className="text-4xl">✅</span>
                    </div>

                    {/* Card 2: Earnings */}
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                        <span className="text-2xl mb-2">💰</span>
                        <p className="text-amber-600 text-[10px] font-bold mb-1">پاداش تقریبی</p>
                        <p className="text-xl font-black text-amber-800">
                            {stats.estimatedEarnings.toLocaleString()} <span className="text-xs font-normal">تومان</span>
                        </p>
                    </div>

                    {/* Card 3: Avg Speed */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-4 rounded-2xl flex flex-col justify-center items-center text-center">
                        <span className="text-2xl mb-2">⚡</span>
                        <p className="text-blue-600 text-[10px] font-bold mb-1">میانگین سرعت</p>
                        <p className="text-xl font-black text-blue-800">
                            {stats.avgTimeMinutes} <span className="text-xs font-normal">دقیقه</span>
                        </p>
                    </div>

                    {/* Card 4: Active Time (Only for Today) */}
                    {range === 'today' && (
                        <div className="col-span-2 bg-gray-50 border border-gray-200 p-4 rounded-2xl flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⏱️</span>
                                <div>
                                    <p className="text-gray-500 text-xs font-bold">زمان فعالیت مفید امروز</p>
                                    <p className="text-lg font-black text-gray-700">{formatTime(stats.activeSeconds)}</p>
                                </div>
                            </div>
                            {stats.activeSeconds > 0 && (
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400">راندمان</p>
                                    <p className="text-sm font-bold text-gray-600">
                                        {Math.round((stats.totalOrders / (stats.activeSeconds / 3600)) * 10) / 10 || 0} سفارش/ساعت
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {range !== 'today' && (
                        <div className="col-span-2 text-center text-[10px] text-gray-400 bg-gray-50 p-2 rounded-xl border border-dashed">
                            * زمان فعالیت فقط برای "امروز" محاسبه می‌شود.
                        </div>
                    )}

                </div>
            ) : (
                <div className="text-center text-gray-400 flex flex-col items-center justify-center h-full gap-2">
                    <span className="text-4xl grayscale opacity-50">📉</span>
                    <span>اطلاعاتی برای این بازه یافت نشد.</span>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
