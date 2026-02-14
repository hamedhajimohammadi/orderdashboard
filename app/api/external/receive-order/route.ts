import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendTelegramMessage } from '@/lib/telegram';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    // 1. Security Check
    const apiKey = request.headers.get('X-API-KEY');
    const secret = process.env.SYNC_API_SECRET;

    if (!secret || apiKey !== secret) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    const { id, status, customer, total, currency, date_created, meta_data } = body;

    if (!id) {
      return NextResponse.json({ message: 'Missing Order ID' }, { status: 400 });
    }

    console.log(`📥 Received Order #${id} via Direct API. Status: ${status}`);

    // 3. Upsert User (Customer)
    let userId = null;
    if (customer && customer.phone) {
      const phone = customer.phone.replace(/\s+/g, '').replace(/^(\+98|0098)/, '0');
      
      const user = await prisma.user.upsert({
        where: { phone_number: phone },
        update: {
          first_name: customer.first_name || undefined,
          last_name: customer.last_name || undefined,
          total_spent: customer.total_spent ? parseFloat(customer.total_spent) : undefined,
          orders_count: customer.orders_count ? parseInt(customer.orders_count) : undefined,
        },
        create: {
          phone_number: phone,
          first_name: customer.first_name,
          last_name: customer.last_name,
          role: 'customer',
          total_spent: customer.total_spent ? parseFloat(customer.total_spent) : 0,
          orders_count: customer.orders_count ? parseInt(customer.orders_count) : 1,
        }
      });
      userId = user.id;
    }

    // 4. Map Status
    let internalStatus = 'pending';
    if (status === 'processing') internalStatus = 'waiting'; // Default for new paid orders
    else if (status === 'completed') internalStatus = 'completed';
    else if (status === 'cancelled') internalStatus = 'cancelled';
    else if (status === 'refunded') internalStatus = 'refunded';
    else if (status === 'failed') internalStatus = 'failed';
    else if (status === 'on-hold') internalStatus = 'pending';
    else if (status === 'pending') internalStatus = 'pending';
    
    // Check for specific internal statuses passed from WC (if any)
    // e.g. if WC sends 'wc-wrong-info', we map it back
    if (status === 'wc-wrong-info') internalStatus = 'wrong-info';
    if (status === 'wc-need-verification') internalStatus = 'need-verification';
    if (status === 'wc-awaiting-refund') internalStatus = 'refund-req';

    // 5. Upsert Order
    // Check if order exists first to avoid unnecessary updates if nothing changed
    const existingOrder = await prisma.order.findUnique({
      where: { wp_order_id: BigInt(id) }
    });

    let order;
    if (existingOrder) {
      // If order exists, only update if status or total changed
      // This prevents "duplicate processing" logic if the webhook/API sends the same data twice
      if (existingOrder.status !== internalStatus || existingOrder.wp_status !== status) {
        console.log(`🔄 Updating existing order #${id}: ${existingOrder.status} -> ${internalStatus}`);
        order = await prisma.order.update({
          where: { id: existingOrder.id },
          data: {
            status: internalStatus,
            wp_status: status,
            total_amount_gross: parseFloat(total || '0'),
            final_payable: parseFloat(total || '0'),
            updated_at: new Date(),
            ...(userId ? { user_id: userId } : {})
          }
        });
      } else {
        console.log(`⏭️ Order #${id} already exists and is up to date. Skipping.`);
        return NextResponse.json({ success: true, orderId: existingOrder.id, message: 'Already up to date' });
      }
    } else {
      // Create new order
      console.log(`✨ Creating new order #${id}`);
      order = await prisma.order.create({
        data: {
          wp_order_id: BigInt(id),
          status: internalStatus,
          wp_status: status,
          order_title: `Order #${id}`,
          total_amount_gross: parseFloat(total || '0'),
          final_payable: parseFloat(total || '0'),
          order_date: new Date(date_created || new Date()),
          user_id: userId || 1,
          payment_method: 'unknown',
          metadata: meta_data || {}
        }
      });
    }

    // 6. Send Telegram Notification (Only for new 'waiting' orders)
    if (internalStatus === 'waiting') {
       // Logic to check if it's a *newly* waiting order could be added here
       // For now, we just log it.
       console.log(`🔔 New Waiting Order: #${id}`);
    }

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    console.error('❌ Error processing direct order push:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
