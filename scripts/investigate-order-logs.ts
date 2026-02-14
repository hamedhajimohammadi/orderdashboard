
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function investigateOrderLogs() {
  const wpOrderId = 5053172;

  console.log(`🔍 Investigating logs for Order #${wpOrderId}...`);

  try {
    // 1. Find the order
    const order = await prisma.order.findUnique({
      where: { wp_order_id: BigInt(wpOrderId) },
      include: {
        logs: {
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!order) {
      console.error(`❌ Order #${wpOrderId} not found in the database.`);
      return;
    }

    console.log(`✅ Order Found: Internal ID ${order.id}`);
    console.log(`   Current Status: ${order.status}`);
    console.log(`   Current Operator: ${order.operator_name}`);
    console.log(`   Created At: ${order.created_at}`);
    console.log(`   Updated At: ${order.updated_at}`);
    console.log('---------------------------------------------------');
    console.log('📜 Activity Logs:');
    console.log('---------------------------------------------------');

    if (order.logs.length === 0) {
      console.log('   No logs found for this order.');
    } else {
      order.logs.forEach((log) => {
        console.log(`[${log.created_at.toISOString()}] ${log.admin_name || 'System'} performed '${log.action}'`);
        console.log(`   Details: ${log.description || 'N/A'}`);
        if (log.old_status || log.new_status) {
          console.log(`   Status Change: ${log.old_status} -> ${log.new_status}`);
        }
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ Error fetching logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateOrderLogs();
