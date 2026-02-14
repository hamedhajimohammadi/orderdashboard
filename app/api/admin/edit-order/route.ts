
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { updateWooCommerceStatus, addWooCommerceNote } from '@/lib/woocommerce';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { orderId, ...updates } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: "Order ID required" }, { status: 400 });
    }

    // دریافت نام ادمین فعلی
    let adminDisplayName = 'Admin';
    if (currentUser) {
        const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
        if (user) adminDisplayName = user.display_name || user.admin_username;
    }

    // 1. دریافت اطلاعات فعلی سفارش (برای گرفتن ID ووکامرس)
    const currentOrder = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      select: { wp_order_id: true, status: true }
    });

    if (!currentOrder) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    // اگر وضعیت به تکمیل شده تغییر می‌کند، نام اپراتور را آپدیت کن
    if (updates.status === 'completed') {
        updates.operator_name = adminDisplayName;
        updates.completed_at = new Date();
        updates.is_pinned = false; // Unpin on completion
    }

    // اگر وضعیت به waiting تغییر می‌کند، اپراتور را حذف کن
    if (updates.status === 'waiting') {
        updates.operator_name = null;
        updates.assigned_at = null;
    }

    // 2. آپدیت در دیتابیس خودمان
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updates
    });

    // 3. همگام‌سازی با ووکامرس (اگر وضعیت تغییر کرده باشد)
    if (updates.status || updates.wp_status) {
        const newStatus = updates.wp_status || updates.status;
        
        // نگاشت وضعیت‌های داخلی به وضعیت‌های استاندارد ووکامرس
        // (Mapping is now handled centrally in lib/woocommerce.ts)
        let statusText = newStatus;

        if (newStatus === 'sent' || newStatus === 'delivered') { statusText = 'تکمیل شده'; }
        else if (newStatus === 'canceled_by_admin') { statusText = 'لغو شده'; }
        else if (newStatus === 'waiting') { statusText = 'آماده انجام'; }
        else if (newStatus === 'processing') { statusText = 'در حال انجام'; }
        else if (newStatus === 'refunded') { statusText = 'مسترد شده'; }
        else if (newStatus === 'failed') { statusText = 'ناموفق'; }
        else if (newStatus === 'wrong-info') { statusText = 'اطلاعات اشتباه'; }
        else if (newStatus === 'need-verification') { statusText = 'نیاز به احراز'; }
        else if (newStatus === 'refund-req') { statusText = 'درخواست استرداد'; }

        // الف) تغییر وضعیت در ووکامرس
        await updateWooCommerceStatus(currentOrder.wp_order_id, newStatus);

        // ب) درج یادداشت برای مشتری
        await addWooCommerceNote(
            currentOrder.wp_order_id,
            `وضعیت سفارش شما به "${statusText}" تغییر یافت.`,
            true
        );
    }

    const serializedData = JSON.parse(JSON.stringify(updatedOrder, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: serializedData });
  } catch (error: any) {
    console.error("Edit Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

