import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { updateWooCommerceStatus, getWooCommerceOrdersBatch } from '@/lib/woocommerce';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. دریافت ۴۰ سفارش آخر که در پنل "تکمیل شده" هستند
    // کاربر درخواست کرد: ۳ یا ۴ پارت ۱۰ تایی (مجموعا ۳۰ تا ۴۰ تا)
    const completedInPanel = await prisma.order.findMany({
      where: {
        status: 'completed'
      },
      orderBy: {
        wp_order_id: 'desc' // جدیدترین‌ها بر اساس ID
      },
      take: 40
    });

    if (completedInPanel.length === 0) {
        return NextResponse.json({ success: true, report: { total: 0, success: 0, failed: 0, skipped: 0, details: [] } });
    }

    const results = {
      total: completedInPanel.length,
      success: 0,
      failed: 0,
      skipped: 0,
      details: [] as any[]
    };

    // 2. پردازش در دسته‌های ۱۰ تایی
    const BATCH_SIZE = 10;
    
    for (let i = 0; i < completedInPanel.length; i += BATCH_SIZE) {
        const batch = completedInPanel.slice(i, i + BATCH_SIZE);
        const orderIds = batch.map(o => o.wp_order_id.toString());
        
        console.log(`🔄 Syncing Batch ${i/BATCH_SIZE + 1}: IDs ${orderIds.join(', ')}`);

        // الف) دریافت وضعیت فعلی از ووکامرس
        const wcOrders = await getWooCommerceOrdersBatch(orderIds);
        
        if (!wcOrders || wcOrders.length === 0) {
            console.error(`❌ Batch ${i/BATCH_SIZE + 1} failed: No response from WC.`);
            // لاگ می‌کنیم اما ادامه می‌دهیم شاید بچ بعدی درست باشد
            results.failed += batch.length;
            continue; 
        }

        const wcStatusMap = new Map();
        wcOrders.forEach((o: any) => {
            wcStatusMap.set(o.id.toString(), o.status);
        });

        // ب) بررسی و آپدیت تک تک سفارش‌های این بچ
        await Promise.all(batch.map(async (order) => {
            const idStr = order.wp_order_id.toString();
            const currentWcStatus = wcStatusMap.get(idStr);

            if (!currentWcStatus) {
                results.failed++;
                results.details.push({ id: idStr, error: "Status check failed - Skipped" });
                return;
            }

            // شرط مهم: اگر در سایت هم تکمیل شده است، کاری نکن
            if (currentWcStatus === 'completed') {
                results.skipped++;
                return;
            }

            // اگر وضعیت در سایت تکمیل شده نیست، آپدیت کن
            try {
                console.log(`⚡ Updating Order #${idStr} from '${currentWcStatus}' to 'completed'`);
                const success = await updateWooCommerceStatus(order.wp_order_id, 'completed');
                
                if (success) {
                    results.success++;
                    results.details.push({ id: idStr, status: 'synced', old: currentWcStatus });
                } else {
                    results.failed++;
                    results.details.push({ id: idStr, error: "Failed to sync" });
                }
            } catch (e: any) {
                results.failed++;
                results.details.push({ id: idStr, error: e.message });
            }
        }));

        // تاخیر کوچک بین بچ‌ها برای جلوگیری از فشار روی سرور
        if (i + BATCH_SIZE < completedInPanel.length) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    return NextResponse.json({ success: true, report: results });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
