
import { prisma } from '../lib/prisma';

async function checkAllFarnazOrders() {
  console.log('Checking ALL orders for operator "farnaz"');

  const orders = await prisma.order.findMany({
    where: {
      operator_name: 'farnaz',
    },
    select: {
      id: true,
      wp_order_id: true,
      operator_name: true,
      completed_at: true,
      status: true
    },
    orderBy: {
      completed_at: 'desc'
    },
    take: 10
  });

  console.log(`Found ${orders.length} orders (showing last 10):`);
  console.table(orders);
}

checkAllFarnazOrders()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
