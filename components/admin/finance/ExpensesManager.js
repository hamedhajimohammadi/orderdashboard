
'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Bell } from 'lucide-react';
import DatePicker from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";

export default function ExpensesManager() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'other',
    type: 'one_time',
    date: new Date(),
    due_date: null,
    description: ''
  });

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch('/api/finance/expenses');
    const data = await res.json();
    if (data.success) setExpenses(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // اطمینان از اینکه تاریخ‌ها معتبر هستند
      const payload = {
        ...formData,
        date: formData.date instanceof Date ? formData.date.toISOString() : new Date().toISOString(),
        due_date: formData.due_date instanceof Date ? formData.due_date.toISOString() : null,
        amount: formData.amount.toString() // تبدیل به رشته برای اطمینان
      };

      const res = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setShowForm(false);
        fetchExpenses();
        setFormData({ 
          title: '', 
          amount: '', 
          category: 'other', 
          type: 'one_time', 
          date: new Date(), 
          due_date: null, 
          description: '' 
        });
        alert('هزینه با موفقیت ثبت شد');
      } else {
        console.error("Server Error:", data);
        alert(`خطا در ثبت هزینه: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Network Error:", error);
      alert('خطا در ارتباط با سرور');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 text-lg">مدیریت هزینه‌ها</h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" /> ثبت هزینه جدید
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-2xl mb-6 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            placeholder="عنوان هزینه (مثلا: اجاره سرور)" 
            className="p-3 rounded-xl border outline-none"
            value={formData.title}
            onChange={e => setFormData({...formData, title: e.target.value})}
            required
          />
          <input 
            type="number"
            placeholder="مبلغ (تومان)" 
            className="p-3 rounded-xl border outline-none"
            value={formData.amount}
            onChange={e => setFormData({...formData, amount: e.target.value})}
            required
          />
          <select 
            className="p-3 rounded-xl border outline-none bg-white"
            value={formData.category}
            onChange={e => setFormData({...formData, category: e.target.value})}
          >
            <option value="marketing">تبلیغات و مارکتینگ</option>
            <option value="salary">حقوق و دستمزد</option>
            <option value="infrastructure">زیرساخت و سرور</option>
            <option value="office">اداری و دفتری</option>
            <option value="other">سایر</option>
          </select>
          
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 pr-1">تاریخ هزینه</label>
            <DatePicker
              value={formData.date}
              onChange={(date) => setFormData({...formData, date: date?.toDate()})}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              inputClass="w-full p-3 rounded-xl border outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500 pr-1 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              یادآوری سررسید (اختیاری)
            </label>
            <DatePicker
              value={formData.due_date}
              onChange={(date) => setFormData({...formData, due_date: date?.toDate()})}
              calendar={persian}
              locale={persian_fa}
              calendarPosition="bottom-right"
              inputClass="w-full p-3 rounded-xl border outline-none placeholder:text-gray-300"
              placeholder="تاریخ یادآوری..."
            />
          </div>

          <button type="submit" className="col-span-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700">
            ثبت هزینه
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="text-gray-500 text-xs border-b">
            <tr>
              <th className="pb-3">عنوان</th>
              <th className="pb-3">مبلغ</th>
              <th className="pb-3">دسته‌بندی</th>
              <th className="pb-3">تاریخ</th>
              <th className="pb-3">سررسید</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {expenses.map(exp => (
              <tr key={exp.id}>
                <td className="py-3 font-bold text-gray-800">{exp.title}</td>
                <td className="py-3 text-red-600 font-mono">{parseInt(exp.amount).toLocaleString()}</td>
                <td className="py-3 text-sm text-gray-500">{exp.category}</td>
                <td className="py-3 text-sm text-gray-500">
                  {new Date(exp.date).toLocaleDateString('fa-IR')}
                </td>
                <td className="py-3 text-sm text-gray-500">
                  {exp.due_date ? (
                    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg w-fit">
                      <Bell className="w-3 h-3" />
                      {new Date(exp.due_date).toLocaleDateString('fa-IR')}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
