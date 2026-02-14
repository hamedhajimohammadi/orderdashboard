import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useOrderStore = create(
  persist(
    (set, get) => ({
      // --- وضعیت‌های موقت ---
      pendingOrders: [],
      allOrders: [],
      myHistoryOrders: [], // اضافه شده
      currentNotes: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0 },
      isLoading: false,
      isLoadingNotes: false,
      isSearching: false,

      // --- وضعیت‌های دائم ---
      currentUser: null, // اضافه شده: اطلاعات کاربر لاگین شده
      activeOrders: [],
      isOnline: true,
      lastLoginTime: Date.now(),
      totalOnlineSeconds: 0,
      dailyStats: { completed: 0, target: 25, bonusRate: 5000 },

      // ۰. دریافت اطلاعات کاربر
      fetchCurrentUser: async () => {
        try {
          const res = await fetch('/api/me');
          const result = await res.json();
          if (result.success) {
            set({ currentUser: result.data });
          }
        } catch (e) {
          console.error("Failed to fetch user info");
        }
      },

      // ۱. دریافت یادداشت‌ها
      fetchOrderNotes: async (orderId) => {
        set({ isLoadingNotes: true, currentNotes: [] });
        try {
          const res = await fetch(`/api/notes?id=${orderId}`);
          const data = await res.json();
          set({ 
            currentNotes: Array.isArray(data) ? data : [], 
            isLoadingNotes: false 
          });
        } catch (error) {
          set({ currentNotes: [], isLoadingNotes: false });
        }
      },

      // ۱.۵. ثبت یادداشت
      saveOrderNote: async (orderId, note, refreshId = null) => {
        try {
          const res = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, note })
          });
          if (res.ok) {
            get().fetchOrderNotes(refreshId || orderId);
          }
        } catch (e) { console.error(e); }
      },

      // ۲. دریافت صف انتظار (Marketplace)
      fetchOrders: async () => {
        // پاکسازی خودکار میز کار از هر وضعیتی جز processing
        const { activeOrders } = get();
        const filteredActive = activeOrders.filter(o => o.status === 'processing');
        if (filteredActive.length !== activeOrders.length) {
            set({ activeOrders: filteredActive });
        }

        set({ isLoading: true });
        try {
          // الف) دریافت صف انتظار
          const res = await fetch('/api/orders/waiting');
          const result = await res.json();
          if (result.success) {
            // Deduplicate orders by ID to prevent key collisions
            const uniqueOrders = Array.from(new Map(result.data.map(item => [item.id, item])).values());
            set({ pendingOrders: uniqueOrders });
          }

          // ب) سینک کردن میز کار با سرور (برای جلوگیری از عدم تطابق)
          const activeRes = await fetch('/api/my-active-orders');
          const activeResult = await activeRes.json();
          if (activeResult.success) {
             set({ activeOrders: activeResult.data });
          }

          set({ isLoading: false });
        } catch (error) { set({ isLoading: false }); }
      },

      // ۳. دریافت لیست جامع (History)
      fetchAllOrders: async (query = "", page = 1) => {
        set({ isSearching: true });
        try {
            // اضافه کردن پارامتر fromToday=true برای فیلتر کردن سفارش‌های قدیمی
            const url = query 
                ? `/api/orders/search?q=${encodeURIComponent(query)}` 
                : `/api/orders?status=all&page=${page}&limit=50&fromToday=true`;
                
            const res = await fetch(url);
            const result = await res.json();
            
            if (result.success) {
                set({ 
                    allOrders: result.data, 
                    pagination: result.pagination || { currentPage: 1, totalPages: 1 },
                    isSearching: false 
                });
            } else {
                set({ allOrders: [], isSearching: false });
            }
        } catch (e) {
            set({ isSearching: false });
        }
      },

      // ۳.۵. دریافت سوابق من (My History)
      fetchMyHistory: async () => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/my-history');
          const result = await res.json();
          if (result.success) {
            set({ 
                myHistoryOrders: result.data, 
                dailyStats: result.dailyStats || get().dailyStats, // آپدیت آمار روزانه از سرور
                isLoading: false 
            });
          }
        } catch (error) {
          set({ isLoading: false });
        }
      },

      // ۴. رزرو سفارش
      reserveOrder: async (orderId) => {
        const { pendingOrders, activeOrders, isOnline } = get();
        
        if (!isOnline) return alert("🔴 ابتدا آنلاین شوید!");
        if (activeOrders.length >= 4) return alert("⛔ میز کار پر است!");

        const order = pendingOrders.find((o) => o.id === orderId);
        
        if (order) {
          if (order.status !== 'waiting') {
            alert("⚠️ فقط سفارش‌های 'آماده انجام' (Waiting) قابل رزرو هستند.");
            return;
          }

          try {
            await fetch('/api/orders/assign', {
                method: 'POST',
                body: JSON.stringify({ orderId: order.id })
            });

            set({
              activeOrders: [...activeOrders, order],
              pendingOrders: pendingOrders.filter((o) => o.id !== orderId),
            });
            
            get().fetchOrderNotes(order.wp_order_id || order.id);
          } catch (e) {
            alert("خطا در رزرو سفارش.");
          }
        }
      },

      // ۵. انصراف و بازگشت به صف (اصلاح شده)
      releaseOrder: async (orderId) => {
        const { activeOrders, pendingOrders } = get();
        const order = activeOrders.find((o) => o.id === orderId);
        
        if (order) {
          try {
            // آپدیت در دیتابیس
            await fetch('/api/orders/release', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: order.id })
            });

            // آپدیت در ظاهر (با جلوگیری از تکرار)
            const newPending = [order, ...pendingOrders.filter(o => o.id !== orderId)];
            // Deduplicate again just in case
            const uniquePending = Array.from(new Map(newPending.map(item => [item.id, item])).values());

            set({
              activeOrders: activeOrders.filter((o) => o.id !== orderId),
              pendingOrders: uniquePending,
              currentNotes: []
            });
            return true;
          } catch (error) {
            alert("خطا در بازگشت به صف.");
            return false;
          }
        }
      },

      // ۶. آپدیت وضعیت (تکمیل و...)
      updateOrderStatus: async (orderId, actionType, note = "") => {
        const { activeOrders, dailyStats } = get();
        
        // پیدا کردن سفارش برای دریافت شناسه ووکامرس
        const order = activeOrders.find(o => o.id === orderId);
        const wpOrderId = order ? order.wp_order_id : orderId;

        // نگاشت وضعیت‌ها
        let status = actionType;
        if (actionType === 'wrong_info') status = 'wrong-info';
        if (actionType === 'verification') status = 'need-verification';
        if (actionType === 'refund-req') status = 'refund-req'; // Explicit mapping

        set({ 
            activeOrders: activeOrders.filter((o) => o.id !== orderId),
            currentNotes: [] 
        });

        if (status === 'completed') {
            set({ dailyStats: { ...dailyStats, completed: dailyStats.completed + 1 } });
        }

        try {
            await fetch('/api/update-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: wpOrderId, status, note })
            });
            get().fetchOrders();
            get().fetchMyHistory(); // اضافه شده: بروزرسانی سوابق بلافاصله بعد از تغییر وضعیت
        } catch (e) { console.error(e); }
      },

      // ۷. مدیریت آنلاین/آفلاین
      toggleOnline: async () => {
        const { isOnline, lastLoginTime, totalOnlineSeconds } = get();
        const now = Date.now();
        
        // Optimistic update
        if (isOnline) {
            const sessionSeconds = Math.floor((now - lastLoginTime) / 1000);
            set({ isOnline: false, totalOnlineSeconds: totalOnlineSeconds + sessionSeconds, lastLoginTime: null });
        } else { 
            set({ isOnline: true, lastLoginTime: now }); 
        }

        // Sync with server
        try {
            await fetch('/api/admin/toggle-status', { method: 'POST' });
        } catch (e) {
            console.error("Failed to sync online status", e);
        }
      },

      // ۸. کنترل صفحات
      nextPage: () => {
          const { pagination, fetchAllOrders } = get();
          if (pagination.currentPage < pagination.totalPages) {
              fetchAllOrders("", pagination.currentPage + 1);
          }
      },
    
      prevPage: () => {
          const { pagination, fetchAllOrders } = get();
          if (pagination.currentPage > 1) {
              fetchAllOrders("", pagination.currentPage - 1);
          }
      },
    }),
    {
      name: 'order-dashboard-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        activeOrders: state.activeOrders,
        dailyStats: state.dailyStats,
        isOnline: state.isOnline,
        lastLoginTime: state.lastLoginTime,
        totalOnlineSeconds: state.totalOnlineSeconds
      }),
    }
  )
);