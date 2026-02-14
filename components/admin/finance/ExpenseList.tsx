'use client';

import { useState } from 'react';
import { payExpense, deleteExpense } from '@/app/actions/finance';

export default function ExpenseList({ initialExpenses }: { initialExpenses: any[] }) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [loading, setLoading] = useState<number | null>(null);

  const handlePay = async (id: number) => {
    if (!confirm('آیا از پرداخت این هزینه اطمینان دارید؟')) return;
    setLoading(id);
    try {
      await payExpense(id);
      // Optimistic update or reload
      window.location.reload(); 
    } catch (error) {
      alert('خطا در پرداخت');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('حذف شود؟')) return;
    await deleteExpense(id);
    window.location.reload();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">لیست هزینه‌ها</h3>
        {/* Add Button would go here */}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="p-4">عنوان</th>
              <th className="p-4">مبلغ</th>
              <th className="p-4">دسته</th>
              <th className="p-4">سررسید</th>
              <th className="p-4">وضعیت</th>
              <th className="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="p-4 font-medium">{expense.title}</td>
                <td className="p-4">{Number(expense.amount).toLocaleString()}</td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                    {expense.category.name}
                  </span>
                </td>
                <td className="p-4">{new Date(expense.due_date).toLocaleDateString('fa-IR')}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    expense.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    expense.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {expense.status === 'PAID' ? 'پرداخت شده' : 
                     expense.status === 'OVERDUE' ? 'معوقه' : 'در انتظار'}
                  </span>
                </td>
                <td className="p-4 flex gap-2">
                  {expense.status === 'PENDING' && (
                    <button 
                      onClick={() => handlePay(expense.id)}
                      disabled={loading === expense.id}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                    >
                      {loading === expense.id ? '...' : 'پرداخت'}
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(expense.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 text-xs"
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
