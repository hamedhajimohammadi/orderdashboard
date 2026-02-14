
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { updateWooCommerceStatus } from '../lib/woocommerce';

const prisma = new PrismaClient();

async function manualSync() {
    console.log("🚀 Starting Manual Sync of 20 Completed Orders...");

    // 1. Get last 20 completed orders from DB
    const orders = await prisma.order.findMany({
        where: { status: 'completed' },
        orderBy: { wp_order_id: 'desc' },
        take: 20
    });

    console.log(`📋 Found ${orders.length} orders to sync.`);

    let successCount = 0;
    let failCount = 0;

    for (const order of orders) {
        const wpId = order.wp_order_id.toString();
        console.log(`🔄 Syncing Order #${wpId}...`);

        try {
            const result = await updateWooCommerceStatus(order.wp_order_id, 'completed');
            if (result) {
                console.log(`✅ Order #${wpId} synced successfully.`);
                successCount++;
            } else {
                console.error(`❌ Order #${wpId} failed to sync.`);
                failCount++;
            }
        } catch (error) {
            console.error(`❌ Exception for Order #${wpId}:`, error);
            failCount++;
        }

        // Small delay to be safe
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n--- Summary ---");
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
}

manualSync()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
