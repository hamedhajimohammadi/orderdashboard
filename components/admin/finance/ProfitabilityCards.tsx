'use client';

import { ArrowUpIcon, ArrowDownIcon, DollarSign } from 'lucide-react';

function StatCard({ title, value, subtext, type = 'neutral' }: any) {
  let colorClass = 'text-gray-900';
  if (type === 'positive') colorClass = 'text-green-600';
  if (type === 'negative') colorClass = 'text-red-600';

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <div className={`mt-2 text-3xl font-bold ${colorClass}`}>
        {value}
      </div>
      {subtext && <p className="mt-1 text-sm text-gray-400">{subtext}</p>}
    </div>
  );
}

export default function ProfitabilityCards({ daily, monthly }: any) {
  // Format currency
  const format = (n: number) => new Intl.NumberFormat('fa-IR').format(n) + ' تومان';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Daily Stats */}
      <StatCard 
        title="سود خالص امروز (True Net Profit)" 
        value={format(daily.trueNetProfit)}
        subtext={`درآمد ناخالص: ${format(daily.dailyGrossProfit)} | هزینه: ${format(daily.dailyDirectCost + daily.dailyOverhead)}`}
        type={daily.trueNetProfit >= 0 ? 'positive' : 'negative'}
      />
      
      <StatCard 
        title="سود خالص این ماه" 
        value={format(monthly.netProfit)}
        subtext={`کل درآمد: ${format(monthly.totalRevenue)}`}
        type={monthly.netProfit >= 0 ? 'positive' : 'negative'}
      />

      <StatCard 
        title="هزینه‌های این ماه" 
        value={format(monthly.totalExpenses)}
        subtext="شامل هزینه‌های ثابت و متغیر"
        type="negative"
      />
    </div>
  );
}
