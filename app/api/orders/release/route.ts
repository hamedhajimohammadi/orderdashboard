import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logOrderAction } from '@/lib/logger';
import { getCurrentUser } from '@/lib/auth';
import { addWooCommerceNote } from '@/lib/woocommerce';

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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    // 1. آپدیت ووکامرس به وضعیت processing
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    try {
        const wcOrderId = order.wp_order_id.toString();
        await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wcOrderId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'processing' }),
            cache: 'no-store',
        });
    } catch (e) {
        console.error("Failed to reset WC status:", e);
    }

    // 2. آپدیت سفارش در دیتابیس (آزاد کردن + بازگشت به صف انتظار)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        operator_name: null,
        assigned_at: null,
        status: 'waiting', // ✅ بازگشت به صف انتظار (آماده انجام)
      },
    });

    // ثبت لاگ
    await logOrderAction({
      orderId: orderId,
      adminName: currentUser.display_name || currentUser.username,
      action: 'RELEASE_ORDER',
      description: 'رهاسازی سفارش توسط اپراتور',
    });

    // ✅ ارسال یادداشت به ووکامرس
    await addWooCommerceNote(
        order.wp_order_id, 
        `وضعیت سفارش به "در انتظار بررسی" تغییر یافت.`,
        true
    );

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Release error:', error);
    return NextResponse.json({ message: 'Server Error', error: error.message }, { status: 500 });
  }
}
