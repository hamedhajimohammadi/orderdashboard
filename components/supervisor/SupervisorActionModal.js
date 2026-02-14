'use client';
import { useState, useEffect } from 'react';
import { X, Save, RefreshCcw, ShieldCheck, Banknote, AlertTriangle, Edit3, Lock, ChevronLeft } from 'lucide-react';
import useSupervisorStore from '@/store/useSupervisorStore';

export default function SupervisorActionModal({ isOpen, onClose, order }) {
  const updateOrderAndStatus = useSupervisorStore((state) => state.updateOrderAndStatus);
  
  const [dynamicFields, setDynamicFields] = useState({});
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (order) {
      setDynamicFields({
        email: order.email || '',
        password: order.password || '',
        backupCode: order.backupCode || '',
        playerTag: order.playerTag || '',
        extraInfo: order.extraInfo || '',
        server: order.server || '',
      });
      setStatus(order.status);
    }
  }, [order]);

  if (!isOpen || !order) return null;

  // شرط نمایش باکس اصلاح اطلاعات: فقط اگر وضعیت فعلی سفارش 'wrong_info' باشد
  const showEditFields = order.status === 'wrong_info';

  const handleSave = () => {
    updateOrderAndStatus(order.id, dynamicFields, status);
    onClose();
  };

  const allStatusOptions = [
    { id: 'pending', label: 'آماده انجام (بازگشت به صف)', icon: RefreshCcw, color: 'emerald' },
    { id: 'wrong_info', label: 'اطلاعات اشتباه (توقف کار)', icon: AlertTriangle, color: 'orange' },
    { id: 'kyc_pending', label: 'نیاز به احراز هویت', icon: ShieldCheck, color: 'blue' },
    { id: 'refund_pending', label: 'انتقال به صف استرداد', icon: Banknote, color: 'red' },
    { id: 'refunded', label: 'مسترد شد (پایان عملیات)', icon: X, color: 'gray' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 text-right" dir="rtl">
      <div className={`bg-white rounded-3xl w-full shadow-2xl overflow-hidden transition-all duration-300 ${showEditFields ? 'max-w-2xl' : 'max-w-md'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-sm ${showEditFields ? 'bg-orange-500' : 'bg-indigo-600'}`}>
                {showEditFields ? <Edit3 size={18} /> : <RefreshCcw size={18} />}
            </div>
            <div>
                <h3 className="font-black text-gray-800 text-sm">
                    {showEditFields ? 'اصلاح اطلاعات و تغییر وضعیت' : 'تغییر وضعیت سریع'}
                </h3>
                <p className="text-[10px] text-gray-400 font-mono text-left" dir="ltr">{order.orderCode}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* بخش ۱: فیلدهای اصلاح اطلاعات - فقط در صورت وضعیت اشتباه نمایش داده می‌شود */}
          {showEditFields && (
            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 border-b border-orange-50 pb-2">
                  <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                  <h4 className="text-xs font-black text-orange-600">اصلاح دیتای ورودی کاربر</h4>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(dynamicFields).map((key) => (
                  <div key={key} className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-900 mr-1">{getLabel(key)}</label>
                    <input 
                      type="text" 
                      value={dynamicFields[key]}
                      onChange={(e) => setDynamicFields({...dynamicFields, [key]: e.target.value})}
                      className="w-full bg-white border border-orange-100 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none transition-all font-medium text-black"
                      dir={['email', 'password', 'backupCode'].includes(key) ? 'ltr' : 'rtl'}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* بخش ۲: دکمه‌های تغییر وضعیت */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
                <div className="w-1.5 h-4 bg-gray-400 rounded-full"></div>
                <h4 className="text-xs font-black text-gray-600">انتخاب وضعیت جدید</h4>
            </div>
            <div className={`grid gap-2 ${showEditFields ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {allStatusOptions
                  .filter(opt => opt.id !== order.status)
                  .map((opt) => (
                    <button 
                        key={opt.id}
                        onClick={() => setStatus(opt.id)}
                        className={`flex items-center justify-between px-4 py-3 rounded-2xl text-[11px] font-black border-2 transition-all
                          ${status === opt.id 
                            ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700 shadow-sm` 
                            : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-200 hover:text-gray-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <opt.icon size={14} />
                            {opt.label}
                        </div>
                        {status === opt.id && <ChevronLeft size={14} />}
                    </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-gray-50 border-t border-gray-100 flex gap-3">
            <button 
              onClick={handleSave} 
              className="flex-2 grow bg-gray-900 hover:bg-black text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-gray-200"
            >
                <Save size={16} /> ثبت و بروزرسانی
            </button>
            <button onClick={onClose} className="flex-1 py-3.5 bg-white border border-gray-200 text-gray-400 rounded-2xl font-bold hover:bg-gray-100 transition-all text-xs">
                انصراف
            </button>
        </div>
      </div>
    </div>
  );
}

function getLabel(key) {
    const labels = {
        email: 'ایمیل / نام کاربری',
        password: 'رمز عبور',
        backupCode: 'کد بکاپ / شناسایی',
        playerTag: 'تگ بازیکن / آیدی',
        extraInfo: 'توضیحات تکمیلی',
        server: 'سرور / ریجن'
    };
    return labels[key] || key;
}