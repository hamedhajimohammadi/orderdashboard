
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // اجرای کوئری‌ها به صورت موازی برای سرعت بیشتر
    const [pending, active, issues, completed] = await Promise.all([
      // 1. Pending: سفارش‌های منتظر امروز (شامل waiting و pending)
      prisma.order.count({
        where: {
          status: { in: ['waiting', 'pending'] }, // ✅ اصلاح: شامل waiting هم باشد
          order_date: { gte: startOfDay } // ✅ اصلاح: استفاده از order_date
        }
      }),
      // 2. Active: سفارش‌های در حال انجام (فقط امروز)
      prisma.order.count({
        where: {
          status: 'processing',
          order_date: { gte: startOfDay } // ✅ اصلاح: فیلتر تاریخ اضافه شد
        }
      }),
      // 3. Issues: مشکلات (امروز تغییر وضعیت داده شده‌اند)
      prisma.order.count({
        where: {
          status: { in: ['wrong-info', 'refund-req'] },
          updated_at: { gte: startOfDay }
        }
      }),
      // 4. Completed: تکمیل شده‌های امروز
      prisma.order.count({
        where: {
          status: 'completed',
          completed_at: { gte: startOfDay }
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        pending,
        active,
        issues,
        completed
      }
    });

  } catch (error) {
    console.error("Stats API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
