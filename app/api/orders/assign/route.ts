import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logOrderAction } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth';
import { addWooCommerceNote, updateWooCommerceStatus } from '@/lib/woocommerce';

export async function POST(req: Request) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ message: 'Order ID is required' }, { status: 400 });
    }

    // Fetch fresh user data to ensure consistency with other APIs
    const user = await prisma.user.findUnique({
        where: { id: currentUser.id }
    });

    let operatorName = user?.display_name;
    if (!operatorName && user?.first_name && user?.last_name) {
        operatorName = `${user.first_name} ${user.last_name}`;
    }
    if (!operatorName) {
        operatorName = user?.admin_username || currentUser.username;
    }

    // 🔒 جلوگیری از تداخل (Race Condition)
    // به جای اینکه اول بخوانیم و بعد آپدیت کنیم (که ممکن است در کسری از ثانیه دو نفر همزمان بخوانند)،
    // از آپدیت اتمیک استفاده می‌کنیم. یعنی فقط در صورتی آپدیت کن که اپراتور خالی باشد یا خود کاربر باشد.
    const updateResult = await prisma.order.updateMany({
      where: {
        id: orderId,
        OR: [
          { operator_name: null },
          { operator_name: "" },
          { operator_name: operatorName } // اگر قبلاً مال خودمون بود هم اوکیه
        ]
      },
      data: {
        operator_name: operatorName,
        assigned_at: new Date(),
        status: 'processing',
      },
    });

    if (updateResult.count === 0) {
      // اگر آپدیت انجام نشد، یعنی سفارش توسط شخص دیگری گرفته شده است
      return NextResponse.json({ 
        message: '⛔ این سفارش لحظاتی پیش توسط همکار دیگری رزرو شد.' 
      }, { status: 409 });
    }

    // دریافت اطلاعات سفارش برای ارسال به ووکامرس
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: { wp_order_id: true }
    });

    // ثبت لاگ
    await logOrderAction({
      orderId: orderId,
      adminName: operatorName,
      action: 'ASSIGN_OPERATOR',
      description: 'رزرو سفارش توسط اپراتور',
    });

    // ✅ ارسال یادداشت به ووکامرس
    if (order && order.wp_order_id) {
        // 1. تغییر وضعیت در ووکامرس به "در حال انجام"
        await updateWooCommerceStatus(order.wp_order_id, 'processing');

        // 2. ثبت یادداشت
        await addWooCommerceNote(
            order.wp_order_id, 
            `وضعیت سفارش به "در حال انجام" تغییر یافت. اپراتور: ${operatorName}`,
            true // قابل مشاهده برای مشتری
        );
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Assign error:', error);
    return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
  }
}
