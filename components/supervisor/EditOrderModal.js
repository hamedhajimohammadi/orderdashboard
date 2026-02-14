
"use client";
import { useState, useEffect } from 'react';

export default function EditOrderModal({ order, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customer_note: '',
    metadata: {}
  });

  useEffect(() => {
    if (order) {
      let initialMetadata = {};
      
      // 1. Try to get keys from existing metadata (if previously saved)
      const savedMetadata = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {});
      
      if (Object.keys(savedMetadata).length > 0) {
        initialMetadata = savedMetadata;
      } else {
        // 2. If no saved metadata, extract keys from snapshot_data (WooCommerce original data)
        if (order.snapshot_data && order.snapshot_data.line_items && order.snapshot_data.line_items.length > 0) {
          const item = order.snapshot_data.line_items[0];
          if (item.meta_data) {
            item.meta_data.forEach(meta => {
               if (meta.key && !meta.key.startsWith('_') && meta.key !== 'pa_platform') {
                 initialMetadata[meta.key] = ''; // Initialize with empty string
               }
            });
          }
        }
      }
      
      // 3. Filter keys based on allowed keywords (Email, Password, Backup Code)
      const allowedKeywords = ['email', 'ایمیل', 'password', 'pass', 'رمز', 'backup', 'code', 'کد'];
      
      const filteredKeys = Object.keys(initialMetadata).filter(key => {
        const lowerKey = key.toLowerCase();
        return allowedKeywords.some(keyword => lowerKey.includes(keyword));
      });

      // Clear values but keep keys so supervisor knows what to fill
      const clearedMetadata = {};
      filteredKeys.forEach(key => {
        clearedMetadata[key] = '';
      });

      setFormData({
        customer_note: '', // Start empty as requested
        metadata: clearedMetadata
      });
    }
  }, [order]);

  const handleMetadataChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    // اگر سفارش در وضعیت "اطلاعات اشتباه" باشد، با ذخیره کردن به "در انتظار" (صف) برمی‌گردد
    const shouldMoveToQueue = order.status === 'wrong-info';
    
    onSave(order.id, {
      customer_note: formData.customer_note,
      metadata: formData.metadata,
      status: shouldMoveToQueue ? 'processing' : undefined // تغییر وضعیت خودکار به "در حال انجام"
    });
  };

  if (!order) return null;

  const isWrongInfo = order.status === 'wrong-info';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h3 className="text-xl font-bold text-gray-800">
            {isWrongInfo ? 'اصلاح اطلاعات و بازگشت به صف' : `ویرایش اطلاعات سفارش #${order.id}`}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* یادداشت مشتری */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">یادداشت مشتری / توضیحات</label>
            <textarea
              value={formData.customer_note}
              onChange={(e) => setFormData({ ...formData, customer_note: e.target.value })}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[100px] text-black placeholder:text-gray-400"
              dir="rtl"
            />
          </div>

          {/* متادیتا (فرم‌های ورودی) */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">اطلاعات فرم (Metadata)</label>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              {Object.entries(formData.metadata).map(([key, value]) => (
                <div key={key} className="flex flex-col md:flex-row gap-2 md:items-center">
                  <span className="text-xs font-mono text-gray-900 font-bold w-1/3 truncate" title={key}>{key}</span>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleMetadataChange(key, e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-black placeholder:text-gray-400"
                  />
                </div>
              ))}
              {Object.keys(formData.metadata).length === 0 && (
                <p className="text-center text-gray-400 text-sm">هیچ داده اضافی موجود نیست.</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8 pt-4 border-t">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 font-medium transition"
          >
            انصراف
          </button>
          <button 
            onClick={handleSave}
            className={`px-6 py-2.5 rounded-xl text-white font-bold shadow-lg transition flex items-center gap-2 ${
              isWrongInfo 
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
            }`}
          >
            {isWrongInfo ? 'ذخیره و ارسال به صف انتظار 🚀' : 'ذخیره تغییرات'}
          </button>
        </div>
      </div>
    </div>
  );
}
