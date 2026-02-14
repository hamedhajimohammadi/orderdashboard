import { NextResponse } from 'next/server';
import { syncOrderWithWooCommerce } from '@/lib/sync-helper';

export async function POST(req: Request) {
  try {
    const { wp_order_id } = await req.json();

    if (!wp_order_id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // 1. دریافت اطلاعات تازه از ووکامرس
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!siteUrl || !key || !secret) {
      return NextResponse.json({ error: 'WooCommerce config missing' }, { status: 500 });
    }

    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const wcRes = await fetch(`${siteUrl}/wp-json/wc/v3/orders/${wp_order_id}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      cache: 'no-store'
    });

    if (!wcRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from WooCommerce' }, { status: wcRes.status });
    }

    const order = await wcRes.json();

    // 2. اجرای منطق بروزرسانی با استفاده از تابع مشترک
    const updatedOrder = await syncOrderWithWooCommerce(order);

    return NextResponse.json({ 
        success: true, 
        message: 'Order synced successfully',
        data: {
            id: updatedOrder.id.toString(),
            status: updatedOrder.status,
            wp_status: updatedOrder.wp_status
        }
    });

  } catch (error: any) {
    console.error('❌ Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
