
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { getWooCommerceOrdersBatch } from '../lib/woocommerce';

const prisma = new PrismaClient();

async function checkSyncStatus() {
  console.log("🚀 Checking for sync discrepancies...");

  // 1. Get last 100 completed orders from DB
  const dbOrders = await prisma.order.findMany({
    where: { status: 'completed' },
    orderBy: { updated_at: 'desc' },
    take: 50
  });

  if (dbOrders.length === 0) {
    console.log("No completed orders found in DB.");
    return;
  }

  console.log(`Found ${dbOrders.length} completed orders in DB. Checking WC status...`);

  // 2. Get their status from WC
  const wpOrderIds = dbOrders.map(o => o.wp_order_id.toString());
  const wcOrders = await getWooCommerceOrdersBatch(wpOrderIds);

  // 3. Compare
  let discrepancyCount = 0;
  for (const dbOrder of dbOrders) {
    const wcOrder = wcOrders.find(o => o.id.toString() === dbOrder.wp_order_id.toString());
    
    if (!wcOrder) {
      console.log(`⚠️ Order #${dbOrder.wp_order_id} not found in WooCommerce response.`);
      continue;
    }

    if (wcOrder.status !== 'completed') {
      console.log(`❌ Discrepancy: Order #${dbOrder.wp_order_id}`);
      console.log(`   - DB Status: ${dbOrder.status}`);
      console.log(`   - WC Status: ${wcOrder.status}`);
      discrepancyCount++;
    }
  }

  if (discrepancyCount === 0) {
    console.log("✅ No discrepancies found in the last 50 orders.");
  } else {
    console.log(`🚨 Found ${discrepancyCount} discrepancies.`);
  }
}

checkSyncStatus()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
