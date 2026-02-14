
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    const res = await fetch(`${siteUrl}/wp-json/wc/v3/products/categories?per_page=100`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });

    if (!res.ok) throw new Error('Failed to fetch from WC');
    
    const categories = await res.json();
    let syncedCount = 0;

    for (const cat of categories) {
      await prisma.categoryMargin.upsert({
        where: { wc_id: BigInt(cat.id) },
        update: { name: cat.name }, // فقط نام را آپدیت کن، درصد را نگه دار
        create: {
          wc_id: BigInt(cat.id),
          name: cat.name,
          margin_percent: 0 // پیش‌فرض صفر
        }
      });
      syncedCount++;
    }

    return NextResponse.json({ success: true, message: `Synced ${syncedCount} categories` });
  } catch (error) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
