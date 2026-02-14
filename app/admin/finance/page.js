
'use client';
import FinanceDashboard from '@/components/admin/finance/FinanceDashboard';
import ExpensesManager from '@/components/admin/finance/ExpensesManager';
import MarginsManager from '@/components/admin/finance/MarginsManager';

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6 pb-20" dir="rtl">
      <h1 className="text-2xl font-black text-gray-800 mb-8">مدیریت مالی و حسابداری</h1>
      
      <div className="space-y-8">
        {/* 1. Dashboard Overview */}
        <section>
          <FinanceDashboard />
        </section>

        {/* 2. Management Tools */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ExpensesManager />
          </div>
          <div className="lg:col-span-1">
            <MarginsManager />
          </div>
        </section>
      </div>
    </div>
  );
}
