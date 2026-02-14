
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getWooCommerceOrdersBatch, updateWooCommerceStatus } from '@/lib/woocommerce';
import { syncOrderWithWooCommerce } from '@/lib/sync-helper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("🚀 [Cron] Starting Advanced Sync Watchdog...");
    const fixedOrders = [];
    let fixedCount = 0;

    // =================================================================
    // 1️⃣ OUTGOING SYNC (Panel -> Site)
    // =================================================================
    // Fix statuses that are critical in Panel but might be stuck in Site
    // =================================================================
    const criticalStatuses = ['completed', 'need-verification', 'wrong-info', 'refund-req', 'failed', 'cancelled'];
    
    const dbOrders = await prisma.order.findMany({
      where: { 
        status: { in: criticalStatuses },
        updated_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      },
      orderBy: { updated_at: 'desc' },
      take: 50
    });

    if (dbOrders.length > 0) {
        const wpOrderIds = dbOrders.map(o => o.wp_order_id.toString());
        const wcOrders = await getWooCommerceOrdersBatch(wpOrderIds);

        for (const dbOrder of dbOrders) {
            const wcOrder = wcOrders.find(o => o.id.toString() === dbOrder.wp_order_id.toString());
            if (!wcOrder) continue;

            // Map DB status to expected WC status (simplified check)
            // We rely on updateWooCommerceStatus logic to map correctly
            // Here we just check if they are "equivalent" enough to skip
            // But since mapping is complex, we trust the update function to be idempotent-ish
            // or we check specific mismatches.
            
            let needsUpdate = false;
            if (dbOrder.status === 'completed' && wcOrder.status !== 'completed') needsUpdate = true;
            if (dbOrder.status === 'need-verification' && wcOrder.status !== 'need-verification') needsUpdate = true;
            if (dbOrder.status === 'wrong-info' && wcOrder.status !== 'wrong-info') needsUpdate = true;
            if (dbOrder.status === 'refund-req' && wcOrder.status !== 'pending-refund') needsUpdate = true;
            if (dbOrder.status === 'failed' && wcOrder.status !== 'failed') needsUpdate = true;
            if (dbOrder.status === 'cancelled' && wcOrder.status !== 'cancelled') needsUpdate = true;

            if (needsUpdate) {
                console.log(`🔄 [Cron] Outgoing Fix: Order #${dbOrder.wp_order_id} (DB: ${dbOrder.status} -> WC: ${wcOrder.status})`);
                const success = await updateWooCommerceStatus(dbOrder.wp_order_id, dbOrder.status);
                if (success) {
                    fixedCount++;
                    fixedOrders.push(`OUT-${dbOrder.wp_order_id}`);
                }
            }
        }
    }

    // =================================================================
    // 2️⃣ INCOMING SYNC (Site -> Panel)
    // =================================================================
    // Import missing orders OR update orders that moved forward in Site (e.g. Pending -> Processing)
    // =================================================================
    
    // Fetch last 20 orders from WooCommerce (regardless of status)
    const siteUrl = process.env.WC_SITE_URL;
    const key = process.env.WC_CONSUMER_KEY;
    const secret = process.env.WC_CONSUMER_SECRET;

    if (siteUrl && key && secret) {
        const auth = Buffer.from(`${key}:${secret}`).toString('base64');
        const wcRes = await fetch(`${siteUrl}/wp-json/wc/v3/orders?per_page=20&orderby=date&order=desc`, {
            headers: { 'Authorization': `Basic ${auth}` },
            cache: 'no-store'
        });

        if (wcRes.ok) {
            const contentType = wcRes.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                const recentWcOrders = await wcRes.json();
                
                for (const wcOrder of recentWcOrders) {
                    const dbOrder = await prisma.order.findFirst({
                        where: { wp_order_id: BigInt(wcOrder.id) }
                    });

                    let shouldSync = false;

                    // Case A: Missing Order
                    if (!dbOrder) {
                        console.log(`📥 [Cron] Importing Missing Order #${wcOrder.id}`);
                        shouldSync = true;
                    } 
                    // Case B: Status Mismatch (Site moved forward)
                    else {
                        // If Site is Processing (Paid) but Panel is Pending (Unpaid)
                        if (wcOrder.status === 'processing' && (dbOrder.status === 'pending' || dbOrder.status === 'on-hold' || dbOrder.status === 'failed')) {
                            console.log(`📥 [Cron] Incoming Update: Order #${wcOrder.id} (Site: Processing -> Panel: ${dbOrder.status})`);
                            shouldSync = true;
                        }
                        // If Site is Completed but Panel is Processing (Auto-complete from site?)
                        // Usually we don't want this, but if user asks... 
                        // User said: "If order enters site, it should enter panel".
                        
                        // If Site is Cancelled/Failed/Refunded, update Panel
                        if (['cancelled', 'failed', 'refunded'].includes(wcOrder.status) && dbOrder.status !== wcOrder.status) {
                             console.log(`📥 [Cron] Incoming Update: Order #${wcOrder.id} (Site: ${wcOrder.status} -> Panel: ${dbOrder.status})`);
                             shouldSync = true;
                        }
                    }

                    if (shouldSync) {
                        await syncOrderWithWooCommerce(wcOrder);
                        fixedCount++;
                        fixedOrders.push(`IN-${wcOrder.id}`);
                    }
                }
            } else {
                const text = await wcRes.text();
                console.error("❌ [Cron] Fix Sync: Received non-JSON response:", text.substring(0, 200));
            }
        }
    }

    return NextResponse.json({ 
      success: true, 
      fixedCount, 
      fixedOrders 
    });

  } catch (error: any) {
    console.error("❌ [Cron] Sync Watchdog Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
