import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { updateWooCommerceStatus, addWooCommerceNote } from '@/lib/woocommerce';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    const body = await request.json();
    const { orderId, customer_note, metadata, status } = body;

    if (!orderId) {
      return NextResponse.json({ success: false, message: 'Order ID is required' }, { status: 400 });
    }

    const updateData = {
      customer_note,
      metadata
    };

    if (status) {
      updateData.status = status;
      if (status === 'completed') {
          updateData.completed_at = new Date();
          // دریافت نام ادمین فعلی
          let adminDisplayName = 'Admin';
          if (currentUser) {
              const user = await prisma.user.findUnique({ where: { id: currentUser.id } });
              if (user) adminDisplayName = user.display_name || user.admin_username;
          }
          updateData.operator_name = adminDisplayName;
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(orderId) },
      data: updateData
    });

    // Sync with WooCommerce if status changed
    if (status && updatedOrder.wp_order_id) {
        // Mapping is now handled inside updateWooCommerceStatus
        await updateWooCommerceStatus(updatedOrder.wp_order_id, status);
        
        // Add note about status change
        const operatorName = currentUser?.display_name || currentUser?.username || 'Admin';
        const statusLabels = {
            'processing': 'در حال انجام',
            'completed': 'تکمیل شده',
            'refunded': 'مسترد شده',
            'cancelled': 'لغو شده',
            'failed': 'ناموفق',
            'on-hold': 'در انتظار بررسی',
            'pending': 'در انتظار پرداخت',
            'waiting': 'آماده انجام',
            'refund-req': 'درخواست استرداد',
            'wrong-info': 'اطلاعات اشتباه',
            'need-verification': 'نیاز به احراز'
        };
        const statusText = statusLabels[status] || status;
        
        await addWooCommerceNote(
            updatedOrder.wp_order_id,
            `وضعیت سفارش به "${statusText}" تغییر یافت. اپراتور: ${operatorName}`,
            true
        );
    }

    // Serialize BigInt fields

    // Serialize BigInt fields
    const safeOrder = JSON.parse(JSON.stringify(updatedOrder, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    ));

    return NextResponse.json({ success: true, data: safeOrder });
  } catch (error) {
    console.error("Edit Order Error:", error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
