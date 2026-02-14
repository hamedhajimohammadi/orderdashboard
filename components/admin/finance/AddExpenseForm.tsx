'use client';

import { useState } from 'react';
import { createExpense } from '@/app/actions/finance';
import { useRouter } from 'next/navigation';

export default function AddExpenseForm({ categories }: { categories: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await createExpense(data);
      router.push('/admin/finance');
    } catch (error) {
      alert('خطا در ثبت هزینه');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">عنوان هزینه</label>
          <input name="title" required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="مثلا: اجاره سرور" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ (تومان)</label>
          <input name="amount" type="number" required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">دسته‌بندی</label>
          <select name="category_id" required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">تاریخ سررسید</label>
          <input name="due_date" type="date" required className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>

        <div className="flex items-center gap-4 pt-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="is_recurring" type="checkbox" value="true" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">هزینه تکرار شونده (ماهانه)</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input name="is_overhead" type="checkbox" value="true" className="w-5 h-5 text-blue-600 rounded" />
            <span className="text-sm text-gray-700 font-bold text-red-600">هزینه سربار (Overhead)</span>
          </label>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
          <textarea name="description" rows={3} className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"></textarea>
        </div>

      </div>

      <div className="mt-8 flex justify-end gap-3">
        <button type="button" onClick={() => router.back()} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
          انصراف
        </button>
        <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200">
          {loading ? 'در حال ثبت...' : 'ثبت هزینه'}
        </button>
      </div>
    </form>
  );
}
