import { create } from 'zustand';

const useSupervisorStore = create((set, get) => ({
  admins: [], // لیست ادمین‌ها که از دیتابیس لود می‌شود
  allOrders: [], // لیست زنده صف عملیات (Master Queue)
  isLoading: false,

  // 🟢 دریافت اطلاعات زنده از دیتابیس (API)
  fetchLiveStatus: async () => {
    set({ isLoading: true });
    try {
      // این API همزمان لیست ادمین‌ها و صف سفارشات را از دیتابیس می‌آورد
      const res = await fetch('/api/supervisor/live-status');
      const result = await res.json();
      
      if (result.success) {
        set({ 
          admins: result.admins, 
          allOrders: result.orders, 
          isLoading: false 
        });
      }
    } catch (error) {
      console.error("خطا در دریافت وضعیت زنده:", error);
      set({ isLoading: false });
    }
  },

  // 🟢 آزاد کردن اجباری یک اسلات (توسط سوپروایزر)
  forceReleaseSlot: async (orderId) => {
    try {
      await fetch('/api/orders/release', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });
      // رفرش دیتا بعد از تغییر
      get().fetchLiveStatus();
    } catch (error) {
      alert("خطا در آزاد سازی سفارش");
    }
  },

  // 🟢 اختصاص دستی سفارش به ادمین (توسط سوپروایزر)
  assignOrderToAdmin: async (adminId, orderId) => {
    try {
      const res = await fetch('/api/orders/assign', {
        method: 'POST',
        body: JSON.stringify({ adminId, orderId })
      });
      const result = await res.json();
      
      if (result.success) {
        get().fetchLiveStatus();
      } else {
        alert(result.message || "ظرفیت ادمین تکمیل است");
      }
    } catch (error) {
      alert("خطا در واگذاری سفارش");
    }
  },

  // 🟢 تایید احراز هویت (KYC)
  approveKYC: async (orderId) => {
    try {
      await fetch('/api/orders/update', {
        method: 'POST',
        body: JSON.stringify({ orderId, status: 'processing', note: 'تایید هویت توسط سوپروایزر' })
      });
      get().fetchLiveStatus();
    } catch (e) { console.error(e); }
  },

  // 🟢 بازگرداندن سفارش به صف عمومی
  returnToQueue: async (orderId) => {
    try {
      await fetch('/api/orders/release', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });
      get().fetchLiveStatus();
    } catch (e) { console.error(e); }
  }
}));

export default useSupervisorStore;