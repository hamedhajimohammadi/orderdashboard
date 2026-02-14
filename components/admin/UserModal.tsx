'use client';
import { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  isSubmitting: boolean;
}

export default function UserModal({ isOpen, onClose, onSubmit, initialData, isSubmitting }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    display_name: '',
    role: 'shop_manager',
    daily_quota: 0,
    bonus_rate: 0,
    base_salary: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          username: initialData.admin_username || initialData.username || '',
          password: '',
          display_name: initialData.display_name,
          role: initialData.role,
          daily_quota: initialData.daily_quota,
          bonus_rate: initialData.bonus_rate,
          base_salary: initialData.base_salary ? initialData.base_salary.toLocaleString() : '',
        });
      } else {
        setFormData({
          username: '',
          password: '',
          display_name: '',
          role: 'shop_manager',
          daily_quota: 50,
          bonus_rate: 5000,
          base_salary: '',
        });
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '');
    if (!isNaN(Number(raw))) {
      setFormData({ ...formData, base_salary: Number(raw).toLocaleString() });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      base_salary: parseInt(formData.base_salary.replace(/,/g, '') || '0'),
      id: initialData?.id,
    };
    onSubmit(payload);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">
            {initialData ? 'ویرایش اطلاعات پرسنل' : 'افزودن عضو جدید'}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-200 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">نام نمایشی</label>
              <input
                required
                type="text"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">نام کاربری</label>
              <input
                required
                disabled={!!initialData}
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition disabled:bg-gray-100 text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">
                {initialData ? 'رمز عبور جدید (اختیاری)' : 'رمز عبور'}
              </label>
              <input
                required={!initialData}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full p-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-left"
                dir="ltr"
              />
            </div>

            {/* ✅ تغییر فقط همین بخش select طبق دستور شما */}
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">نقش کاربری</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full p-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="shop_manager">ادمین انجام سفارش (Operator)</option>
                <option value="supervisor">سوپروایزر (supervisor)</option>
                <option value="administrator">مدیر کل (Super Admin)</option>
              </select>
            </div>
          </div>

          <div className="border-t border-dashed my-2"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">حقوق ثابت</label>
              <input
                type="text"
                value={formData.base_salary}
                onChange={handleSalaryChange}
                className="w-full p-2.5 border rounded-xl outline-none text-left font-mono"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">تارگت روزانه</label>
              <input
                type="number"
                value={formData.daily_quota}
                onChange={(e) => setFormData({ ...formData, daily_quota: parseInt(e.target.value) })}
                className="w-full p-2.5 border rounded-xl outline-none text-left font-mono"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700">پاداش هر سفارش</label>
              <input
                type="number"
                value={formData.bonus_rate}
                onChange={(e) => setFormData({ ...formData, bonus_rate: parseInt(e.target.value) })}
                className="w-full p-2.5 border rounded-xl outline-none text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-bold disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              <span>{initialData ? 'ذخیره' : 'ساخت کاربر'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
