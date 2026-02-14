
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getWooCommerceOrdersBatch, updateWooCommerceStatus } from '../lib/woocommerce';

const prisma = new PrismaClient();

async function fixSyncDiscrepancies() {
  console.log("🚀 Starting Sync Watchdog...");

  // 1. Get last 100 completed orders from DB
  const dbOrders = await prisma.order.findMany({
    where: { status: 'completed' },
    orderBy: { updated_at: 'desc' },
    take: 100
  });

  if (dbOrders.length === 0) {
    console.log("No completed orders found in DB.");
    return;
  }

  console.log(`Checking ${dbOrders.length} orders...`);

  // 2. Get their status from WC
  const wpOrderIds = dbOrders.map(o => o.wp_order_id.toString());
  const wcOrders = await getWooCommerceOrdersBatch(wpOrderIds);

  // 3. Compare and Fix
  let fixedCount = 0;
  for (const dbOrder of dbOrders) {
    const wcOrder = wcOrders.find(o => o.id.toString() === dbOrder.wp_order_id.toString());
    
    if (!wcOrder) {
      console.log(`⚠️ Order #${dbOrder.wp_order_id} not found in WooCommerce response.`);
      continue;
    }

    if (wcOrder.status !== 'completed') {
      console.log(`❌ Discrepancy found: Order #${dbOrder.wp_order_id}`);
      console.log(`   - DB Status: ${dbOrder.status}`);
      console.log(`   - WC Status: ${wcOrder.status}`);
      
      console.log(`🔄 Attempting to fix...`);
      const success = await updateWooCommerceStatus(dbOrder.wp_order_id, 'completed');
      
      if (success) {
        console.log(`✅ Fixed Order #${dbOrder.wp_order_id}`);
        fixedCount++;
      } else {
        console.log(`❌ Failed to fix Order #${dbOrder.wp_order_id}`);
      }
    }
  }

  console.log(`🏁 Watchdog finished. Fixed ${fixedCount} orders.`);
}

fixSyncDiscrepancies()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
