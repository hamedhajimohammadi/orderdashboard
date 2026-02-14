
import { prisma } from '../lib/prisma';

async function checkFarnazOrders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  console.log('Checking orders for operator "farnaz" completed since:', today);

  const orders = await prisma.order.findMany({
    where: {
      operator_name: 'farnaz',
      status: 'completed',
      completed_at: {
        gte: today
      }
    },
    select: {
      id: true,
      wp_order_id: true,
      operator_name: true,
      completed_at: true,
      status: true
    }
  });

  console.log(`Found ${orders.length} orders:`);
  console.table(orders);
}

checkFarnazOrders()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
