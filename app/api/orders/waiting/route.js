import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'; // جلوگیری از کش شدن

export async function GET() {
  try {
    // محاسبه شروع امروز (۰۰:۰۰ بامداد)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // محاسبه زمان برش (۱۹ ساعت قبل)
    const cutoffTime = new Date(Date.now() - 19 * 60 * 60 * 1000);

    // 💡 اصلاح تخصصی: دریافت سفارش‌هایی که در وضعیت "waiting" (صف انتظار) هستند
    // یا سفارش‌هایی که "processing" هستند اما اپراتور ندارند (لگاسی)
    // ✅ فیلتر: فقط سفارش‌های بعد از ۳۱ دسامبر ۲۰۲۵ (طبق درخواست کاربر)
    const CUTOFF_DATE = new Date('2025-12-31T00:00:00.000Z');

    const waitingOrders = await prisma.order.findMany({
      where: {
        AND: [
            {
                OR: [
                    { status: 'waiting' },
                    { status: 'processing', operator_name: null }
                ]
            },
            {
                order_date: { gte: CUTOFF_DATE }
            }
        ]
      },
      include: {
        user: true 
      },
      orderBy: [
        { is_pinned: 'desc' },
        { order_date: 'desc' }
      ]
    });

    // تبدیل BigInt به String برای جلوگیری از ارور JSON
    const safeOrders = JSON.parse(JSON.stringify(waitingOrders, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    // ✅ ارسال پاسخ موفق با دیتای واقعی
    return NextResponse.json({ 
      success: true, 
      data: safeOrders,
      debug: {
        startOfDay: startOfDay.toISOString(),
        serverTime: new Date().toISOString(),
        count: waitingOrders.length
      }
    });
  } catch (error) {
    console.error("خطا در API صف انتظار:", error);
    return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 });
  }
}