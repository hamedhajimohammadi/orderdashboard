'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, Users, Tag, Award, AlertCircle } from 'lucide-react';

const COLORS = {
  affiliate: '#8884d8', // Purple
  general: '#82ca9d',   // Green
  loyalty: '#ffc658',   // Yellow/Gold
  none: '#e5e7eb'       // Gray
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DiscountAnalysis() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/marketing?days=${days}`);
        const json = await res.json();
        if (json.success) {
          setData(json.data);
          setSummary(json.summary);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [days]);

  if (loading) return <div className="p-10 text-center text-gray-400">در حال بارگذاری تحلیل‌ها...</div>;
  if (!summary) return <div className="p-10 text-center text-red-400">خطا در دریافت اطلاعات</div>;

  const pieData = [
    { name: 'افیلیت', value: summary.affiliate_count, color: COLORS.affiliate },
    { name: 'تخفیف عمومی', value: summary.general_coupon_count, color: COLORS.general },
    { name: 'باشگاه مشتریان', value: summary.loyalty_count, color: COLORS.loyalty },
    { name: 'بدون تخفیف', value: summary.no_discount_count, color: COLORS.none },
  ].filter(d => d.value > 0);

  // Calculate percentages for insights
  const total = summary.total_orders;
  const clubShare = ((summary.loyalty_count / total) * 100).toFixed(1);
  const affiliateShare = ((summary.affiliate_count / total) * 100).toFixed(1);
  const organicShare = ((summary.no_discount_count / total) * 100).toFixed(1);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">تحلیل رفتار خرید و تخفیف‌ها</h2>
          <p className="text-gray-500 text-sm mt-1">بررسی تاثیر باشگاه مشتریان در مقایسه با افیلیت و تخفیف‌های عمومی</p>
        </div>
        <select 
          value={days} 
          onChange={(e) => setDays(Number(e.target.value))}
          className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">۷ روز گذشته</option>
          <option value="30">۳۰ روز گذشته</option>
          <option value="90">۳ ماه گذشته</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400">سهم افیلیت</p>
            <p className="text-xl font-bold text-gray-800">{affiliateShare}%</p>
            <p className="text-xs text-gray-400 mt-1">{summary.affiliate_count} سفارش</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400">سهم باشگاه مشتریان</p>
            <p className="text-xl font-bold text-gray-800">{clubShare}%</p>
            <p className="text-xs text-gray-400 mt-1">{summary.loyalty_count} سفارش</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400">تخفیف‌های عمومی</p>
            <p className="text-xl font-bold text-gray-800">{((summary.general_coupon_count / total) * 100).toFixed(1)}%</p>
            <p className="text-xs text-gray-400 mt-1">{summary.general_coupon_count} سفارش</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-gray-100 text-gray-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400">فروش ارگانیک (بدون کد)</p>
            <p className="text-xl font-bold text-gray-800">{organicShare}%</p>
            <p className="text-xs text-gray-400 mt-1">{summary.no_discount_count} سفارش</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trend Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-700 mb-6">روند روزانه استفاده از تخفیف‌ها</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" />
                <YAxis tick={{fontSize: 12}} stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Legend />
                <Bar dataKey="none" name="بدون تخفیف" stackId="a" fill={COLORS.none} radius={[0, 0, 4, 4]} />
                <Bar dataKey="general" name="تخفیف عمومی" stackId="a" fill={COLORS.general} />
                <Bar dataKey="affiliate" name="افیلیت" stackId="a" fill={COLORS.affiliate} />
                <Bar dataKey="loyalty" name="باشگاه مشتریان" stackId="a" fill={COLORS.loyalty} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <h3 className="font-bold text-gray-700 mb-2">توزیع کلی</h3>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderCustomizedLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Insight Box */}
          <div className="mt-4 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-bold text-blue-700 text-sm">تحلیل هوشمند</h4>
                <p className="text-xs text-blue-600 mt-1 leading-5">
                  {Number(clubShare) > Number(affiliateShare) 
                    ? "تبریک! سهم باشگاه مشتریان از افیلیت پیشی گرفته است. این نشان‌دهنده وفاداری بالای کاربران است."
                    : "هنوز سهم افیلیت بیشتر است. برای تقویت باشگاه مشتریان، می‌توانید کمپین‌های تشویقی (مثل امتیاز دو برابر) اجرا کنید."
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
