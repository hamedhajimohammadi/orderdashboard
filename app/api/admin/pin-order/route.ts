
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    const adminName = currentUser?.display_name || currentUser?.username || 'سیستم';

    const { orderId, isPinned } = await request.json();

    // دریافت سفارش برای الحاق یادداشت
    const existingOrder = await prisma.order.findUnique({ 
        where: { id: parseInt(orderId) } 
    });

    if (!existingOrder) {
        return NextResponse.json({ success: false, message: 'Order not found' }, { status: 404 });
    }

    // متن لاگ برای یادداشت
    const noteMessage = isPinned 
        ? `\n[سیستم]: توسط سوپروایزر ${adminName} پین شد (اولویت بالا).`
        : `\n[سیستم]: توسط سوپروایزر ${adminName} از پین خارج شد.`;

    const newNote = (existingOrder.customer_note || '') + noteMessage;

    // آپدیت سفارش
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: { 
          is_pinned: isPinned,
          customer_note: newNote
      }
    });

    // ثبت در جدول لاگ‌ها
    await prisma.orderLog.create({
        data: {
            order_id: parseInt(orderId),
            admin_name: adminName,
            action: isPinned ? 'PIN_ORDER' : 'UNPIN_ORDER',
            description: isPinned ? 'سفارش در لیست اولویت قرار گرفت' : 'سفارش از لیست اولویت خارج شد',
            old_status: existingOrder.status,
            new_status: existingOrder.status
        }
    });

    const serializedData = JSON.parse(JSON.stringify(updatedOrder, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: serializedData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
