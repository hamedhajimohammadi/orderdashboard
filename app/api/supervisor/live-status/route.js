import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { addWooCommerceNote } from '@/lib/woocommerce';
import { getIranStartOfDay } from '@/lib/utils';

export const dynamic = 'force-dynamic'; // جلوگیری از کش شدن پاسخ

const prisma = new PrismaClient();

function serialize(data) {
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (key === 'admin_password' || key === 'password') return undefined;
    return typeof value === 'bigint' ? value.toString() : value;
  }));
}

export async function GET() {
  try {
    // محاسبه شروع امروز برای شمارش تعداد انجام شده‌ها (به وقت ایران)
    const startOfDay = getIranStartOfDay();
    // محاسبه شروع دیروز (برای نمایش در صف سوپروایزر)
    const startOfYesterday = new Date(startOfDay.getTime() - 24 * 60 * 60 * 1000);
    
    console.log("Supervisor API - StartOfDay:", startOfDay.toISOString());

    // --- اصلاح خودکار دیتا: سفارش‌های processing بدون اپراتور باید waiting باشند ---
    // این بخش برای اصلاح سفارش‌هایی است که قبل از تغییر منطق ثبت شده‌اند
    try {
        await prisma.order.updateMany({
            where: {
                status: 'processing',
                operator_name: null,
                order_date: { gte: startOfDay }
            },
            data: { status: 'waiting' }
        });
    } catch (e) {
        console.error("Auto-fix legacy orders failed", e);
    }
    // ---------------------------------------------------------------------------

    // ۱. دریافت لیست ادمین‌ها
    let admins = await prisma.user.findMany({
      where: { role: { in: ['admin', 'supervisor', 'operator', 'shop_manager'] } },
      orderBy: { is_online: 'desc' }
    });

    // دریافت تعداد مشتریان آنلاین (کسانی که در ۵ دقیقه اخیر فعال بوده‌اند و نقش customer دارند)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineCustomersCount = await prisma.user.count({
        where: {
            role: 'customer',
            last_active_at: { gte: fiveMinutesAgo }
        }
    });

    // اصلاح وضعیت آنلاین بر اساس آخرین فعالیت (۵ دقیقه)
    // طبق درخواست کاربر: ملاک اصلی دکمه شروع/پایان است (is_online در دیتابیس)
    // اما اگر کاربر ۵ دقیقه فعالیت نکرد، می‌توانیم یک فلگ "away" اضافه کنیم، اما فعلاً دست نمی‌زنیم
    // تا دقیقاً همان چیزی که در دیتابیس است نمایش داده شود.
    // admins = admins.map(...) // Removed logic to force offline based on time

    // ۲. دریافت تمام سفارش‌های در حال انجام (Processing)
    // چون رابطه دیتابیس روی operator_name (رشته) است و نه ID، باید جداگانه بگیریم و مپ کنیم
    const activeOrders = await prisma.order.findMany({
        where: { 
          status: 'processing',
          // فیلتر تاریخ: فقط سفارش‌های امروز به بعد
          order_date: { gte: startOfDay }
        },
        orderBy: { assigned_at: 'desc' }
    });

    // --- بررسی و حذف خودکار سفارش‌های مانده بیش از ۱ ساعت ---
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const now = Date.now();
    const staleOrders = activeOrders.filter(order => {
        if (!order.assigned_at) return false;
        const assignedTime = new Date(order.assigned_at).getTime();
        return (now - assignedTime) > ONE_HOUR_MS;
    });

    if (staleOrders.length > 0) {
        console.log(`Found ${staleOrders.length} stale orders. Releasing...`);
        
        for (const order of staleOrders) {
            try {
                // الف) افزودن یادداشت در ووکامرس
                await addWooCommerceNote(
                    order.wp_order_id,
                    "سفارش به دلیل عدم فعالیت بیش از حد مجاز (۱ ساعت) به صورت خودکار آزاد شد.",
                    true
                );

                // ب) آپدیت وضعیت در دیتابیس
                await prisma.order.update({
                    where: { id: order.id },
                    data: {
                        status: 'waiting', // بازگشت به صف انتظار
                        operator_name: null,
                        assigned_at: null
                    }
                });
            } catch (err) {
                console.error(`Failed to auto-release order ${order.id}:`, err);
            }
        }
    }
    // -------------------------------------------------------

    // ۳. دریافت آمار تکمیل شده‌های امروز (گروه‌بندی شده بر اساس نام اپراتور)
    const completedStats = await prisma.order.groupBy({
        by: ['operator_name'],
        where: {
            status: 'completed',
            completed_at: { gte: startOfDay }
        },
        _count: { id: true }
    });
    console.log("Supervisor API - CompletedStats:", JSON.stringify(completedStats));

    // ۴. ترکیب داده‌ها
    const mappedAdmins = admins.map(admin => {
      // نام‌های احتمالی ذخیره شده برای این ادمین
      const possibleNames = [admin.admin_username, admin.display_name].filter(Boolean);

      // پیدا کردن سفارش‌های فعال این ادمین
      const adminOrders = activeOrders.filter(o => possibleNames.includes(o.operator_name)).slice(0, 4);

      // پیدا کردن تعداد تکمیل شده امروز
      const stat = completedStats.find(s => possibleNames.includes(s.operator_name));
      const completedToday = stat ? stat._count.id : 0;

      // محاسبه زمان کارکرد کل (سابقه امروز + نشست فعلی اگر آنلاین است)
      let totalSeconds = admin.worked_seconds_today || 0;
      if (admin.is_online && admin.last_active_at) {
        const currentSession = Math.floor((Date.now() - new Date(admin.last_active_at).getTime()) / 1000);
        totalSeconds += currentSession;
      }

      return {
        ...admin,
        username: admin.admin_username,
        display_name: admin.display_name || admin.admin_username || "ادمین",
        orders: adminOrders, // لیست سفارش‌های فعال که دستی مپ کردیم
        completed_today: completedToday,
        calculated_worked_seconds: totalSeconds
      };
    });

    // 5. دریافت صف انتظار (اصلاح شده: نمایش تمام سفارش‌های دیروز و امروز شامل تکمیل شده‌ها)
    const refundRequests = await prisma.order.findMany({
        where: { status: 'refund-req' },
        include: { user: true },
        orderBy: { updated_at: 'desc' }
    });

    const CUTOFF_DATE = new Date('2025-12-31T00:00:00.000Z');

    const queue = await prisma.order.findMany({
      where: { 
        AND: [
            {
                OR: [
                    // 1. سفارش‌های اخیر (دیروز و امروز) با هر وضعیتی
                    { order_date: { gte: startOfYesterday } },
                    // 2. سفارش‌های باز و در جریان (حتی اگر قدیمی باشند)
                    { status: { in: ['waiting', 'processing', 'wc-awaiting-auth', 'need-verification', 'wrong-info', 'refund-req', 'on-hold'] } }
                ]
            },
            {
                order_date: { gte: CUTOFF_DATE }
            }
        ]
      },
      // حذف محدودیت تعداد (take) تا همه سفارش‌ها نمایش داده شوند
      orderBy: { order_date: 'desc' },
      include: { user: true }
    });
    
    console.log("Supervisor API - Queue Length:", queue.length);

    // ترکیب لیست‌ها و حذف تکراری‌ها (چون ممکن است سفارش استردادی در لیست کلی هم باشد)
    const allOrdersMap = new Map();
    refundRequests.forEach(o => allOrdersMap.set(o.id, o));
    queue.forEach(o => allOrdersMap.set(o.id, o));
    
    const allOrders = Array.from(allOrdersMap.values());

    // Debug: Check for specific order
    const targetOrder = allOrders.find(o => o.wp_order_id === 5052960n || o.wp_order_id === 5052960);
    if (targetOrder) {
      console.log("Supervisor API - Found Target Order 5052960:", { id: targetOrder.id, status: targetOrder.status, date: targetOrder.order_date });
    } else {
      console.log("Supervisor API - Target Order 5052960 NOT FOUND in list of " + allOrders.length);
    }

    return NextResponse.json({ 
        success: true, 
        admins: serialize(mappedAdmins), 
        orders: serialize(allOrders),
        onlineCustomers: onlineCustomersCount
    });

  } catch (error) {
    console.error("Supervisor API Error:", error);
    return NextResponse.json({ success: false, admins: [], orders: [] });
  }
}