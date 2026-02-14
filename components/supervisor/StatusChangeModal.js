
"use client";
import { useState } from 'react';

const STATUS_OPTIONS = [
  { value: 'waiting', label: 'آماده انجام (Waiting)' }, // ✅ اضافه شد
  { value: 'pending', label: 'در انتظار پرداخت (Pending)' },
  { value: 'processing', label: 'در حال انجام (Processing)' },
  { value: 'completed', label: 'تکمیل شده (Completed)' },
  { value: 'wrong-info', label: 'اطلاعات اشتباه (Wrong Info)' },
  { value: 'need-verification', label: 'نیاز به احراز (Need Verification)' },
  { value: 'refund-req', label: 'درخواست استرداد (Refund Request)' },
  { value: 'refunded', label: 'مسترد شده (Refunded)' }, // ✅ اضافه شد
  { value: 'cancelled', label: 'لغو شده (Cancelled)' },
];

export default function StatusChangeModal({ order, onClose, onSave }) {
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [note, setNote] = useState('');

  const handleSave = () => {
    onSave(order.id, selectedStatus, note);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 m-4">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-lg font-bold text-gray-800">تغییر وضعیت سفارش #{order.id}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">✕</button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">وضعیت جدید</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-black"
            >
              {STATUS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">یادداشت (اختیاری)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="علت تغییر وضعیت..."
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px] text-black placeholder:text-gray-400"
              dir="rtl"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
          <button 
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition"
          >
            انصراف
          </button>
          <button 
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition"
          >
            تایید و تغییر وضعیت
          </button>
        </div>
      </div>
    </div>
  );
}
