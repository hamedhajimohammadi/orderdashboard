import { getFinancialDashboardData, getExpenses } from '@/app/actions/finance';
import ProfitabilityCards from '@/components/admin/finance/ProfitabilityCards';
import ExpenseBreakdownChart from '@/components/admin/finance/ExpenseBreakdownChart';
import MonthlyTrendChart from '@/components/admin/finance/MonthlyTrendChart';
import ExpenseList from '@/components/admin/finance/ExpenseList';
import DateRangeFilter from '@/components/admin/finance/DateRangeFilter';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function FinanceDashboard({ searchParams }: { searchParams: { startDate?: string, endDate?: string } }) {
  const { startDate, endDate } = await searchParams;
  const { dailyStats, monthlyStats, trendData } = await getFinancialDashboardData(startDate, endDate);
  
  // Pass filters to getExpenses if needed, for now just last 10
  const { expenses } = await getExpenses(1, 10, { startDate, endDate }); 

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans" dir="rtl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">داشبورد مالی و حسابداری</h1>
        
        <div className="flex flex-wrap gap-3 items-center">
          <DateRangeFilter />
          
          <Link href="/admin/finance/expenses" className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
            مدیریت هزینه‌ها
          </Link>
          <Link href="/admin/finance/expenses/add" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 text-sm">
            + ثبت هزینه جدید
          </Link>
        </div>
      </div>

      {/* 1. Profitability Cards */}
      <ProfitabilityCards daily={dailyStats} monthly={monthlyStats} />

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={trendData} />
        </div>
        <div>
          <ExpenseBreakdownChart data={monthlyStats.expensesByCategory} />
        </div>
      </div>

      {/* 3. Recent Expenses */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">آخرین هزینه‌ها</h2>
          <Link href="/admin/finance/expenses" className="text-blue-600 text-sm hover:underline">
            مشاهده همه
          </Link>
        </div>
        <ExpenseList initialExpenses={expenses} />
      </div>
    </div>
  );
}
