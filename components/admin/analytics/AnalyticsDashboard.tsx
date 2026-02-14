'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { ArrowUp, ArrowDown, DollarSign, ShoppingCart, Activity, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const STATUS_LABELS = {
  'completed': 'تکمیل شده',
  'processing': 'در حال انجام',
  'waiting': 'آماده انجام',
  'pending': 'در انتظار پرداخت',
  'cancelled': 'لغو شده',
  'failed': 'ناموفق',
  'refunded': 'مسترد شده',
  'wrong-info': 'اطلاعات اشتباه',
  'need-verification': 'نیاز به احراز'
};

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?days=${period}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch analytics", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center animate-pulse">در حال بارگذاری آمار...</div>;
  if (!data) return <div className="p-10 text-center text-red-500">خطا در دریافت اطلاعات</div>;

  const { trend, statusDistribution, summary } = data;

  // Format status data for Pie Chart
  const pieData = statusDistribution.map(item => ({
    name: STATUS_LABELS[item.name] || item.name,
    value: item.value
  })).sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800">تحلیل و آمار فروش</h2>
          <p className="text-gray-500 text-sm">گزارش عملکرد فروشگاه در {period} روز گذشته</p>
        </div>
        
        <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setPeriod(days)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                period === days 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {days} روز
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="فروش کل" 
          value={summary.revenue.toLocaleString()} 
          unit="تومان"
          growth={summary.revenueGrowth}
          icon={DollarSign}
          color="blue"
        />
        <StatCard 
          title="تعداد سفارشات" 
          value={summary.orders.toLocaleString()} 
          unit="سفارش"
          growth={summary.ordersGrowth}
          icon={ShoppingCart}
          color="emerald"
        />
        <StatCard 
          title="میانگین ارزش سفارش (AOV)" 
          value={summary.aov.toLocaleString()} 
          unit="تومان"
          icon={Activity}
          color="purple"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend (Line Chart) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            روند فروش روزانه
          </h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{fontSize: 10, fill: '#9CA3AF'}} 
                  tickFormatter={(str) => str.slice(5)} // Show MM-DD
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{fontSize: 10, fill: '#9CA3AF'}} 
                  tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}
                  formatter={(value) => Number(value).toLocaleString()}
                  labelStyle={{color: '#6B7280', marginBottom: '5px'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="فروش (تومان)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-6">وضعیت سفارشات</h3>
          <div className="h-[300px] w-full relative" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{fontSize: '11px', paddingTop: '20px'}}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <span className="block text-2xl font-black text-gray-800">{summary.orders}</span>
                <span className="text-xs text-gray-400">کل سفارشات</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-6">تعداد سفارشات روزانه</h3>
        <div className="h-[250px] w-full" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{fontSize: 10, fill: '#9CA3AF'}} 
                tickFormatter={(str) => str.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{fontSize: 10, fill: '#9CA3AF'}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: '#F3F4F6'}}
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.05)'}}
              />
              <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} name="تعداد سفارش" barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, unit, growth = null, icon: Icon, color }) {
  const isPositive = parseFloat(growth) >= 0;
  
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${colorClasses[color] || 'bg-gray-50'}`}>
          <Icon className="w-6 h-6" />
        </div>
        {growth && (
          <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
            {Math.abs(growth)}%
          </div>
        )}
      </div>
      <div>
        <h4 className="text-gray-400 text-sm font-medium mb-1">{title}</h4>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-gray-800">{value}</span>
          {unit && <span className="text-xs text-gray-400">{unit}</span>}
        </div>
      </div>
    </div>
  );
}
