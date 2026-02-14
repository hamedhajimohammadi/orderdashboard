import { NextResponse } from 'next/server';
import { syncOrderWithWooCommerce } from '@/lib/sync-helper';

export const dynamic = 'force-dynamic'; // جلوگیری از کش شدن

export async function GET(req: Request) {
  try {
    // 1. تنظیمات ووکامرس
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (!siteUrl || !key || !secret) {
      return NextResponse.json({ error: 'WooCommerce config missing' }, { status: 500 });
    }

    // 2. دریافت ۱۰ سفارش آخر (برای اطمینان از اینکه چیزی جا نیفتاده)
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');
    const wcRes = await fetch(`${siteUrl}/wp-json/wc/v3/orders?per_page=10`, {
      headers: {
        'Authorization': `Basic ${auth}`
      },
      cache: 'no-store'
    });

    if (!wcRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch from WooCommerce' }, { status: wcRes.status });
    }

    const orders = await wcRes.json();
    const results = [];

    // 3. همگام‌سازی هر سفارش
    for (const order of orders) {
        try {
            const result = await syncOrderWithWooCommerce(order);
            results.push({ id: order.id, status: 'synced', internalId: result.id });
        } catch (e: any) {
            console.error(`Error syncing order ${order.id}:`, e);
            results.push({ id: order.id, status: 'error', error: e.message });
        }
    }

    return NextResponse.json({ 
        success: true, 
        count: orders.length,
        results 
    });

  } catch (error: any) {
    console.error('❌ Cron Sync Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
