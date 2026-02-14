import { getExpenseCategories } from '@/app/actions/finance';
import AddExpenseForm from '@/components/admin/finance/AddExpenseForm';

export const dynamic = 'force-dynamic';

export default async function AddExpensePage() {
  const categories = await getExpenseCategories();

  return (
    <div className="p-8 bg-gray-50 min-h-screen font-sans" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-8 text-center">ثبت هزینه جدید</h1>
      <AddExpenseForm categories={categories} />
    </div>
  );
}
