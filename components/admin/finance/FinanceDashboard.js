
'use client';
import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Calendar, RefreshCw } from 'lucide-react';

export default function FinanceDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('this_month'); // this_month, last_month, today

  const fetchStats = async () => {
    setLoading(true);
    try {
      // محاسبه تاریخ‌ها
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (dateRange === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (dateRange === 'today') {
        start = new Date(now.setHours(0,0,0,0));
      }

      const params = new URLSearchParams({
        start: start.toISOString(),
        end: end.toISOString()
      });

      const res = await fetch(`/api/finance/pnl?${params}`);
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const formatPrice = (n) => Math.floor(n || 0).toLocaleString();

  if (loading && !stats) return <div className="p-10 text-center">در حال محاسبه...</div>;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Toolbar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          داشبورد مالی
        </h2>
        <div className="flex gap-2">
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">امروز</option>
            <option value="this_month">این ماه</option>
            <option value="last_month">ماه گذشته</option>
          </select>
          <button onClick={fetchStats} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-bold mb-2">درآمد کل (فروش)</p>
          <p className="text-3xl font-black text-gray-800">{formatPrice(stats?.revenue)} <span className="text-sm text-gray-400">تومان</span></p>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-bold mb-2">سود ناخالص (تخمینی)</p>
          <p className="text-3xl font-black text-blue-600">{formatPrice(stats?.grossProfit)} <span className="text-sm text-gray-400">تومان</span></p>
          <p className="text-xs text-blue-400 mt-1">بر اساس مارجین دسته‌ها</p>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 text-sm font-bold mb-2">هزینه‌های عملیاتی</p>
          <p className="text-3xl font-black text-red-500">{formatPrice(stats?.expenses)} <span className="text-sm text-gray-400">تومان</span></p>
        </div>

        {/* Net Profit */}
        <div className={`p-6 rounded-3xl border shadow-sm ${stats?.netProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-gray-500 text-sm font-bold mb-2">سود خالص</p>
          <p className={`text-3xl font-black ${stats?.netProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {formatPrice(stats?.netProfit)} <span className="text-sm opacity-70">تومان</span>
          </p>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">جزئیات کسورات</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">پورسانت افیلیت‌ها</span>
              <span className="font-mono font-bold text-red-500">{formatPrice(stats?.affiliateCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">تخفیف‌های داده شده</span>
              <span className="font-mono font-bold text-orange-500">{formatPrice(stats?.discounts)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center text-gray-400">
          <p>نمودار روند سود (به زودی)</p>
        </div>
      </div>
    </div>
  );
}
